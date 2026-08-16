// web/src/editor/files.ts
// File operations wired to Rust commands. Implements:
//   FIX #10: save_file_atomic for all saves.
//   FIX #11: file_stat mtime check before save (warn on external change).
//   FIX #18: all Tauri calls guarded; user-friendly errors.
//   FIX #20: read_text_file_detect for all reads.
//   FIX #21: native dialog ask for delete confirm.

import { state, getActiveTab, basename, type FileRef } from "./state";
import {
  readTextFile,
  saveFileAtomic,
  fileStat,
  recentsList,
  recentsAdd,
  recentsClear,
  scanDir,
  removeFile,
  writeBytes,
  pathJoin,
  pickDirectory,
  pickFiles,
  pickSavePath,
  confirmDialog,
  isTauriAvailable,
} from "./io";
import { addTab, renderTabsBar, switchToTab } from "./tabs";
import { renderTree, buildTree } from "./filetree";
import { toast } from "./ui";
import { updateStatusBar, updateEolLabel } from "./statusbar";
import { updateFormatButtons } from "./preview";
import { saveSession } from "./session";

export async function loadRecents(): Promise<void> {
  if (!isTauriAvailable()) return;
  try {
    state.recents = await recentsList();
    renderTree();
  } catch (e) {
    console.error("加载最近记录失败:", e);
  }
}

export async function addRecent(kind: "file" | "folder", path: string, name: string): Promise<void> {
  if (!isTauriAvailable()) return;
  try {
    state.recents = await recentsAdd({ kind, path, name, time: Date.now() });
    renderTree();
  } catch (e) {
    console.error("保存最近记录失败:", e);
  }
}

export async function clearRecents(): Promise<void> {
  if (!isTauriAvailable()) return;
  try {
    await recentsClear();
    state.recents = [];
    renderTree();
    toast("已清除最近记录");
  } catch (e) {
    console.error("清除最近记录失败:", e);
  }
}

export async function doOpenFolder(): Promise<void> {
  try {
    const dirPath = await pickDirectory();
    if (!dirPath) return;
    await loadFolder(dirPath);
  } catch (err) {
    toast("打开失败: " + (err as Error).message);
  }
}

export async function loadFolder(dirPath: string): Promise<void> {
  state.currentDirPath = dirPath;
  toast("正在扫描...");
  state.scannedFiles = [];
  await scanDir(dirPath, "", state.scannedFiles);
  if (state.scannedFiles.length === 0) {
    toast("没有找到支持的文件");
    return;
  }
  state.scannedFiles.sort((a, b) => a.path.localeCompare(b.path));
  state.folderTree = buildTree(state.scannedFiles, basename(dirPath));
  renderTree();
  toast("已加载 " + state.scannedFiles.length + " 个文件");
  await addRecent("folder", dirPath, basename(dirPath));
}

export async function doOpenFiles(): Promise<void> {
  try {
    const paths = await pickFiles();
    if (!paths) return;
    for (const p of paths) {
      const existing = state.openTabs.find((t) => t.absPath === p);
      if (existing) {
        switchToTab(existing.id);
        continue;
      }
      const name = basename(p);
      let content = "";
      let encoding = "utf-8";
      let eol: "LF" | "CRLF" = "LF";
      try {
        const r = await readTextFile(p); // FIX #20
        content = r.text;
        encoding = r.encoding;
        eol = content.includes("\r\n") ? "CRLF" : "LF";
        content = eol === "CRLF" ? content : content.replace(/\r\n/g, "\n");
      } catch (err) {
        content = "// 加载失败: " + (err as Error).message;
      }
      const stat = await fileStat(p).catch(() => null);
      addTab(name, name, content, p, encoding, eol, stat?.mtimeMs ?? null);
      await addRecent("file", p, name);
    }
  } catch (err) {
    toast("打开失败: " + (err as Error).message);
  }
}

export async function openScannedFile(fileRef: FileRef): Promise<void> {
  const existing = state.openTabs.find((t) => t.path === fileRef.path);
  if (existing) {
    switchToTab(existing.id);
    return;
  }
  let content = "";
  let encoding = "utf-8";
  let eol: "LF" | "CRLF" = "LF";
  let mtimeMs: number | null = null;
  try {
    if (fileRef.absPath) {
      const r = await readTextFile(fileRef.absPath); // FIX #20
      content = r.text;
      encoding = r.encoding;
      eol = content.includes("\r\n") ? "CRLF" : "LF";
      content = eol === "CRLF" ? content : content.replace(/\r\n/g, "\n");
      const stat = await fileStat(fileRef.absPath).catch(() => null);
      mtimeMs = stat?.mtimeMs ?? null;
    }
  } catch (err) {
    content = "// 加载失败: " + (err as Error).message;
  }
  addTab(fileRef.name, fileRef.path, content, fileRef.absPath || null, encoding, eol, mtimeMs);
}

export async function openRecentFolder(dirPath: string): Promise<void> {
  try {
    await loadFolder(dirPath);
  } catch (err) {
    toast("打开失败: " + (err as Error).message);
  }
}

export async function openRecentFile(filePath: string, name: string): Promise<void> {
  try {
    const existing = state.openTabs.find((t) => t.absPath === filePath);
    if (existing) {
      switchToTab(existing.id);
      return;
    }
    const r = await readTextFile(filePath);
    let content = r.text;
    const eol: "LF" | "CRLF" = content.includes("\r\n") ? "CRLF" : "LF";
    content = eol === "CRLF" ? content : content.replace(/\r\n/g, "\n");
    const stat = await fileStat(filePath).catch(() => null);
    addTab(name || basename(filePath), name || basename(filePath), content, filePath, r.encoding, eol, stat?.mtimeMs ?? null);
    await addRecent("file", filePath, name || basename(filePath));
  } catch (err) {
    toast("打开失败: " + (err as Error).message);
  }
}

