// web/src/editor/state.ts
// Central mutable state shared across modules. Kept as a single object so
// modules can read/write without prop-drilling or circular imports.

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

export const state = {
  view: null as EditorView | null,
  rightView: null as EditorView | null,
  openTabs: [] as Tab[],
  activeTabId: null as number | null,
  tabIdCounter: 0,
  scannedFiles: [] as FileRef[],
  folderTree: null as TreeNode | null,
  currentDirPath: null as string | null,
  recents: [] as RecentItem[],
  previewVisible: false,
  splitActive: false,
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

export function getActiveTab(): Tab | null {
  if (state.activeTabId == null) return null;
  return state.openTabs.find((t) => t.id === state.activeTabId) ?? null;
}

export function getTabByPath(absPath: string | null): Tab | null {
  if (!absPath) return null;
  return state.openTabs.find((t) => t.absPath === absPath) ?? null;
}

export function basename(p: string): string {
  const i = String(p).lastIndexOf("/");
  return i >= 0 ? p.slice(i + 1) : p;
}

export type { EditorState };
