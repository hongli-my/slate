// web/src/editor/split.ts
// Dual independent editor groups: group[1] is mounted on demand with its own
// editable EditorView + own tab list. Closing the split merges group1's tabs
// into group0 (dedup by absPath, prompt for unsaved).

import { EditorState } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { state, getActiveTab, setActiveGroup, getTabByPath, groupElId, type Tab } from "./state";
import { createEditorView, applyTheme, setLanguage, setReadOnly } from "./cm";
import { setupPasteImage } from "./paste-image";
import { $, customConfirm } from "./ui";
import { renderTabsBar, switchToTab } from "./tabs";
import { saveCurrentFile } from "./files";
import { saveSession } from "./session";

export function toggleSplitView(direction: "horizontal" | "vertical" = "horizontal"): void {
  const view = state.view;
  if (!view) return;
  const area = document.getElementById("editorArea");
  if (!area) return;

  // Already split: same direction → close; different → switch layout only.
  if (state.splitActive) {
    if (state.splitMode === direction) {
      void closeSplit();
      return;
    }
    state.splitMode = direction;
    applySplitDirection(area);
    return;
  }

  const g1View = mountGroup1(direction);
  if (!g1View) return;

  // Initial tab: copy the active group's active tab so the user sees content
  // immediately. The new tab has an independent cmState (separate undo).
  const activeTab = getActiveTab();
  if (activeTab) {
    const id = ++state.tabIdCounter;
    const docStr = activeTab.cmState instanceof EditorState
      ? (activeTab.cmState as EditorState).doc.toString()
      : "";
    const newTab: Tab = {
      id,
      name: activeTab.name,
      path: activeTab.path,
      absPath: activeTab.absPath,
      cmState: EditorState.create({ doc: docStr, extensions: state.buildExtensions!(state.onUpdate!) }),
      modified: activeTab.modified,
      encoding: activeTab.encoding,
      eol: activeTab.eol,
      mtimeMs: activeTab.mtimeMs,
      lang: activeTab.lang,
    };
    state.groups[1].tabs.push(newTab);
    state.groups[1].activeTabId = id;

    g1View.dom.style.display = "";
    g1View.setState(newTab.cmState as EditorState);
    applyTheme(g1View, state.lightTheme);
    setLanguage(g1View, newTab.name);
    setReadOnly(g1View, false);
    $(groupElId("emptyState", 1)).style.display = "none";
  }

  setActiveGroup(1);
  renderTabsBar(1);
  g1View.focus();
  saveSession();
}

/** Mount group1's independent EditorView + show its DOM + set split state.
 *  Does NOT create any tab or change activeGroup — the caller is responsible
 *  for that. Used by both toggleSplitView (then adds a copied tab) and
 *  restoreSession (then addTab's the restored tabs). Returns the new view
 *  or null on failure. */
export function mountGroup1(direction: "horizontal" | "vertical"): EditorView | null {
  const area = document.getElementById("editorArea");
  if (!area) return null;
  const pane = $("editorPane1");
  if (!pane) return null;
  const onUpdate = state.onUpdate;
  if (!onUpdate || !state.buildExtensions) return null;

  const g1View = createEditorView(pane, 1, onUpdate);
  // Bind paste-image for this view's DOM (group0 is bound at boot).
  setupPasteImage(g1View);

  const group1 = document.getElementById("group1");
  if (group1) group1.removeAttribute("hidden");
  state.splitMode = direction;
  state.splitActive = true;
  area.classList.add("split-active");
  applySplitDirection(area);
  applySplitRatio(state.splitRatio);
  return g1View;
}

/** Close the split: merge group1's tabs into group0 (dedup by absPath),
 *  prompt for unsaved tabs, then destroy group1's view + hide DOM. */
