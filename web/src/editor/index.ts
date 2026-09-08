// web/src/editor/index.ts
// Orchestrator: boot the editor, wire the update listener, attach window.*
// functions for index.html onclick handlers. FIX #17: init error guard.
// FIX #22: global error handlers.

import { EditorView, ViewUpdate } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { state, viewGroup, setActiveGroup, getTabByPath, type Tab } from "./state";
import { createEditorView, buildExtensions, clearOccurrences } from "./cm";
import { setupShortcuts } from "./keymap";
import { loadRecents, doOpenFolder, doOpenFiles, saveCurrentFile, doNewFile, deleteCurrentFile } from "./files";
import { renderTabsBar, switchToTab, addTab } from "./tabs";
import { renderTree } from "./filetree";
import { togglePreview, scheduleMdRender, updateFormatButtons, isMarkdownFile, syncPreviewPane } from "./preview";
import { formatSQL, formatJSON, minifyJSON, toggleEol, toggleTheme } from "./commands";
import { setSearchQuery, SearchQuery } from "@codemirror/search";
import { toggleSplitView, setupSplitDivider } from "./split";
import { toggleMinimap } from "./minimap";
import { saveRecovery, readTextFile, readCalendar } from "./io";
import { showCalendar, calEventClick, calPrevMonth, calNextMonth, calGoToday, calSelectDate, calSwitchView, calJumpDate } from "./calendar";
import { setupEditorContextMenu } from "./contextmenu";
import { restoreSession } from "./session";
import { recordMacroUpdate } from "./macros";
import { updateStatusBar, updateStatusCursor, updateEolLabel } from "./statusbar";
import { setupPasteImage } from "./paste-image";
import { installReliableCopy } from "./copy";
import { toast, $ } from "./ui";

/** Central update listener for the main EditorView. */
function onDocUpdate(u: ViewUpdate): void {
  // Macro recording (FIX #13) — consume first so it sees the originating tx.
  recordMacroUpdate(u);
  const g = viewGroup(u);

  if (u.docChanged) {
    const tab = g.tabs.find((t) => t.id === g.activeTabId);
    if (tab) {
      if (!tab.modified) {
        tab.modified = true;
        renderTabsBar(g.id);
        updateStatusBar();
      }
    }
    // Live markdown preview (debounced 300ms — FIX #5).
    if (state.previewVisible && isMarkdownFile()) scheduleMdRender();
    // Session save (debounced 500ms — FIX #12).
    _session.saveSession();
    // Crash-recovery snapshot (debounced 1s). Only buffers with a path —
    // untitled buffers have no stable key to restore under.
    if (tab) scheduleRecoverySave(tab);
  }
  if (u.selectionSet || u.focusChanged) {
    updateStatusCursor();
    // Focus routing: make this view's group the active one.
    if (u.view.hasFocus && g.id !== state.activeGroup) {
      setActiveGroup(g.id);
      syncPreviewPane(); // move preview pane to the newly active group
    }
  }
  // NOTE: occurrence highlights are NO LONGER cleared on every docChanged.
  // The occurrence StateField maps its decorations through transactions
  // (dec.map(tr.changes)), and the debounced re-highlight overwrites the set
  // on its own. The old per-keystroke clear caused a 120ms flicker to "no
  // highlights"; removing it makes same-word highlighting feel instant.
}

// Debounced crash-recovery save. Each docChanged reschedules, so we only
// write to disk once editing pauses for 1s — cheap even on large files.
let recoveryTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleRecoverySave(tab: Tab): void {
  const path = tab.absPath;
  if (!path) return; // untitled buffers have no recovery key
  if (recoveryTimer) clearTimeout(recoveryTimer);
  recoveryTimer = setTimeout(() => {
    recoveryTimer = null;
    const view = state.view;
    if (!view) return;
    // Only snapshot if this tab is still open and still dirty (it may have
    // been saved / closed during the 1s window).
    const stillDirty = state.groups.some(
      (g) => g.activeTabId === tab.id && g.tabs.includes(tab) && tab.modified
    );
    if (!stillDirty) return;
    const content = view.state.doc.toString();
    void saveRecovery(path, content);
  }, 1000);
}

/** Listen for external file-change events from the Rust watcher and reload
 *  (unmodified) or warn (modified) per Sublime behavior. */
