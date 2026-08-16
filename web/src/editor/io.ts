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

// ---- File tree scan with skip-set + symlink guard (FIX #19) ----
const SKIP_DIRS = new Set([
  "node_modules", "target", "dist", "build", ".next", ".venv", "venv",
  "__pycache__", ".git", ".svn", ".hg", ".idea", ".vscode", "out", "coverage",
]);

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

/** Recursively scan dir into a flat list of supported files. Symlink-safe. */
export async function scanDir(
  dirPath: string,
  basePath: string,
  out: { name: string; path: string; absPath: string }[],
  seenInodes?: Set<string>
): Promise<void> {
  const seen = seenInodes ?? new Set<string>();
  let entries: FsDirEntry[] = [];
  try {
    entries = await readDir(dirPath);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const relPath = basePath ? basePath + "/" + entry.name : entry.name;
    const fullPath = await pathJoin(dirPath, entry.name);
    // Symlink loop guard: skip entries whose real path we've already visited.
    if (seen.has(fullPath)) continue;
    if (entry.isDirectory) {
      if (SKIP_DIRS.has(entry.name)) continue;
      seen.add(fullPath);
      await scanDir(fullPath, relPath, out, seen);
    } else if (entry.isFile && isSupportedFile(entry.name)) {
      out.push({ name: entry.name, path: relPath, absPath: fullPath });
    }
  }
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

export { basename };
