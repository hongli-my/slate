//! Filesystem operations for the Slate code editor.
//!
//! Commands:
//! - `save_file_atomic`: crash-safe atomic write via temp file + fsync + rename.
//! - `file_stat`: stat (size / mtime / is_dir); `Ok(None)` if missing. Used by
//!   the editor to detect external modifications before save / buffer switch.
//! - `read_text_file_detect`: read bytes and decode with a BOM / UTF-8 / GBK /
//!   Shift-JIS heuristic, reporting the encoding used. Size-capped + binary
//!   heuristic to avoid OOM / garbage on huge or binary files.
//! - `search_in_files`: recursive content search over text files.
//! - `scan_dir_tree`: one-shot recursive directory scan returning a flat list
//!   of supported files (replaces the old N-IPC JS recursion in io.scanDir).
//! - `save_recovery` / `load_recovery_list` / `read_recovery` / `clear_recovery`
//!   / `clear_all_recovery`: crash-recovery snapshots of unsaved buffers.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};

// ---------------------------------------------------------------------------
// save_file_atomic
// ---------------------------------------------------------------------------

/// Atomically write `content` to `path`.
///
/// Strategy: write to `{path}.slate-tmp-{pid}` in the SAME directory, `fsync`
/// the temp file, then `rename(2)` it over the target. On Unix `rename` is
/// atomic and replaces the destination, so the target never observes a partial
/// write. On any error the temp file is removed.
#[tauri::command]
pub fn save_file_atomic(path: String, content: String) -> Result<(), String> {
    let pid = std::process::id();
    let tmp_path = format!("{}.slate-tmp-{}", path, pid);

    // Write + fsync the temp file.
    let write_res = (|| -> std::io::Result<()> {
        let mut f = fs::File::create(&tmp_path)?;
        f.write_all(content.as_bytes())?;
        f.sync_all()?; // fsync the file contents to disk
        Ok(())
    })();

    if let Err(e) = write_res {
        let _ = fs::remove_file(&tmp_path);
        return Err(format!("failed to write temp file: {}", e));
    }

    // Atomic rename over the target (atomic on Unix).
    if let Err(e) = fs::rename(&tmp_path, &path) {
        let _ = fs::remove_file(&tmp_path);
        return Err(format!("failed to rename temp file: {}", e));
    }

    Ok(())
}

// ---------------------------------------------------------------------------
// file_stat
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileStat {
    pub size: u64,
    pub mtime_ms: i64,
    pub is_dir: bool,
}

/// Stat a path. Returns `Ok(None)` if it does not exist.
#[tauri::command]
pub fn file_stat(path: String) -> Result<Option<FileStat>, String> {
    let meta = match fs::metadata(&path) {
        Ok(m) => m,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(e) => return Err(e.to_string()),
    };

    let mtime_ms = match meta.modified() {
        Ok(t) => system_time_to_millis(t),
        Err(_) => 0,
    };

    Ok(Some(FileStat {
        size: meta.len(),
        mtime_ms,
        is_dir: meta.is_dir(),
    }))
}

/// Convert a `SystemTime` to milliseconds since `UNIX_EPOCH`. Returns a
/// negative value for times before the epoch (clock skew / legacy timestamps).
fn system_time_to_millis(t: SystemTime) -> i64 {
    match t.duration_since(UNIX_EPOCH) {
        Ok(d) => d.as_millis() as i64,
        Err(e) => -(e.duration().as_millis() as i64),
    }
}

// ---------------------------------------------------------------------------
// read_text_file_detect
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReadResult {
    pub text: String,
    pub encoding: String,
    pub had_errors: bool,
    /// True when the file exceeded `MAX_READ_SIZE` and was truncated.
    pub truncated: bool,
    /// True when the decoded content looks like binary (low printable ratio).
    /// The editor should open such files read-only with a warning rather than
    /// letting the user edit garbage.
    pub is_binary: bool,
    /// Original file size in bytes (for the editor to show a hint).
    pub size: u64,
}

/// Hard cap on how many bytes a single `read_text_file_detect` will decode.
/// Files larger than this are truncated to `MAX_READ_SIZE` bytes (decoded)
/// with `truncated = true`. This prevents OOM / multi-second main-thread
/// freezes when a user opens a 200 MB log file.
const MAX_READ_SIZE: u64 = 10 * 1024 * 1024; // 10 MB

