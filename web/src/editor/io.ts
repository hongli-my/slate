// web/src/editor/io.ts
// Tauri bridge — all invoke calls go through here (FIX #18: guard __TAURI__).
// Uses @tauri-apps/api core invoke + plugin-dialog. Falls back to
// window.__TAURI__ globals if the bundled API throws (defensive).

import { invoke as tauriInvoke } from "@tauri-apps/api/core";
import { open as dialogOpen, save as dialogSave } from "@tauri-apps/plugin-dialog";
import { ask } from "@tauri-apps/plugin-dialog";
import { basename } from "./state";

// Fallback to globals if the npm import is unavailable (e.g. bundle loaded
// outside Tauri). All paths go through one guarded invoke.
function safeInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  try {
    if (typeof tauriInvoke === "function") return tauriInvoke<T>(cmd, args);
  } catch {
    /* fall through */
  }
  const w = window as unknown as {
    __TAURI__?: { core?: { invoke?: (c: string, a?: unknown) => Promise<unknown> } };
  };
  const g = w.__TAURI__?.core?.invoke;
  if (typeof g === "function") return g.call(w.__TAURI__!.core, cmd, args) as Promise<T>;
  return Promise.reject(new Error("Tauri not available"));
}

export function isTauriAvailable(): boolean {
  return (
    typeof tauriInvoke === "function" ||
    !!(window as unknown as { __TAURI__?: { core?: { invoke?: unknown } } }).__TAURI__?.core?.invoke
  );
}

// ---- File IO (Rust commands in fs_ops.rs) ----

export interface ReadResult {
  text: string;
  encoding: string;
  hadErrors: boolean;
  /** File exceeded the read size cap and was truncated. */
  truncated: boolean;
  /** Decoded content looked like binary (low printable ratio). */
  isBinary: boolean;
  /** Original file size in bytes. */
  size: number;
}
export interface FileStat {
  size: number;
  mtimeMs: number;
  isDir: boolean;
}
export interface SearchHit {
  path: string;
  line: number;
  col: number;
  snippet: string;
}
export interface RecentItem {
  kind: "file" | "folder";
  path: string;
  name: string;
  time: number;
}

/** FIX #20: encoding-aware read. */
export async function readTextFile(path: string): Promise<ReadResult> {
  return safeInvoke<ReadResult>("read_text_file_detect", { path });
}

/** FIX #10: atomic save (temp file + fsync + rename). */
export async function saveFileAtomic(path: string, content: string): Promise<void> {
  await safeInvoke<void>("save_file_atomic", { path, content });
}

/** FIX #11: stat (size / mtime / isDir); null if missing. */
export async function fileStat(path: string): Promise<FileStat | null> {
  return safeInvoke<FileStat | null>("file_stat", { path });
}

/** FIX #3: recursive content search implemented in Rust. */
export async function searchInFiles(
  dir: string,
  term: string,
  opts: { caseSensitive: boolean; regex: boolean; maxResults: number }
): Promise<SearchHit[]> {
  return safeInvoke<SearchHit[]>("search_in_files", { dir, term, opts });
}

// ---- Recents (existing Rust commands) ----
export async function recentsList(): Promise<RecentItem[]> {
  try {
    return (await safeInvoke<RecentItem[]>("recents_list")) || [];
  } catch {
    return [];
  }
}
export async function recentsAdd(item: RecentItem): Promise<RecentItem[]> {
  return (await safeInvoke<RecentItem[]>("recents_add", { item })) || [];
}
export async function recentsClear(): Promise<void> {
  await safeInvoke<void>("recents_clear");
}

// ---- File tree scanning uses @tauri-apps/plugin-fs readDir (guarded) ----
interface FsDirEntry {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
}
async function readDir(path: string): Promise<FsDirEntry[]> {
  const w = window as unknown as {
    __TAURI__?: { fs?: { readDir?: (p: string) => Promise<FsDirEntry[]> } };
  };
  const fn = w.__TAURI__?.fs?.readDir;
  if (!fn) throw new Error("fs.readDir unavailable");
  return fn.call(w.__TAURI__!.fs, path);
}

