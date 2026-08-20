// web/src/editor/index.ts
// Orchestrator: boot the editor, wire the update listener, attach window.*
// functions for index.html onclick handlers. FIX #17: init error guard.
// FIX #22: global error handlers.

import { EditorView, ViewUpdate } from "@codemirror/view";
import { state, viewGroup, setActiveGroup } from "./state";
import { createEditorView, buildExtensions, clearOccurrences } from "./cm";
import { setupShortcuts } from "./keymap";
import { loadRecents, doOpenFolder, doOpenFiles, saveCurrentFile, doNewFile, deleteCurrentFile } from "./files";
import { renderTabsBar, switchToTab, addTab } from "./tabs";
import { renderTree } from "./filetree";
import { togglePreview, scheduleMdRender, updateFormatButtons, isMarkdownFile, syncPreviewPane } from "./preview";
import { formatSQL, formatJSON, toggleEol, toggleTheme } from "./commands";
import { setSearchQuery, SearchQuery } from "@codemirror/search";
import { toggleSplitView, setupSplitDivider } from "./split";
import { toggleMinimap } from "./minimap";
import { setupEditorContextMenu } from "./contextmenu";
import { restoreSession } from "./session";
import { recordMacroUpdate } from "./macros";
import { updateStatusBar, updateStatusCursor, updateEolLabel } from "./statusbar";
import { setupPasteImage } from "./paste-image";
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
  }
  if (u.selectionSet || u.focusChanged) {
    updateStatusCursor();
    // Focus routing: make this view's group the active one.
    if (u.view.hasFocus && g.id !== state.activeGroup) {
      setActiveGroup(g.id);
      syncPreviewPane(); // move preview pane to the newly active group
    }
  }
  // On transactions that change the doc, clear any stale occurrence highlights.
  if (u.docChanged) {
    const v = u.view;
    if (v) clearOccurrences(v);
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
    setupEditorContextMenu();
    setupSplitDivider();
    setupGroupActivation();
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
  w.toggleEol = toggleEol;
  w.toggleTheme = toggleTheme;
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