/// Read a file and decode it to text, reporting the encoding used.
///
/// Heuristic (simplest robust approach for a code editor):
/// 1. If the file starts with a BOM, use the BOM-declared encoding
///    (UTF-8 / UTF-16LE / UTF-16BE) via `encoding_rs::Encoding::for_bom`.
/// 2. Otherwise attempt strict UTF-8 (`std::str::from_utf8`).
/// 3. On UTF-8 failure, decode with GBK (common on zh-CN Windows) without
///    replacement; if that also errors, try Shift-JIS.
/// 4. Last resort: UTF-8 with replacement and `had_errors = true`.
///
/// After decoding, a printable-ratio heuristic flags likely-binary files so
/// the editor can open them read-only instead of presenting garbage.
#[tauri::command]
pub fn read_text_file_detect(path: String) -> Result<ReadResult, String> {
    // 先 stat 文件大小：若超过 MAX_READ_SIZE，仅读取前 MAX_READ_SIZE 字节，
    // 避免一次性把数百 MB 的日志/二进制读进内存导致 OOM 或主线程长时间卡顿。
    // metadata 失败时回退到 fs::read（保持原有行为）。
    let (bytes, total_size): (Vec<u8>, u64) = match fs::metadata(&path) {
        Ok(meta) => {
            let len = meta.len();
            if len > MAX_READ_SIZE {
                let f = fs::File::open(&path).map_err(|e| e.to_string())?;
                let mut buf = Vec::with_capacity(MAX_READ_SIZE as usize);
                // take(n) 限制最多读取 n 字节，再 read_to_end 安全收尾。
                f.take(MAX_READ_SIZE)
                    .read_to_end(&mut buf)
                    .map_err(|e| e.to_string())?;
                (buf, len)
            } else {
                let b = fs::read(&path).map_err(|e| e.to_string())?;
                let sz = b.len() as u64;
                (b, sz)
            }
        }
        Err(_) => {
            // 回退：直接读全文件（保留原有行为）。
            let b = fs::read(&path).map_err(|e| e.to_string())?;
            let sz = b.len() as u64;
            (b, sz)
        }
    };

    // Defense-in-depth：即便走 bounded read 路径，这里再裁剪一次确保不超过上限。
    let (buf, truncated) = if total_size > MAX_READ_SIZE {
        let cap = MAX_READ_SIZE as usize;
        if bytes.len() > cap {
            (&bytes[..cap], true)
        } else {
            // 已读取前 cap 字节，但原文件超过上限 → 仍标记 truncated。
            (&bytes[..], true)
        }
    } else {
        (&bytes[..], false)
    };

    let (text, encoding, had_errors) = decode_bytes(buf);

    // Binary heuristic: sample the first 8 KB of the decoded text and measure
    // the printable / whitespace ratio. Binary files decoded as text have a
    // high density of control chars / replacement chars.
    let is_binary = is_likely_binary(&text);

    // For binary files, don't hand the editor megabytes of garbage — cap to
    // a small preview so the buffer is cheap and the warning is visible.
    let final_text = if is_binary {
        text.chars().take(4096).collect::<String>()
    } else {
        text
    };

    Ok(ReadResult {
        text: final_text,
        encoding,
        had_errors,
        truncated,
        is_binary,
        size: total_size,
    })
}

/// Pure decode routine shared by the size-cap path. Returns (text, encoding,
/// had_errors).
fn decode_bytes(bytes: &[u8]) -> (String, String, bool) {
    // 1. BOM?
    if let Some((enc, _bom_len)) = encoding_rs::Encoding::for_bom(bytes) {
        let (cow, _enc_used, had_errors) = enc.decode(bytes);
        return (cow.into_owned(), enc.name().to_string(), had_errors);
    }

    // 2. Strict UTF-8.
    if let Ok(s) = std::str::from_utf8(bytes) {
        return (s.to_string(), "utf-8".to_string(), false);
    }

    // 3. GBK fallback (no replacement -> detect errors).
    let (gbk_cow, gbk_errors) = encoding_rs::GBK.decode_without_bom_handling(bytes);
    if !gbk_errors {
        return (gbk_cow.into_owned(), "gbk".to_string(), false);
    }

    // 3b. Shift-JIS fallback.
    let (sj_cow, sj_errors) = encoding_rs::SHIFT_JIS.decode_without_bom_handling(bytes);
    if !sj_errors {
        return (sj_cow.into_owned(), "shift_jis".to_string(), false);
    }

    // 4. Final fallback: UTF-8 with replacement.
    let (cow, had_errors) = encoding_rs::UTF_8.decode_with_bom_removal(bytes);
    (cow.into_owned(), "utf-8".to_string(), had_errors)
}