export function doNewFile(): void {
  const name = "untitled-" + Date.now().toString().slice(-4) + ".txt";
  addTab(name, name, "", null);
  renderTree();
  toast("已新建文件");
}

/** FIX #10 + #11: atomic save with mtime check. Returns true on success. */
export async function saveCurrentFile(): Promise<boolean> {
  const view = state.view;
  const tab = getActiveTab();
  if (!view || !tab) {
    toast("没有打开的文件");
    return false;
  }

  // Determine the on-disk EOL form: keep CRLF files as CRLF when saving.
  const docText = view.state.doc.toString();
  const saveText = tab.eol === "CRLF" ? docText.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n") : docText;

  if (tab.absPath) {
    // FIX #11: detect external modification via mtime.
    try {
      const stat = await fileStat(tab.absPath);
      if (stat && tab.mtimeMs != null && stat.mtimeMs !== tab.mtimeMs) {
        const ok = await confirmDialog(
          `"${tab.name}" 已被外部程序修改。是否仍然覆盖保存？`,
          "文件已变化"
        );
        if (!ok) {
          toast("已取消保存");
          return false;
        }
      }
    } catch {
      /* stat failed — proceed with save attempt */
    }
    try {
      await saveFileAtomic(tab.absPath, saveText); // FIX #10
      const stat = await fileStat(tab.absPath).catch(() => null);
      tab.mtimeMs = stat?.mtimeMs ?? tab.mtimeMs;
      tab.modified = false;
      renderTabsBar();
      updateStatusBar();
      saveSession();
      toast("已保存");
      return true;
    } catch (err) {
      console.error("保存失败:", err);
      toast("保存失败: " + (err as Error).message);
      return false;
    }
  }

  // New file (no path): use save dialog.
  try {
    const savePath = await pickSavePath(tab.name);
    if (!savePath) return false;
    await saveFileAtomic(savePath, saveText); // FIX #10
    tab.absPath = savePath;
    tab.name = basename(savePath);
    tab.path = basename(savePath);
    tab.modified = false;
    const stat = await fileStat(savePath).catch(() => null);
    tab.mtimeMs = stat?.mtimeMs ?? null;

    // Add to file tree if saved inside the open folder.
    if (state.currentDirPath && savePath.startsWith(state.currentDirPath + "/")) {
      const relPath = savePath.slice(state.currentDirPath.length + 1);
      const existingIdx = state.scannedFiles.findIndex((f) => f.path === relPath);
      if (existingIdx === -1) {
        state.scannedFiles.push({ name: tab.name, path: relPath, absPath: savePath });
        state.scannedFiles.sort((a, b) => a.path.localeCompare(b.path));
        state.folderTree = buildTree(state.scannedFiles, basename(state.currentDirPath));
      }
    }
    renderTabsBar();
    renderTree();
    updateStatusBar();
    saveSession();
    await addRecent("file", savePath, tab.name);
    toast("已保存到 " + tab.name);
    return true;
  } catch (err) {
    console.error("保存失败:", err);
    toast("保存失败: " + (err as Error).message);
    return false;
  }
}

/** FIX #21: native dialog ask instead of window.confirm for delete. */
export async function deleteCurrentFile(): Promise<void> {
  const tab = getActiveTab();
  if (!tab) {
    toast("没有打开的文件");
    return;
  }
  const ok = await confirmDialog(
    '确定要删除文件 "' + tab.name + '" 吗？\n此操作不可恢复。',
    "删除文件"
  );
  if (!ok) return;

  if (tab.absPath) {
    try {
      await removeFile(tab.absPath);
      toast("文件已删除");
    } catch (err) {
      console.error("删除失败:", err);
      toast("删除失败: " + (err as Error).message);
      return;
    }
  } else {
    toast("已关闭未保存文件");
  }

  const idx = state.scannedFiles.findIndex((f) => f.path === tab.path);
  if (idx !== -1) {
    state.scannedFiles.splice(idx, 1);
    state.folderTree = buildTree(
      state.scannedFiles,
      state.currentDirPath ? basename(state.currentDirPath) : "folder"
    );
  }
  const { closeTab } = await import("./tabs");
  await closeTab(tab.id);
  renderTree();
}

export async function doRefreshFolder(): Promise<void> {
  if (!state.currentDirPath) {
    toast("没有打开的文件夹");
    return;
  }
  toast("正在刷新...");
  state.scannedFiles = [];
  await scanDir(state.currentDirPath, "", state.scannedFiles);
  state.scannedFiles.sort((a, b) => a.path.localeCompare(b.path));
  state.folderTree = buildTree(state.scannedFiles, basename(state.currentDirPath));
  renderTree();
  // Refresh absPath for open tabs whose files still exist.
  for (const tab of state.openTabs) {
    if (tab.absPath && tab.path) {
      const refreshed = state.scannedFiles.find((f) => f.path === tab.path);
      if (refreshed) tab.absPath = refreshed.absPath;
    }
  }
  toast("已刷新，共 " + state.scannedFiles.length + " 个文件");
}

// Paste-image support: write bytes into the current folder.
export async function saveImageToFolder(name: string, data: Uint8Array): Promise<string | null> {
  if (!state.currentDirPath) return null;
  try {
    const p = await pathJoin(state.currentDirPath, name);
    await writeBytes(p, data);
    return p;
  } catch (err) {
    toast("保存图片失败: " + (err as Error).message);
    return null;
  }
}

export { updateFormatButtons, updateEolLabel };