function setupFileWatcher(): void {
  const w = window as unknown as {
    __TAURI__?: { event?: { listen?: (ev: string, cb: (e: { payload: { path: string; mtimeMs: number } }) => void) => Promise<void> } };
  };
  const listen = w.__TAURI__?.event?.listen;
  if (typeof listen !== "function") return;
  listen("file-changed", (e) => {
    void onFileChanged(e.payload.path, e.payload.mtimeMs);
  }).catch(() => {
    /* ignore */
  });
}

async function onFileChanged(path: string, mtimeMs: number): Promise<void> {
  const tab = getTabByPath(path);
  if (!tab) return;
  if (mtimeMs === -2) {
    // Sentinel: file was deleted / moved on disk.
    toast(
      tab.modified
        ? `"${tab.name}" 已被外部删除（缓冲区仍有未保存内容）`
        : `"${tab.name}" 已被外部删除`
    );
    return;
  }
  if (tab.modified) {
    // Don't clobber unsaved edits — let the user decide (Cmd+S overwrite).
    toast(`"${tab.name}" 已被外部修改，Cmd+S 覆盖或放弃编辑`);
    return;
  }
  // Unmodified buffer — reload silently from disk.
  try {
    const r = await readTextFile(path);
    let content = r.text;
    const eol = content.includes("\r\n") ? "CRLF" : "LF";
    content = eol === "CRLF" ? content : content.replace(/\r\n/g, "\n");
    const g = state.groups.find((gg) => gg.tabs.includes(tab));
    if (!g) return;
    const view = g.view;
    if (view && g.activeTabId === tab.id) {
      // Swap doc on the live view. Undo returns to the pre-reload state.
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: content } });
    } else if (state.buildExtensions && state.onUpdate) {
      // Background tab: rebuild its saved state with fresh content.
      tab.cmState = EditorState.create({ doc: content, extensions: state.buildExtensions(state.onUpdate) });
    }
    tab.mtimeMs = mtimeMs;
  } catch (err) {
    toast(`重新加载 "${tab.name}" 失败: ${(err as Error).message}`);
  }
}

// Lazy require wrapper wrapper removed; _session is imported directly below.
import * as _session from "./session";

/** Mount the editor into #editorPane and boot all subsystems. */
export async function initEditor(): Promise<void> {
  try {
    const pane = $("editorPane");
    if (!pane) throw new Error("#editorPane not found");

    // Wire the update callback + extension factory into state BEFORE creating
    // the view, so per-tab states built later share the same compartments.
    state.onUpdate = onDocUpdate;
    state.buildExtensions = buildExtensions;

    const view = createEditorView(pane, 0, onDocUpdate);
    view.dom.style.display = "none";

    setupResizer();
    setupShortcuts();
    setupPasteImage(view);
    installReliableCopy();
    setupEditorContextMenu();
    setupSplitDivider();
    setupGroupActivation();
    setupFileWatcher();
    updateFormatButtons();

    await loadRecents();
    await restoreSession();

    // Hide the loading/empty placeholders appropriately.
    if (state.openTabs.length === 0) {
      $("emptyState").style.display = "flex";
    }
    // Expose window.* handlers (formatJSON, etc.) + __slate for debugging.
    exposeGlobals();
  } catch (err) {
    // FIX #17: init error guard — surface the failure in the editor pane.
    console.error("Slate init failed:", err);
    const pane = $("editorPane");
    if (pane) {
      pane.innerHTML =
        '<div style="padding:40px;color:#f66;font-family:monospace;">' +
        "Slate 编辑器初始化失败:<br>" +
        String((err as Error).message || err) +
        "</div>";
    }
  }
}

