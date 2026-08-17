// web/src/editor/tabs.ts
// Tab bar rendering + open/close/switch. FIX #9: confirm on close if modified.
// Tab switching preserves per-tab EditorState (undo history) via view.setState.
// Phase 2: group-aware — each editor group has its own tab list + tab bar.

import { state, getActiveTab, setActiveGroup, groupElId, type Tab, basename } from "./state";
import { $, customConfirm } from "./ui";
import { EditorState } from "@codemirror/state";
import { setLanguage, setReadOnly, clearOccurrences, applyTheme } from "./cm";
import { languageLabel } from "./languages";
import { saveCurrentFile } from "./files";
import { updateStatusBar, updateEolLabel } from "./statusbar";
import { renderTree } from "./filetree";
import { updateFormatButtons, refreshPreviewIfVisible, togglePreview } from "./preview";
import { saveSession } from "./session";
import { closeSplit } from "./split";
import { refreshMinimap } from "./minimap";

export function renderTabsBar(groupId: 0 | 1 = state.activeGroup): void {
  const bar = $(groupElId("tabsBar", groupId));
  if (!bar) return;
  bar.innerHTML = "";
  const g = state.groups[groupId];
  for (const tab of g.tabs) {
    const el = document.createElement("div");
    el.className = "tab" + (tab.id === g.activeTabId ? " active" : "");
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
    el.onclick = () => switchToTab(tab.id, groupId);
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
  mtimeMs: number | null = null,
  groupId: 0 | 1 = state.activeGroup
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
  state.groups[groupId].tabs.push(tab);
  switchToTab(id, groupId);
  return tab;
}

export function switchToTab(id: number, groupId: 0 | 1 = state.activeGroup): void {
  const g = state.groups[groupId];
  const view = g.view;
  if (!view) return;
  const tab = g.tabs.find((t) => t.id === id);
  if (!tab) return;

  // Save the outgoing tab's live state (preserves its undo history).
  if (g.activeTabId != null && g.activeTabId !== id) {
    const old = g.tabs.find((t) => t.id === g.activeTabId);
    if (old) old.cmState = view.state;
  }

  g.activeTabId = id;
  $(groupElId("emptyState", groupId)).style.display = "none";
  view.dom.style.display = "";

  // Swap to the tab's saved state (per-tab undo history preserved).
  const saved = tab.cmState;
  if (saved instanceof EditorState) {
    view.setState(saved);
  } else {
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: String(saved ?? "") } });
  }
  // Re-apply global theme + this file's language + readonly after the swap.
  applyTheme(view, state.lightTheme);
  setLanguage(view, tab.name);
  setReadOnly(view, false);
  clearOccurrences(view);

  setActiveGroup(groupId);
  view.focus();

  renderTabsBar(groupId);
  renderTree();
  updateStatusBar();
  updateEolLabel();
  updateFormatButtons();
  refreshPreviewIfVisible();
  refreshMinimap();
  saveSession();
}

/** Close a tab. If modified, ask Save/Don't Save/Cancel (FIX #9).
 *  Locates the tab across both groups. */
export async function closeTab(id: number): Promise<void> {
  // Locate the tab across all groups.
  let groupId: 0 | 1 | -1 = -1;
  let idx = -1;
  for (let i = 0 as 0 | 1; i < 2; i = (i + 1) as 0 | 1) {
    idx = state.groups[i].tabs.findIndex((t) => t.id === id);
    if (idx !== -1) { groupId = i; break; }
  }
  if (groupId === -1) return;
  const g = state.groups[groupId];
  const tab = g.tabs[idx];

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
      // Route save to the tab's group.
      const prev = state.activeGroup;
      setActiveGroup(groupId);
      const ok = await saveCurrentFile();
      setActiveGroup(prev);
      if (!ok) return;
    }
  }

  g.tabs.splice(idx, 1);
  const view = g.view;
  // Close preview if closing the active tab of the active group.
  if (state.previewVisible && state.activeGroup === groupId && g.activeTabId === id) {
    togglePreview();
  }

  if (g.tabs.length === 0) {
    g.activeTabId = null;
    if (view) {
      view.dom.style.display = "none";
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: "" } });
    }
    $(groupElId("emptyState", groupId)).style.display = "flex";

    if (groupId === 0) {
      // group0 empty: if split is open, close it (merges group1 tabs into group0).
      if (state.splitActive) {
        await closeSplit(); // closeSplit switches to the merged tab + renders.
        renderTree();
        updateStatusBar();
        updateEolLabel();
        saveSession();
        return;
      }
      // No split, truly empty.
      updateFormatButtons();
      localStorage.removeItem("slate.session.v1");
    }
    // group1 empty: keep split open (VS Code-style empty group).
  } else if (g.activeTabId === id) {
    // Closed the active tab — switch to neighbor in same group.
    const newIdx = Math.min(idx, g.tabs.length - 1);
    switchToTab(g.tabs[newIdx].id, groupId);
  }
  renderTabsBar(groupId);
  renderTree();
  updateStatusBar();
  updateEolLabel();
  saveSession();
}

export { basename };
