// web/src/editor/statusbar.ts
import { state, getActiveTab } from "./state";
import { languageLabel } from "./languages";
import { $ } from "./ui";
import type { EditorView } from "@codemirror/view";

export function updateStatusBar(): void {
  const tab = getActiveTab();
  const fileEl = $("stFile");
  const langEl = $("stLang");
  fileEl.textContent = tab ? tab.name + (tab.modified ? " (已修改)" : "") : "未打开文件";
  langEl.textContent = tab ? (tab.lang || languageLabel(tab.name)) : "-";
  updateStatusCursor();
  updateEolLabel();
}

export function updateStatusCursor(): void {
  const view = state.view;
  const el = $("stPos");
  if (!view || !state.activeTabId) {
    el.textContent = "行 1, 列 1";
    return;
  }
  const head = view.state.selection.main.head;
  const line = view.state.doc.lineAt(head);
  el.textContent = "行 " + line.number + ", 列 " + (head - line.from + 1);
}

export function updateEolLabel(): void {
  const el = $("stEol");
  if (!el) return;
  const tab = getActiveTab();
  el.textContent = tab ? tab.eol : "LF";
}

export function updateEncodingLabel(encoding: string): void {
  // The status bar has a fixed <span>UTF-8</span> after stEol. We update it.
  const bar = $("statusBar");
  if (!bar) return;
  const spans = bar.querySelectorAll("span");
  // Last span is the encoding slot.
  const enc = spans[spans.length - 1];
  if (enc) enc.textContent = (encoding || "utf-8").toUpperCase();
}

export function attachCursorListener(view: EditorView): void {
  // cursorActivity is handled centrally via updateListener in index.ts.
  void view;
}