// ---- Sidebar resizer (ported from editor.js) ----
function setupResizer(): void {
  const resizer = document.getElementById("resizer");
  const sidebar = document.getElementById("sidebar");
  if (!resizer || !sidebar) return;
  let dragging = false;
  let startX = 0;
  let startW = 0;
  resizer.addEventListener("mousedown", (e) => {
    dragging = true;
    startX = e.clientX;
    startW = sidebar.offsetWidth;
    resizer.classList.add("dragging");
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
  function onMove(e: MouseEvent) {
    if (!dragging) return;
    const w = startW + e.clientX - startX;
    if (w >= 140 && w <= 500) sidebar.style.width = w + "px";
  }
  function onUp() {
    dragging = false;
    resizer.classList.remove("dragging");
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  }
}

// ---- Group activation router ----
// Any mousedown inside an editor group (editor, tabs, buttons, empty area)
// makes that group the active one. This ensures toolbar buttons (format /
// preview) operate on the group they belong to, not the previously focused one.
function setupGroupActivation(): void {
  const area = document.getElementById("editorArea");
  if (!area) return;
  area.addEventListener("mousedown", (e) => {
    const grp = (e.target as HTMLElement | null)?.closest(".editor-group") as HTMLElement | null;
    if (!grp) return;
    const gid = grp.dataset.group;
    if (gid !== "0" && gid !== "1") return;
    const g = Number(gid) as 0 | 1;
    if (state.activeGroup !== g) {
      setActiveGroup(g);
      syncPreviewPane();
    }
  }, true);
}

// ---- Export functions to window for index.html onclick handlers ----
/** 测试入口：读 macOS 日历（EventKit）并 toast 展示未来 7 天事件数。 */
export async function testCalendar(): Promise<void> {
  try {
    const data = await readCalendar(7);
    const evs = data.events;
    const rems = data.reminders;
    if (!evs.length && !rems.length) {
      toast("📅 未来 7 天无日历事件 / 提醒事项");
      return;
    }
    const today = evs.filter((e) => e.start.startsWith(new Date().toISOString().slice(0, 10)));
    const lines = [
      `📅 未来 7 天：${evs.length} 个事件 · ${rems.length} 条提醒`,
      ...today.slice(0, 3).map((e) => `  · ${e.start.slice(11, 16)} ${e.title}`),
      ...rems.slice(0, 2).map((r) => `  ☐ ${r.title}`),
    ];
    toast(lines.join("\n"));
    console.log("[cal-bridge] 日历数据:", data);
  } catch (e) {
    toast("📅 读取日历失败: " + (e as Error).message);
    console.error("[cal-bridge] 失败:", e);
  }
}

export function exposeGlobals(): void {
  const w = window as unknown as Record<string, unknown>;
  w.doOpenFolder = doOpenFolder;
  w.doOpenFiles = doOpenFiles;
  w.saveCurrentFile = saveCurrentFile;
  w.doNewFile = doNewFile;
  w.deleteCurrentFile = deleteCurrentFile;
  w.togglePreview = togglePreview;
  w.formatSQL = formatSQL;
  w.formatJSON = formatJSON;
  w.minifyJSON = minifyJSON;
  w.toggleEol = toggleEol;
  w.toggleTheme = toggleTheme;
  // 调试：读 macOS 日历（EventKit）。用法：await readCalendar(7)
  w.readCalendar = readCalendar;
  w.calEventClick = calEventClick;
  w.showCalendar = showCalendar;
  w.calPrevMonth = calPrevMonth;
  w.calNextMonth = calNextMonth;
  w.calGoToday = calGoToday;
  w.calSelectDate = calSelectDate;
  w.calSwitchView = calSwitchView;
  w.calJumpDate = calJumpDate;
  // 测试入口：状态栏 📅 按钮 → 读 macOS 日历并 toast 展示
  w.testCalendar = testCalendar;
  w.toggleSplitView = toggleSplitView;
  w.toggleMinimap = toggleMinimap;
  // Expose for debugging.
  w.__slate = state;
  // Debug helper: trigger an in-file search so tests can verify highlight clearing.
  w.setSearch = (q: string) => {
    if (state.view) {
      state.view.dispatch({ effects: setSearchQuery.of(new SearchQuery({ search: q })) });
    }
  };
}

// FIX #22: global error handlers -> toast.
export function setupGlobalErrorHandlers(): void {
  window.addEventListener("error", (e) => {
    console.error("Unhandled error:", e.error || e.message);
    toast("发生错误: " + (e.message || "unknown"), 4000);
  });
  window.addEventListener("unhandledrejection", (e) => {
    console.error("Unhandled promise rejection:", e.reason);
    const msg = e.reason instanceof Error ? e.reason.message : String(e.reason);
    toast("Promise 未捕获: " + msg, 4000);
  });
}

export { EditorView, addTab, switchToTab, renderTree, toast, clearOccurrences };
