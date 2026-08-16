// web/src/editor/split.ts
// Split view: a second readOnly EditorView that mirrors the active doc.
// FIX #1: forward u.changes incrementally via dispatch (NOT setValue per
// keystroke, which would full-retokenize on every input).

import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { Transaction } from "@codemirror/state";
import { state } from "./state";
import { buildExtensions } from "./cm";
import { darkThemeExt, lightThemeExt } from "./theme";
import { themeComp, langComp, readOnlyComp } from "./cm";
import { languageForFile } from "./languages";
import { $ } from "./ui";

let splitListener: ((u: { docChanged: boolean; changes: unknown }) => void) | null = null;

export function toggleSplitView(): void {
  const view = state.view;
  if (!view) return;
  if (state.rightView) {
    // Close split.
    const pane = document.getElementById("editorPaneRight");
    if (pane) pane.remove();
    state.rightView.destroy();
    state.rightView = null;
    document.getElementById("editorArea")?.classList.remove("split-active");
    state.splitActive = false;
    return;
  }
  const tab = state.openTabs.find((t) => t.id === state.activeTabId);
  if (!tab) return;
  const area = document.getElementById("editorArea");
  if (!area) return;
  const pane = document.createElement("div");
  pane.className = "editor-pane split-right";
  pane.id = "editorPaneRight";
  area.appendChild(pane);

  state.rightView = new EditorView({
    parent: pane,
    state: EditorState.create({
      doc: view.state.doc.toString(),
      extensions: buildExtensions((u) => {
        // Right view is readOnly; we only listen on the LEFT view below.
        void u;
      }),
    }),
  });
  // Make right view read-only + match theme/lang.
  state.rightView.dispatch({
    effects: [
      readOnlyComp.reconfigure(EditorState.readOnly.of(true)),
      themeComp.reconfigure(state.lightTheme ? lightThemeExt : darkThemeExt),
      langComp.reconfigure(languageForFile(tab.name) as never),
    ],
  });

  area.classList.add("split-active");
  state.splitActive = true;
  syncSplitToTab();
}

/** Re-sync the right view to the active tab (full content) on tab switch. */
export function syncSplitToTab(): void {
  const rv = state.rightView;
  const view = state.view;
  if (!rv || !view) return;
  const doc = view.state.doc.toString();
  rv.dispatch({
    changes: { from: 0, to: rv.state.doc.length, insert: doc },
    annotations: Transaction.addToHistory.of(false),
  });
  const tab = state.openTabs.find((t) => t.id === state.activeTabId);
  if (tab) {
    rv.dispatch({
      effects: langComp.reconfigure(languageForFile(tab.name) as never),
    });
  }
}

/**
 * Forward incremental changes from the main view to the right view.
 * Called from the main view's updateListener. FIX #1: increments only.
 */
export function forwardChangesToSplit(u: {
  docChanged: boolean;
  changes: { empty: boolean; iterChanges: (cb: (fromA: number, toA: number, fromB: number, toB: number, inserted: { toString: () => string }) => void) => void };
}): void {
  const rv = state.rightView;
  if (!rv || !u.docChanged) return;
  // Collect all changed ranges relative to the PRE-dispatch doc, then a
  // single dispatch — offset-safe.
  const changes: { from: number; to: number; insert: string }[] = [];
  u.changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
    changes.push({ from: fromA, to: toA, insert: inserted.toString() });
  });
  if (changes.length === 0) return;
  rv.dispatch({
    changes,
    annotations: Transaction.addToHistory.of(false),
  });
}

export { $ };