export async function pathJoin(...parts: string[]): Promise<string> {
  const w = window as unknown as {
    __TAURI__?: { path?: { join?: (...p: string[]) => Promise<string> } };
  };
  const fn = w.__TAURI__?.path?.join;
  if (fn) return fn.call(w.__TAURI__!.path, ...parts);
  return parts.join("/").replace(/\/+/g, "/");
}

// ---- File tree scan (one-shot Rust IPC) ----
// The old implementation issued one `readDir` IPC per directory (N round-trips
// for N dirs). It is now a single `scan_dir_tree` call that walks the tree in
// Rust and returns a flat list. SKIP_DIRS / SUPPORTED_EXTENSIONS are kept here
// only for JS-side callers that still reference them; the Rust scan has its
// own copy kept in sync.
const SKIP_DIRS = new Set([
  "node_modules", "target", "dist", "build", ".next", ".venv", "venv",
  "__pycache__", ".git", ".svn", ".hg", ".idea", ".vscode", "out", "coverage",
]);
void SKIP_DIRS;

export const SUPPORTED_EXTENSIONS = new Set([
  "md", "txt", "markdown", "json", "xml", "html", "htm", "css", "js", "ts", "jsx", "tsx", "vue", "svelte",
  "yml", "yaml", "ini", "cfg", "conf", "properties",
  "c", "cpp", "cc", "cxx", "h", "hpp", "py", "sh", "bash", "zsh", "fish",
  "java", "kt", "scala", "swift", "go", "rs", "php", "rb", "lua", "pl", "pm", "sql", "r",
  "m", "mm", "groovy", "cmake", "diff", "patch", "ps1",
]);

export function isSupportedFile(name: string): boolean {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  const lower = name.toLowerCase();
  return SUPPORTED_EXTENSIONS.has(ext) || lower === "makefile" || lower === "dockerfile";
}

export interface ScanEntry {
  name: string;
  path: string;
  absPath: string;
}

/** One-shot recursive scan via a single Rust IPC call. */
export async function scanDirTree(dirPath: string): Promise<ScanEntry[]> {
  return safeInvoke<ScanEntry[]>("scan_dir_tree", { dir: dirPath });
}

/** Recursively scan dir into a flat list of supported files. Symlink-safe.
 *  Signature kept for compatibility; now a single IPC round-trip. */
export async function scanDir(
  dirPath: string,
  _basePath: string,
  out: { name: string; path: string; absPath: string }[]
): Promise<void> {
  const entries = await scanDirTree(dirPath);
  out.length = 0;
  for (const e of entries) out.push({ name: e.name, path: e.path, absPath: e.absPath });
}

export async function removeFile(path: string): Promise<void> {
  const w = window as unknown as {
    __TAURI__?: { fs?: { remove?: (p: string) => Promise<void> } };
  };
  const fn = w.__TAURI__?.fs?.remove;
  if (!fn) throw new Error("fs.remove unavailable");
  await fn.call(w.__TAURI__!.fs, path);
}

export async function writeBytes(path: string, data: Uint8Array): Promise<void> {
  const w = window as unknown as {
    __TAURI__?: { fs?: { writeFile?: (p: string, d: Uint8Array) => Promise<void> } };
  };
  const fn = w.__TAURI__?.fs?.writeFile;
  if (!fn) throw new Error("fs.writeFile unavailable");
  await fn.call(w.__TAURI__!.fs, path, data);
}