/// Heuristic: returns true if `text` looks like decoded binary data.
///
/// Samples the first 8 KB and counts "printable" characters (letters, digits,
/// common punctuation, whitespace). If the ratio is below 70%, treat as
/// binary. This catches the common failure mode where a .bin / .so / image
/// file happens to decode without errors under GBK but is actually garbage.
fn is_likely_binary(text: &str) -> bool {
    // Sample by CHARACTERS, not bytes — slicing `&text[..8192]` would panic
    // if byte 8192 lands inside a multi-byte UTF-8 sequence.
    let sample: String = text.chars().take(8192).collect();
    if sample.is_empty() {
        return false;
    }
    let total = sample.chars().count();
    if total == 0 {
        return false;
    }
    let printable = sample
        .chars()
        .filter(|c| {
            // Standard whitespace.
            matches!(c, ' ' | '\t' | '\n' | '\r') ||
            // Printable ASCII.
            (*c >= ' ' && *c <= '~') ||
            // Any non-control Unicode (letters, CJK, etc.).
            (*c as u32 >= 0xA0)
        })
        .count();
    let ratio = printable as f64 / total as f64;
    ratio < 0.70
}

// ---------------------------------------------------------------------------
// search_in_files
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchOpts {
    #[serde(default)]
    pub case_sensitive: bool,
    #[serde(default)]
    pub regex: bool,
    #[serde(default)]
    pub max_results: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchHit {
    pub path: String,
    pub line: usize,
    pub col: usize,
    pub snippet: String,
}

/// Directory names to always skip during the walk. (Hidden entries starting
/// with `.` — which includes `.git`, `.venv`, `.slate-tmp-*` — are skipped
/// separately by the leading-dot rule below.)
const SKIP_DIRS: &[&str] = &[
    "node_modules",
    "target",
    "dist",
    "build",
    ".next",
    "venv",
    "__pycache__",
];

/// File extensions considered "text" for search purposes.
const TEXT_EXTS: &[&str] = &[
    "md", "txt", "json", "xml", "html", "htm", "css", "js", "ts", "jsx", "tsx", "vue", "svelte",
    "yml", "yaml", "ini", "cfg", "conf", "c", "cpp", "cc", "cxx", "h", "hpp", "py", "sh", "bash",
    "zsh", "fish", "java", "kt", "swift", "go", "rs", "php", "rb", "lua", "pl", "pm", "sql", "r",
    "m", "mm", "scala", "cmake",
];

const MAX_FILE_SIZE: u64 = 5 * 1024 * 1024; // 5 MB
const DEFAULT_MAX_RESULTS: usize = 200;
const SNIPPET_CAP: usize = 200;

/// Recursive content search over text files in `dir`.
///
/// - Skips the directories listed in `SKIP_DIRS`, hidden entries (leading `.`),
///   and Slate temp files (`.slate-tmp-*`, covered by the hidden rule).
/// - Only reads files whose extension is in `TEXT_EXTS`, or whose name is
///   `Makefile` / `Dockerfile` (case-insensitive).
/// - Skips files larger than 5 MB.
/// - Decodes files as UTF-8 (with replacement) before searching.
/// - Matching: a single `regex::Regex` is compiled from the term. In literal
///   mode (`opts.regex == false`) the term is `regex::escape`-d, so matches are
///   literal substrings. Case-insensitivity uses the `(?i)` flag, which yields
///   correct byte offsets (unlike lowercasing both sides, which can shift
///   offsets for non-ASCII text).
/// - Stops as soon as `max_results` hits are collected.
#[tauri::command]
pub fn search_in_files(
    dir: String,
    term: String,
    opts: SearchOpts,
) -> Result<Vec<SearchHit>, String> {
    if term.is_empty() {
        return Ok(Vec::new());
    }

    let max_results = if opts.max_results == 0 {
        DEFAULT_MAX_RESULTS
    } else {
        opts.max_results
    };

    let root = Path::new(&dir);
    if !root.exists() {
        return Err(format!("directory does not exist: {}", dir));
    }

    // Build the search regex.
    let pattern_body = if opts.regex {
        term.clone()
    } else {
        regex::escape(&term)
    };
    let pattern = if opts.case_sensitive {
        pattern_body
    } else {
        format!("(?i){}", pattern_body)
    };
    let re = regex::Regex::new(&pattern).map_err(|e| format!("invalid regex: {}", e))?;

    let mut hits: Vec<SearchHit> = Vec::with_capacity(64);

    let walker = walkdir::WalkDir::new(&dir)
        .into_iter()
        .filter_entry(|e| {
            // Always descend into the root.
            if e.depth() == 0 {
                return true;
            }
            let name = e.file_name();
            let name_str = name.to_string_lossy();
            let name_ref: &str = name_str.as_ref();
            // Skip hidden entries (covers `.git`, `.venv`, `.slate-tmp-*`, ...).
            if name_ref.starts_with('.') {
                return false;
            }
            if e.file_type().is_dir() && SKIP_DIRS.contains(&name_ref) {
                return false;
            }
            true
        });

    for entry in walker {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };
        if !entry.file_type().is_file() {
            continue;
        }

        let path = entry.path();
        let fname = match path.file_name().and_then(|s| s.to_str()) {
            Some(s) => s,
            None => continue,
        };

        // Extension / special-name filter.
        let is_text = match path.extension().and_then(|e| e.to_str()) {
            Some(ext) => {
                let lower = ext.to_lowercase();
                TEXT_EXTS.iter().any(|&t| t == lower.as_str())
            }
            None => {
                let lower = fname.to_lowercase();
                lower == "makefile" || lower == "dockerfile"
            }
        };
        if !is_text {
            continue;
        }

        // Size cap.
        let meta = match fs::metadata(path) {
            Ok(m) => m,
            Err(_) => continue,
        };
        if meta.len() > MAX_FILE_SIZE {
            continue;
        }

        // Read + decode (UTF-8 with replacement; search is best-effort).
        let bytes = match fs::read(path) {
            Ok(b) => b,
            Err(_) => continue,
        };
        let (text_cow, _had_errors) = encoding_rs::UTF_8.decode_with_bom_removal(&bytes);
        let text = text_cow.as_ref();

        let path_str = path.to_string_lossy().into_owned();

        for (i, line) in text.lines().enumerate() {
            let line_no = i + 1;
            for m in re.find_iter(line) {
                // 1-indexed character column.
                let col = line[..m.start()].chars().count() + 1;
                hits.push(SearchHit {
                    path: path_str.clone(),
                    line: line_no,
                    col,
                    snippet: make_snippet(line),
                });
                if hits.len() >= max_results {
                    return Ok(hits);
                }
            }
        }
    }

    Ok(hits)
}

