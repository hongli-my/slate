// web/src/editor/tabs.ts
// Tab bar rendering + open/close/switch. FIX #9: confirm on close if modified.
// Tab switching preserves per-tab EditorState (undo history) via view.setState.

import { state, getActiveTab, type Tab, basename } from "./state";
import { $ } from "./ui";
import { customConfirm } from "./ui";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { setLanguage, setReadOnly, clearOccurrences, applyTheme } from "./cm";
import { languageLabel } from "./languages";
import { saveCurrentFile } from "./files";
import { updateStatusBar, updateEolLabel } from "./statusbar";
import { renderTree } from "./filetree";
import { updateFormatButtons, refreshPreviewIfVisible } from "./preview";
import { saveSession } from "./session";
import { syncSplitToTab } from "./split";
import { refreshMinimap } from "./minimap";

export function renderTabsBar(): void {
  const bar = $("tabsBar");
  bar.innerHTML = "";
  for (const tab of state.openTabs) {
    const el = document.createElement("div");
    el.className = "tab" + (tab.id === state.activeTabId ? " active" : "");
    const name = document.createElement("span");
    name.className = "tab-name";
    name.textContent = tab.name + (tab.modified ? " \u2022" : "");
    el.appendChild(name);
    const close = document.createElement("span");
    close.className = "tab-close";
    close.textContent = "\u2715";
    close.onclick = (e) => {
      e.stopPropagation();
      void closeTab(tab.id);
    };
    el.appendChild(close);
    el.onclick = () => switchToTab(tab.id);
    bar.appendChild(el);
  }
}

function emptyDocState(): EditorState {
  return EditorState.create({ doc: "" });
}

/**
 * Build a per-tab EditorState. CRITICAL: uses state.buildExtensions (set by
 * index.ts at boot) so every tab state shares the SAME module-level Compartment
 * singletons (theme/lang/readonly/wrap). That lets view.setState(tabState)
 * preserve undo history AND keep runtime compartment reconfigure working.
 */
function buildTabState(content: string): EditorState {
  const build = state.buildExtensions;
  if (!build || !state.onUpdate) return EditorState.create({ doc: content });
  return EditorState.create({ doc: content, extensions: build(state.onUpdate) });
}

/** Create a new tab from already-loaded content + encoding info. */
export function addTab(
  name: string,
  path: string,
  content: string,
  absPath: string | null,
  encoding = "utf-8",
  eol: "LF" | "CRLF" = "LF",
  mtimeMs: number | null = null
): Tab {
  const id = ++state.tabIdCounter;
  const tab: Tab = {
    id,
    name,
    path,
    absPath,
    cmState: buildTabState(content),
    modified: false,
    encoding,
    eol,
    mtimeMs,
    lang: languageLabel(name),
  };
  state.openTabs.push(tab);
  switchToTab(id);
  return tab;
}

export function switchToTab(id: number): void {
  const view = state.view;
  if (!view) return;
  const tab = state.openTabs.find((t) => t.id === id);
  if (!tab) return;

  // Save the outgoing tab's live state (preserves its undo history).
  if (state.activeTabId != null && state.activeTabId !== id) {
    const old = state.openTabs.find((t) => t.id === state.activeTabId);
    if (old) old.cmState = view.state;
  }

  state.activeTabId = id;
  $("emptyState").style.display = "none";
  view.dom.style.display = "";

  // Swap to the tab's saved state (per-tab undo history preserved).
  const saved = tab.cmState;
  if (saved instanceof EditorState) {
    view.setState(saved);
  } else {
    // Fresh tab whose state couldn't be built: load content via dispatch.
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: String(saved ?? "") } });
  }
  // Re-apply global theme + this file's language + readonly after the swap.
  applyTheme(view, state.lightTheme);
  setLanguage(view, tab.name);
  setReadOnly(view, false);
  clearOccurrences(view);
  view.focus();

  renderTabsBar();
  renderTree();
  updateStatusBar();
  updateEolLabel();
  updateFormatButtons();
  refreshPreviewIfVisible();
  syncSplitToTab();
  refreshMinimap();
  saveSession();
}

/** Close a tab. If modified, ask Save/Don't Save/Cancel (FIX #9). */
export async function closeTab(id: number): Promise<void> {
  const idx = state.openTabs.findIndex((t) => t.id === id);
  if (idx === -1) return;
  const tab = state.openTabs[idx];

  if (tab.modified) {
    const choice = await customConfirm({
      message: `"${tab.name}" 有未保存的修改。是否保存？`,
      title: "关闭文件",
      yesLabel: "保存",
      noLabel: "不保存",
      cancelLabel: "取消",
      yesPrimary: true,
    });
    if (choice === "cancel") return;
    if (choice === "yes") {
      const ok = await saveCurrentFile();
      if (!ok) return; // save failed/cancelled, keep tab open
    }
  }

  state.openTabs.splice(idx, 1);
  const view = state.view;
  if (state.openTabs.length === 0) {
    state.activeTabId = null;
    if (view) view.dom.style.display = "none";
    $("emptyState").style.display = "flex";
    if (view) view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: "" } });
    updateFormatButtons();
    localStorage.removeItem("slate.session.v1");
  } else if (state.activeTabId === id) {
    const newIdx = Math.min(idx, state.openTabs.length - 1);
    switchToTab(state.openTabs[newIdx].id);
  }
  renderTabsBar();
  renderTree();
  updateStatusBar();
  updateEolLabel();
  saveSession();
}

export { basename };
