//! External file-change watcher (zero-dependency mtime polling).
//!
//! Sublime's most important "data safety" feature is auto-reloading files
//! changed on disk. Rather than pulling in `notify` + `notify-debouncer-full`
//! (heavy native deps), we poll `fs::metadata(...).modified()` on a small set
//! of tracked paths every 2s from a background thread. For a typical editor
//! session (tens of open files) this is negligible CPU and gives us the same
//! UX without a build-time dependency.
//!
//! The JS side calls `watch_track(path)` when a file is opened and
//! `watch_untrack(path)` when it is closed. On a detected mtime change the
//! thread emits a `file-changed` Tauri event `{ path, mtimeMs }` which the
//! editor listens for to reload (unmodified) or warn (modified).

use std::collections::HashMap;
use std::fs;
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, Manager};

/// Tracked path -> last known mtime (ms since epoch). A missing entry means
/// "track it but we haven't seen its mtime yet" (sentinel `-1`).
pub struct WatchState {
    pub paths: Mutex<HashMap<String, i64>>,
}

impl Default for WatchState {
    fn default() -> Self {
        WatchState {
            paths: Mutex::new(HashMap::new()),
        }
    }
}

const POLL_INTERVAL: Duration = Duration::from_secs(2);

/// Spawn the background polling thread. Called once from `setup`.
pub fn spawn_watcher(app: AppHandle) {
    thread::spawn(move || {
        loop {
            thread::sleep(POLL_INTERVAL);
            // Bail out silently if the app is shutting down (emit may error).
            if poll_once(&app).is_err() {
                break;
            }
        }
    });
}

/// One polling pass. Returns Err if the app handle is no longer usable.
fn poll_once(app: &AppHandle) -> Result<(), ()> {
    let state = app.state::<WatchState>();
    // Snapshot the tracked paths + last mtimes under the lock, then release
    // the lock before doing any fs IO (stat calls can be slow on network
    // mounts; we don't want to hold the lock across them).
    let snapshot: Vec<(String, i64)> = {
        let paths = state.paths.lock().map_err(|_| ())?;
        paths.iter().map(|(p, m)| (p.clone(), *m)).collect()
    };
    if snapshot.is_empty() {
        return Ok(());
    }

    let mut changes: Vec<(String, i64)> = Vec::new();
    let mut updates: HashMap<String, i64> = HashMap::new();

    for (path, last) in snapshot {
        let mtime = match stat_mtime(&path) {
            Some(m) => m,
            None => {
                // File vanished. Emit a change so the editor can warn / close;
                // use a sentinel mtime so the editor can detect deletion.
                if last != -2 {
                    changes.push((path.clone(), -2));
                    updates.insert(path, -2);
                }
                continue;
            }
        };
        if mtime != last {
            changes.push((path.clone(), mtime));
            updates.insert(path, mtime);
        }
    }

    // Apply mtime updates back under the lock.
    if !updates.is_empty() {
        if let Ok(mut paths) = state.paths.lock() {
            for (p, m) in &updates {
                // Only update if still tracked (may have been untracked during
                // the IO window above).
                if let Some(slot) = paths.get_mut(p) {
                    *slot = *m;
                }
            }
        }
    }

    // Emit one event per change. The editor dedupes / handles per-tab.
    for (path, mtime_ms) in changes {
        let _ = app.emit(
            "file-changed",
            serde_json::json!({ "path": path, "mtimeMs": mtime_ms }),
        );
    }
    Ok(())
}

/// Stat a path and return mtime in ms since epoch, or None if missing.
fn stat_mtime(path: &str) -> Option<i64> {
    let meta = fs::metadata(path).ok()?;
    match meta.modified() {
        Ok(t) => Some(system_time_to_millis(t)),
        Err(_) => Some(0),
    }
}

fn system_time_to_millis(t: SystemTime) -> i64 {
    match t.duration_since(UNIX_EPOCH) {
        Ok(d) => d.as_millis() as i64,
        Err(e) => -(e.duration().as_millis() as i64),
    }
}

// ---- commands ----

/// Start tracking a path for external changes. Idempotent.
#[tauri::command]
pub fn watch_track(app: AppHandle, path: String) -> Result<(), String> {
    let state = app.state::<WatchState>();
    let mut paths = state
        .paths
        .lock()
        .map_err(|e| format!("lock: {}", e))?;
    // Seed with the current mtime so we don't fire a spurious "changed" event
    // on the very first poll for an unchanged file.
    let mtime = stat_mtime(&path).unwrap_or(-1);
    paths.insert(path, mtime);
    Ok(())
}

/// Stop tracking a path.
#[tauri::command]
pub fn watch_untrack(app: AppHandle, path: String) -> Result<(), String> {
    let state = app.state::<WatchState>();
    let mut paths = state
        .paths
        .lock()
        .map_err(|e| format!("lock: {}", e))?;
    paths.remove(&path);
    Ok(())
}

/// Stop tracking all paths (e.g. on "close folder").
#[tauri::command]
pub fn watch_clear(app: AppHandle) -> Result<(), String> {
    let state = app.state::<WatchState>();
    let mut paths = state
        .paths
        .lock()
        .map_err(|e| format!("lock: {}", e))?;
    paths.clear();
    Ok(())
}