/// Build a search snippet: trim the matched line and cap it to ~200 chars.
fn make_snippet(line: &str) -> String {
    let trimmed = line.trim();
    if trimmed.chars().count() <= SNIPPET_CAP {
        return trimmed.to_string();
    }
    trimmed.chars().take(SNIPPET_CAP).collect()
}

// ---------------------------------------------------------------------------
// scan_dir_tree  (one-shot recursive scan — replaces N-IPC JS recursion)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanEntry {
    pub name: String,
    /// Path relative to the scanned root (uses `/` separators).
    pub path: String,
    pub abs_path: String,
}

/// Directory names to skip during the tree scan. Kept in sync with the JS-side
/// `SKIP_DIRS` so the tree matches what `io.scanDir` produced before.
const TREE_SKIP_DIRS: &[&str] = &[
    "node_modules",
    "target",
    "dist",
    "build",
    ".next",
    ".venv",
    "venv",
    "__pycache__",
    ".git",
    ".svn",
    ".hg",
    ".idea",
    ".vscode",
    "out",
    "coverage",
];

/// File extensions considered "supported" for the file tree. Kept in sync with
/// the JS-side `SUPPORTED_EXTENSIONS` so the tree matches the old behavior.
const TREE_EXTS: &[&str] = &[
    "md", "txt", "markdown", "json", "xml", "html", "htm", "css", "js", "ts", "jsx", "tsx", "vue",
    "svelte", "yml", "yaml", "ini", "cfg", "conf", "properties", "c", "cpp", "cc", "cxx", "h",
    "hpp", "py", "sh", "bash", "zsh", "fish", "java", "kt", "scala", "swift", "go", "rs", "php",
    "rb", "lua", "pl", "pm", "sql", "r", "m", "mm", "groovy", "cmake", "diff", "patch", "ps1",
];