// ---- Dialog wrappers (FIX #21: native ask instead of confirm) ----
export async function pickDirectory(): Promise<string | null> {
  try {
    const sel = await dialogOpen({ directory: true, multiple: false });
    return sel ? String(sel) : null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function pickFiles(): Promise<string[] | null> {
  try {
    const sel = await dialogOpen({ multiple: true, directory: false });
    if (!sel) return null;
    return Array.isArray(sel) ? sel.map(String) : [String(sel)];
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function pickSavePath(defaultName: string): Promise<string | null> {
  try {
    const p = await dialogSave({ defaultPath: defaultName });
    return p ? String(p) : null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

/** Native yes/no confirm. */
export async function confirmDialog(message: string, title = "Slate"): Promise<boolean> {
  try {
    return await ask(message, { title, kind: "warning" });
  } catch {
    // Fallback to window.confirm only as last resort (shouldn't happen).
    return window.confirm(message);
  }
}

// ---- Crash recovery (unsaved-buffer snapshots in Rust app_data_dir) ----
export interface RecoveryEntry {
  path: string;
  mtimeMs: number;
}
export function saveRecovery(path: string, content: string): Promise<void> {
  return safeInvoke<void>("save_recovery", { path, content });
}
export function loadRecoveryList(): Promise<RecoveryEntry[]> {
  return safeInvoke<RecoveryEntry[]>("load_recovery_list");
}
export function readRecovery(path: string): Promise<string> {
  return safeInvoke<string>("read_recovery", { path });
}
export function clearRecovery(path: string): Promise<void> {
  return safeInvoke<void>("clear_recovery", { path });
}
export function clearAllRecovery(): Promise<void> {
  return safeInvoke<void>("clear_all_recovery");
}

// ---- External file-change watcher ----
export function watchTrack(path: string): Promise<void> {
  return safeInvoke<void>("watch_track", { path });
}
export function watchUntrack(path: string): Promise<void> {
  return safeInvoke<void>("watch_untrack", { path });
}
export function watchClear(): Promise<void> {
  return safeInvoke<void>("watch_clear");
}

// ---- Web clipper / 截图（Rust commands in webclip.rs） ----

/** 网页抓取结果（与 Rust PageContent 对齐，serde camelCase）。 */
export interface PageContent {
  url: string;
  title: string;
  text: string;
  /** 正文图片 URL（微信公众号等，已过滤内联/图标）。 */
  images: string[];
}

/** 抓取网页正文（供 AI 整理成 markdown 笔记）。 */
export async function fetchPage(url: string): Promise<PageContent> {
  return safeInvoke<PageContent>("fetch_page", { url });
}

/** 把网页配图批量下载到 `{rootDir}/attachments/年/月/`，返回相对 rootDir 的路径。 */
export async function downloadImages(rootDir: string, urls: string[]): Promise<string[]> {
  return (await safeInvoke<string[]>("download_images", { rootDir, urls })) || [];
}

/** macOS 交互式截图（screencapture -i），返回 PNG base64；用户按 Esc 取消返回 null。 */
export async function interactiveScreenshot(): Promise<string | null> {
  return safeInvoke<string | null>("interactive_screenshot");
}

/** 递归建目录（plugin-fs mkdir，capability 已含 fs:allow-mkdir + 任意路径 scope）。 */
export async function mkdirDir(path: string): Promise<void> {
  const w = window as unknown as {
    __TAURI__?: { fs?: { mkdir?: (p: string, o?: { recursive?: boolean }) => Promise<void> } };
  };
  const fn = w.__TAURI__?.fs?.mkdir;
  if (!fn) throw new Error("fs.mkdir unavailable");
  await fn.call(w.__TAURI__!.fs, path, { recursive: true });
}

// ---- macOS 日历（EventKit via cal-bridge） ----
export interface CalEvent {
  title: string;
  start: string;
  end: string;
  calendar: string;
  location: string | null;
  allDay: boolean;
  color?: string;
}
export interface CalReminder {
  title: string;
  calendar: string;
  due: string | null;
  done: boolean;
  color?: string;
}
/** 提醒事项清单（reminder 类型日历）+ 其未完成任务。 */
export interface CalList {
  title: string;
  color?: string;
  items: string[];
}
export interface CalendarData {
  events: CalEvent[];
  reminders: CalReminder[];
  lists: CalList[];
}
/** 读取未来 `days` 天的日历事件 + 未完成提醒事项（只读，数据源是 macOS 系统）。 */
export async function readCalendar(days = 7): Promise<CalendarData> {
  const json = await safeInvoke<string>("read_calendar", { days });
  return JSON.parse(json) as CalendarData;
}

export { basename };
