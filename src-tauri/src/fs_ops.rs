//! Filesystem operations for the Slate code editor.
//!
//! Commands:
//! - `save_file_atomic`: crash-safe atomic write via temp file + fsync + rename.
//! - `file_stat`: stat (size / mtime / is_dir); `Ok(None)` if missing. Used by
//!   the editor to detect external modifications before save / buffer switch.
//! - `read_text_file_detect`: read bytes and decode with a BOM / UTF-8 / GBK /
//!   Shift-JIS heuristic, reporting the encoding used.
//! - `search_in_files`: recursive content search over text files.

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

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
        use std::io::Write;
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
}

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
/// `had_errors` is true when any bytes were replaced or could not be decoded
/// losslessly by the chosen encoding.
#[tauri::command]
pub fn read_text_file_detect(path: String) -> Result<ReadResult, String> {
    let bytes = fs::read(&path).map_err(|e| e.to_string())?;

    // 1. BOM?
    if let Some((enc, _bom_len)) = encoding_rs::Encoding::for_bom(&bytes) {
        let (cow, _enc_used, had_errors) = enc.decode(&bytes);
        return Ok(ReadResult {
            text: cow.into_owned(),
            encoding: enc.name().to_string(),
            had_errors,
        });
    }

    // 2. Strict UTF-8.
    if let Ok(s) = std::str::from_utf8(&bytes) {
        return Ok(ReadResult {
            text: s.to_string(),
            encoding: "utf-8".to_string(),
            had_errors: false,
        });
    }

    // 3. GBK fallback (no replacement -> detect errors).
    let (gbk_cow, gbk_errors) = encoding_rs::GBK.decode_without_bom_handling(&bytes);
    if !gbk_errors {
        return Ok(ReadResult {
            text: gbk_cow.into_owned(),
            encoding: "gbk".to_string(),
            had_errors: false,
        });
    }

    // 3b. Shift-JIS fallback.
    let (sj_cow, sj_errors) = encoding_rs::SHIFT_JIS.decode_without_bom_handling(&bytes);
    if !sj_errors {
        return Ok(ReadResult {
            text: sj_cow.into_owned(),
            encoding: "shift_jis".to_string(),
            had_errors: false,
        });
    }

    // 4. Final fallback: UTF-8 with replacement.
    let (cow, had_errors) = encoding_rs::UTF_8.decode_with_bom_removal(&bytes);
    Ok(ReadResult {
        text: cow.into_owned(),
        encoding: "utf-8".to_string(),
        had_errors,
    })
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