export async function closeSplit(): Promise<void> {
  if (!state.splitActive) return;
  const g1 = state.groups[1];

  // Prompt for unsaved tabs in group1.
  for (const tab of g1.tabs) {
    if (tab.modified) {
      const choice = await customConfirm({
        message: `"${tab.name}" (分栏) 有未保存的修改。是否保存？`,
        title: "关闭分栏",
        yesLabel: "保存",
        noLabel: "不保存",
        cancelLabel: "取消",
        yesPrimary: true,
      });
      if (choice === "cancel") return; // abort close
      if (choice === "yes") {
        // Temporarily route to group1 to save the tab.
        const prev = state.activeGroup;
        state.groups[1].activeTabId = tab.id;
        setActiveGroup(1);
        await saveCurrentFile();
        setActiveGroup(prev);
      }
    }
  }

  // Merge group1 tabs into group0 (dedup by absPath — group0 wins).
  for (const tab of g1.tabs) {
    if (tab.absPath && getTabByPath(tab.absPath, 0)) continue;
    state.groups[0].tabs.push(tab);
  }

  // Destroy group1 view + reset state.
  g1.view?.destroy();
  g1.view = null;
  g1.tabs = [];
  g1.activeTabId = null;
  const group1 = document.getElementById("group1");
  if (group1) group1.setAttribute("hidden", "");
  const area = document.getElementById("editorArea");
  if (area) area.classList.remove("split-active", "split-vertical");
  state.splitActive = false;
  state.splitMode = null;
  // Clear inline flex sizing so group0 returns to full width.
  applySplitRatio(null);

  setActiveGroup(0);
  // Switch to group0's active tab (or the last merged one).
  const g0 = state.groups[0];
  if (g0.tabs.length > 0) {
    const targetId = g0.activeTabId ?? g0.tabs[g0.tabs.length - 1].id;
    switchToTab(targetId, 0);
  } else {
    renderTabsBar(0);
  }
  saveSession();
}

/** Apply current splitMode to DOM classes (called on create + direction switch). */
function applySplitDirection(area: HTMLElement): void {
  const group1 = document.getElementById("group1");
  if (!group1) return;
  if (state.splitMode === "vertical") {
    area.classList.add("split-vertical");
    group1.classList.add("split-bottom");
    group1.classList.remove("split-right");
  } else {
    area.classList.remove("split-vertical");
    group1.classList.add("split-right");
    group1.classList.remove("split-bottom");
  }
}

/** Apply a split size ratio to the two groups via inline flex-grow.
 *  ratio = group0's share (0..1). null restores the default 50/50. */
export function applySplitRatio(ratio: number | null): void {
  const g0 = document.getElementById("group0");
  const g1 = document.getElementById("group1");
  if (!g0 || !g1) return;
  if (ratio == null) {
    g0.style.flexGrow = "";
    g1.style.flexGrow = "";
  } else {
    const r = Math.min(0.9, Math.max(0.1, ratio)); // clamp 10%-90%
    g0.style.flexGrow = String(r);
    g1.style.flexGrow = String(1 - r);
  }
}

/** Wire the draggable split-divider (mounted once at boot; the divider DOM
 *  is shown/hidden via the .split-active class on #editorArea). Dragging
 *  adjusts the flex-grow ratio of the two groups and persists it. */
export function setupSplitDivider(): void {
  const divider = document.getElementById("splitDivider");
  const area = document.getElementById("editorArea");
  if (!divider || !area) return;
  let dragging = false;
  divider.addEventListener("mousedown", (e) => {
    if (!state.splitActive) return;
    dragging = true;
    e.preventDefault();
    divider.classList.add("dragging");
    document.body.style.userSelect = "none";
    document.body.style.cursor = state.splitMode === "vertical" ? "row-resize" : "col-resize";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
  function onMove(e: MouseEvent): void {
    if (!dragging) return;
    const rect = area.getBoundingClientRect();
    const ratio =
      state.splitMode === "vertical"
        ? (e.clientY - rect.top) / rect.height
        : (e.clientX - rect.left) / rect.width;
    applySplitRatio(ratio);
    state.splitRatio = Math.min(0.9, Math.max(0.1, ratio));
  }
  function onUp(): void {
    if (!dragging) return;
    dragging = false;
    divider.classList.remove("dragging");
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    saveSession();
  }
}
