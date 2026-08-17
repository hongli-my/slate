// web/src/editor/state.ts
// Central mutable state shared across modules. Kept as a single object so
// modules can read/write without prop-drilling or circular imports.
//
// === Dual editor-group model (Phase 1 of split refactor) ===
// state now holds groups[2] + activeGroup. The legacy single-value accessors
// (view / openTabs / activeTabId / rightView) are kept as getter/setter
// proxies onto groups[activeGroup] so that Phase 1 changes ONLY this file.
// Phase 2+ will migrate callers to getActiveView()/getActiveGroup() and
// eventually remove the proxy accessors.

import type { EditorView } from "@codemirror/view";
import type { Extension, EditorState } from "@codemirror/state";
import type { ViewUpdate } from "@codemirror/view";

export interface FileRef {
  name: string;
  path: string; // path relative to folder root (or name for standalone)
  absPath: string;
}

export interface TreeNode {
  name: string;
  type: "dir" | "file";
  children?: TreeNode[];
  expanded?: boolean;
  fileRef?: FileRef;
}

export interface RecentItem {
  kind: "file" | "folder";
  path: string;
  name: string;
  time?: number;
}

export interface Tab {
  id: number;
  name: string;
  path: string;
  absPath: string | null;
  /** Saved per-tab EditorState so undo history is preserved across switches. */
  cmState: unknown; // EditorState
  modified: boolean;
  encoding: string;
  eol: "LF" | "CRLF";
  /** mtime (ms) of the file on disk when loaded/saved — for external-mod detection. */
  mtimeMs: number | null;
  /** language label cache */
  lang: string;
}

/** An independent editor group (pane). group[0] is always mounted; group[1]
 *  is mounted on demand when the split view is opened. */
export interface EditorGroup {
  id: 0 | 1;
  view: EditorView | null;
  tabs: Tab[];
  activeTabId: number | null;
}

export const state = {
  // ---- Dual editor groups ----
  groups: [
    { id: 0, view: null as EditorView | null, tabs: [] as Tab[], activeTabId: null as number | null },
    { id: 1, view: null as EditorView | null, tabs: [] as Tab[], activeTabId: null as number | null },
  ] as [EditorGroup, EditorGroup],
  /** Index of the currently focused group. */
  activeGroup: 0 as 0 | 1,

  // ---- Legacy proxy accessors (Phase 2+ will remove these) ----
  /** @deprecated use getActiveView() — proxies to groups[activeGroup].view */
  get view(): EditorView | null { return this.groups[this.activeGroup].view; },
  set view(v: EditorView | null) { this.groups[this.activeGroup].view = v; },
  /** @deprecated use getActiveGroup().tabs — proxies to groups[activeGroup].tabs */
  get openTabs(): Tab[] { return this.groups[this.activeGroup].tabs; },
  /** @deprecated use getActiveGroup().activeTabId */
  get activeTabId(): number | null { return this.groups[this.activeGroup].activeTabId; },
  set activeTabId(v: number | null) { this.groups[this.activeGroup].activeTabId = v; },
  /** @deprecated use groups[1].view — proxies to the second group's view */
  get rightView(): EditorView | null { return this.groups[1].view; },
  set rightView(v: EditorView | null) { this.groups[1].view = v; },

  // ---- Shared/global state ----
  tabIdCounter: 0,
  scannedFiles: [] as FileRef[],
  folderTree: null as TreeNode | null,
  currentDirPath: null as string | null,
  recents: [] as RecentItem[],
  previewVisible: false,
  splitActive: false,
  /** Current split direction when splitActive is true. */
  splitMode: null as "horizontal" | "vertical" | null,
  minimapOn: false,
  lightTheme: false,
  macroRecording: false,
  macroSteps: [] as Array<{ from: number; to: number; insert: string }>,
  /** Update listener wired by index.ts; used when building per-tab states. */
  onUpdate: null as null | ((u: ViewUpdate) => void),
  /** The base extension factory is cached here so per-tab states share the
   *  SAME module-level Compartment singletons (theme/lang/readonly/wrap). */
  buildExtensions: null as null | ((onUpdate: (u: ViewUpdate) => void) => Extension[]),
  // extension compartments (assigned in cm.ts)
  themeComp: null as null | { of: (e: Extension) => Extension; reconfigure: (e: Extension) => never },
  langComp: null as null | { of: (e: Extension) => Extension; reconfigure: (e: Extension) => never },
  readOnlyComp: null as null | { of: (e: Extension) => Extension; reconfigure: (e: Extension) => never },
  wrapComp: null as null | { of: (e: Extension) => Extension; reconfigure: (e: Extension) => never },
};

// ===================== Access layer (Phase 2+ callers) =====================

/** Returns the currently focused editor group. */
export function getActiveGroup(): EditorGroup {
  return state.groups[state.activeGroup];
}

/** Returns the EditorView of the focused group (may be null before mount). */
export function getActiveView(): EditorView | null {
  return getActiveGroup().view;
}

/** Returns the active tab of the focused group. */
export function getActiveTab(): Tab | null {
  const g = getActiveGroup();
  if (g.activeTabId == null) return null;
  return g.tabs.find((t) => t.id === g.activeTabId) ?? null;
}

/** Returns the active tab id of the focused group. */
export function getActiveTabId(): number | null {
  return getActiveGroup().activeTabId;
}

/** Flattened tabs across ALL groups (use for global traversals like goto
 *  candidates, refresh-folder, unsaved-file checks). */
export function getAllTabs(): Tab[] {
  return state.groups.flatMap((g) => g.tabs);
}

/** Find a tab by absolute path. When groupId is given, search only that
 *  group; otherwise search all groups (first match wins). */
export function getTabByPath(absPath: string | null, groupId?: 0 | 1): Tab | null {
  if (!absPath) return null;
  if (groupId != null) {
    return state.groups[groupId].tabs.find((t) => t.absPath === absPath) ?? null;
  }
  for (const g of state.groups) {
    const t = g.tabs.find((x) => x.absPath === absPath);
    if (t) return t;
  }
  return null;
}

/** Reverse-lookup which group a ViewUpdate's view belongs to. */
export function viewGroup(u: ViewUpdate): EditorGroup {
  return state.groups.find((g) => g.view === u.view) ?? state.groups[0];
}

/** Set the focused group + update DOM focus indicator. Callers are
 *  responsible for refreshing statusbar/preview/etc. afterwards. */
export function setActiveGroup(g: 0 | 1): void {
  state.activeGroup = g;
  document.getElementById("group0")?.classList.toggle("focused", g === 0);
  document.getElementById("group1")?.classList.toggle("focused", g === 1);
}

/** DOM helper: get an element id scoped to a group (group0 keeps the base
 *  id for backward compat, group1 appends "1"). */
export function groupElId(baseId: string, groupId: 0 | 1): string {
  return groupId === 0 ? baseId : baseId + "1";
}

export function basename(p: string): string {
  const i = String(p).lastIndexOf("/");
  return i >= 0 ? p.slice(i + 1) : p;
}

export type { EditorState };
