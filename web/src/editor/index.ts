// web/src/editor/index.ts
// Orchestrator: boot the editor, wire the update listener, attach window.*
// functions for index.html onclick handlers. FIX #17: init error guard.
// FIX #22: global error handlers.

import { EditorView, ViewUpdate } from "@codemirror/view";
import { state } from "./state";
import { createEditorView, buildExtensions, scheduleOccurrenceHighlight, clearOccurrences } from "./cm";
import { setupShortcuts } from "./keymap";
import { loadRecents, doOpenFolder, doOpenFiles, saveCurrentFile, doNewFile, deleteCurrentFile } from "./files";
import { renderTabsBar, switchToTab, addTab } from "./tabs";
import { renderTree } from "./filetree";
import { togglePreview, scheduleMdRender, updateFormatButtons, isMarkdownFile } from "./preview";
import { formatSQL, formatJSON, toggleEol, toggleTheme } from "./commands";
import { toggleSplitView } from "./split";
import { toggleMinimap } from "./minimap";
import { restoreSession } from "./session";
import { forwardChangesToSplit } from "./split";
import { recordMacroUpdate } from "./macros";
import { updateStatusBar, updateStatusCursor, updateEolLabel } from "./statusbar";
import { setupPasteImage } from "./paste-image";
import { toast, $ } from "./ui";

/** Central update listener for the main EditorView. */
function onDocUpdate(u: ViewUpdate): void {
  // Macro recording (FIX #13) — consume first so it sees the originating tx.
  recordMacroUpdate(u);

  if (u.docChanged) {
    const tab = state.openTabs.find((t) => t.id === state.activeTabId);
    if (tab) {
      if (!tab.modified) {
        tab.modified = true;
        renderTabsBar();
        updateStatusBar();
      }
    }
    // Live markdown preview (debounced 300ms — FIX #5).
    if (state.previewVisible && isMarkdownFile()) scheduleMdRender();
    // Split view incremental forwarding (FIX #1).
    forwardChangesToSplit(u);
    // Session save (debounced 500ms — FIX #12).
    _session.saveSession();
  }
  if (u.selectionSet || u.focusChanged) {
    updateStatusCursor();
    if (u.view.hasFocus) scheduleOccurrenceHighlight(u.view);
  }
  // On transactions that change the doc, occurrence highlights may be stale.
  if (u.docChanged) {
    // Re-evaluate occurrences after edits (debounced).
    scheduleOccurrenceHighlight(u.view);
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

    const view = createEditorView(pane, onDocUpdate);
    view.dom.style.display = "none";

    setupResizer();
    setupShortcuts();
    setupPasteImage();
    updateFormatButtons();

    await loadRecents();
    await restoreSession();

    // Hide the loading/empty placeholders appropriately.
    if (state.openTabs.length === 0) {
      $("emptyState").style.display = "flex";
    }
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