fn is_supported_ext(name: &str) -> bool {
    let lower = name.to_lowercase();
    if lower == "makefile" || lower == "dockerfile" {
        return true;
    }
    match lower.rsplit_once('.') {
        Some((_, ext)) => TREE_EXTS.iter().any(|&t| t == ext),
        None => false,
    }
}

/// Recursively scan `dir` into a flat list of supported files, returned in a
/// single IPC response. Symlink-safe via a `seen` set of canonicalized paths.
///
/// This replaces the old JS recursion in `io.scanDir`, which issued one IPC
/// `readDir` call per directory (N round-trips for N dirs). Directories in
/// `TREE_SKIP_DIRS`, hidden entries, and symlinks pointing to already-visited
/// paths are pruned.
#[tauri::command]
pub fn scan_dir_tree(dir: String) -> Result<Vec<ScanEntry>, String> {
    let root = Path::new(&dir);
    if !root.is_dir() {
        return Err(format!("not a directory: {}", dir));
    }
    let mut out: Vec<ScanEntry> = Vec::new();
    let mut seen: std::collections::HashSet<PathBuf> = std::collections::HashSet::new();
    scan_dir_recursive(root, "", &mut out, &mut seen, 0)?;
    // Stable ordering matching the old JS sort (path.localeCompare).
    out.sort_by(|a, b| a.path.cmp(&b.path));
    Ok(out)
}

/// 递归扫描的深度上限。防止异常深的目录结构（或绕过 canonicalize seen
/// 检测的场景）导致栈溢出 / 长时间扫描。32 层足以覆盖任何正常项目结构。
const MAX_SCAN_DEPTH: usize = 32;

fn scan_dir_recursive(
    dir: &Path,
    base: &str,
    out: &mut Vec<ScanEntry>,
    seen: &mut std::collections::HashSet<PathBuf>,
    depth: usize,
) -> Result<(), String> {
    // 深度上限：超过即停止下探（仍返回当前已收集的条目）。
    if depth >= MAX_SCAN_DEPTH {
        return Ok(());
    }

    // Canonicalize for symlink-loop detection. If canonicalize fails (e.g.
    // permission), fall back to the raw path so we don't skip a real dir.
    let canon = fs::canonicalize(dir).unwrap_or_else(|_| dir.to_path_buf());
    if !seen.insert(canon) {
        return Ok(()); // already visited — symlink loop
    }

    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return Ok(()), // skip unreadable dirs silently
    };

    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().into_owned();
        // Skip hidden entries (covers .git, .venv, .slate-tmp-*, ...).
        if name.starts_with('.') {
            continue;
        }
        let rel = if base.is_empty() {
            name.clone()
        } else {
            format!("{}/{}", base, name)
        };
        let abs = entry.path().to_string_lossy().into_owned();

        let ft = match entry.file_type() {
            Ok(t) => t,
            Err(_) => continue,
        };
        // 符号链接一律不下探：canonicalize 的 seen 检测只能防同文件系统回环，
        // 无法防「链接到 / 或 /Users」之类的任意遍历。链接目录跳过递归；
        // 链接文件也不加入树（与既有行为一致：file_type 对符号链接 is_file() 为 false）。
        if ft.is_symlink() {
            continue;
        }
        if ft.is_dir() {
            if TREE_SKIP_DIRS.contains(&name.as_str()) {
                continue;
            }
            scan_dir_recursive(&entry.path(), &rel, out, seen, depth + 1)?;
        } else if ft.is_file() && is_supported_ext(&name) {
            out.push(ScanEntry {
                name,
                path: rel,
                abs_path: abs,
            });
        }
    }
    Ok(())
}

// ---------------------------------------------------------------------------
// Crash recovery  (unsaved-buffer snapshots)
// ---------------------------------------------------------------------------

/// Subdirectory under the app data dir holding recovery snapshots.
const RECOVERY_SUBDIR: &str = "recovery";
/// Manifest file mapping hash -> original path.
const RECOVERY_MANIFEST: &str = "manifest.json";

fn recovery_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let base = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app_data_dir: {}", e))?;
    let dir = base.join(RECOVERY_SUBDIR);
    fs::create_dir_all(&dir).map_err(|e| format!("create recovery dir: {}", e))?;
    Ok(dir)
}

/// FNV-1a 64-bit hash of a path, returned as hex. Used as the recovery file
/// name so a path containing `/` doesn't collide with the filesystem.
fn path_hash(path: &str) -> String {
    let mut h: u64 = 0xcbf29ce484222325;
    for b in path.as_bytes() {
        h ^= *b as u64;
        h = h.wrapping_mul(0x100000001b3);
    }
    format!("{:016x}", h)
}

/// Read the recovery manifest (hash -> path). Empty map if missing/corrupt.
fn read_manifest(dir: &Path) -> HashMap<String, String> {
    let p = dir.join(RECOVERY_MANIFEST);
    match fs::read(&p) {
        Ok(bytes) => serde_json::from_slice(&bytes).unwrap_or_default(),
        Err(_) => HashMap::new(),
    }
}

/// Write the recovery manifest atomically-ish (best effort).
fn write_manifest(dir: &Path, map: &HashMap<String, String>) -> Result<(), String> {
    let p = dir.join(RECOVERY_MANIFEST);
    let json = serde_json::to_string(map).map_err(|e| e.to_string())?;
    fs::write(&p, json).map_err(|e| e.to_string())
}

/// Save (or replace) a recovery snapshot for `path`. Called by the editor
/// whenever a buffer becomes dirty, debounced on the JS side.
#[tauri::command]
pub fn save_recovery(app: AppHandle, path: String, content: String) -> Result<(), String> {
    if path.is_empty() {
        return Err("empty path".into());
    }
    let dir = recovery_dir(&app)?;
    let h = path_hash(&path);
    // Write content file.
    let content_path = dir.join(&h);
    let tmp = dir.join(format!("{}.tmp", h));
    {
        let mut f = fs::File::create(&tmp).map_err(|e| e.to_string())?;
        f.write_all(content.as_bytes()).map_err(|e| e.to_string())?;
        let _ = f.sync_all();
    }
    fs::rename(&tmp, &content_path).map_err(|e| e.to_string())?;
    // Update manifest.
    let mut map = read_manifest(&dir);
    map.insert(h, path.clone());
    write_manifest(&dir, &map)?;
    Ok(())
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryEntry {
    pub path: String,
    /// mtime of the snapshot file (ms since epoch), for ordering / display.
    pub mtime_ms: i64,
}

/// List all recovery snapshots. Called once at startup to offer restore.
#[tauri::command]
pub fn load_recovery_list(app: AppHandle) -> Result<Vec<RecoveryEntry>, String> {
    let dir = recovery_dir(&app)?;
    let map = read_manifest(&dir);
    let mut out = Vec::with_capacity(map.len());
    for (h, path) in &map {
        let cp = dir.join(h);
        if let Ok(meta) = fs::metadata(&cp) {
            let mtime_ms = match meta.modified() {
                Ok(t) => system_time_to_millis(t),
                Err(_) => 0,
            };
            out.push(RecoveryEntry {
                path: path.clone(),
                mtime_ms,
            });
        }
    }
    out.sort_by(|a, b| a.path.cmp(&b.path));
    Ok(out)
}

/// Read the recovery snapshot content for `path`. Empty string if missing.
#[tauri::command]
pub fn read_recovery(app: AppHandle, path: String) -> Result<String, String> {
    let dir = recovery_dir(&app)?;
    let h = path_hash(&path);
    let cp = dir.join(&h);
    fs::read_to_string(&cp).or_else(|e| {
        if e.kind() == std::io::ErrorKind::NotFound {
            Ok(String::new())
        } else {
            Err(e.to_string())
        }
    })
}

/// Remove the recovery snapshot for `path`. Called after a successful save or
/// when the user discards a recovered buffer.
#[tauri::command]
pub fn clear_recovery(app: AppHandle, path: String) -> Result<(), String> {
    let dir = recovery_dir(&app)?;
    let h = path_hash(&path);
    let cp = dir.join(&h);
    let _ = fs::remove_file(&cp);
    let mut map = read_manifest(&dir);
    if map.remove(&h).is_some() {
        write_manifest(&dir, &map)?;
    }
    Ok(())
}

/// Remove ALL recovery snapshots. Called on a clean exit / explicit clear.
#[tauri::command]
pub fn clear_all_recovery(app: AppHandle) -> Result<(), String> {
    let dir = recovery_dir(&app)?;
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(())
}
