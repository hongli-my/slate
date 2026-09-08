// web/src/editor/copy.ts
// Reliable copy/cut for CodeMirror 6 editors (WKWebView).
//
// Background: with a full-document selection, whether the browser's `copy`
// event fires to the page (and whether CM6's handler intercepts it) depends on
// the *native DOM selection* being in sync with the editor state. On WKWebView
// that sync is unreliable, so the browser copies the (partial) DOM selection —
// "Ctrl/Cmd+A then Copy only gets part of the text", across all file types.
//
// Strategy — stop depending on the copy event / DOM selection entirely:
//   1. Intercept Cmd/Ctrl+C and Cmd/Ctrl+X at the *keydown capture* phase when
//      an editor view is focused and has a selection.
//   2. Serialize the text from `view.state.selection` (the single source of
//      truth) — never from the DOM.
//   3. Write to the OS clipboard via the async Clipboard API; if that is
//      unavailable/rejected, fall back to a hidden textarea + execCommand
//      ("copy"), which also writes the full text independent of DOM selection.
//   4. Cut additionally deletes the copied ranges (unless read-only).
//
// The window-level `copy` capture listener below is kept as a belt-and-braces
// path (menu-bar Edit→Copy, context-menu copy) — it writes the same state text
// when the event does reach the page.

import type { EditorView } from "@codemirror/view";
import { state } from "./state";
import { toast } from "./ui";

let installed = false;

function groupViews(): EditorView[] {
  const views: EditorView[] = [];
  for (const g of state.groups) {
    if (g && g.view) views.push(g.view);
  }
  return views;
}

function focusedView(): EditorView | null {
  for (const v of groupViews()) if (v.hasFocus) return v;
  return null;
}

interface Copied {
  text: string;
  ranges: Array<{ from: number; to: number }>;
  linewise: boolean;
}

/** Mirror CM6's copiedRange(): serialize selection, or current line(s) if empty. */
function copiedRange(view: EditorView): Copied {
  const contents: string[] = [];
  const ranges: Array<{ from: number; to: number }> = [];
  let linewise = false;
  for (const range of view.state.selection.ranges) {
    if (!range.empty) {
      contents.push(view.state.sliceDoc(range.from, range.to));
      ranges.push({ from: range.from, to: range.to });
    }
  }
  if (!contents.length) {
    let upto = -1;
    for (const { from } of view.state.selection.ranges) {
      const line = view.state.doc.lineAt(from);
      if (line.number > upto) {
        contents.push(line.text);
        ranges.push({ from: line.from, to: Math.min(view.state.doc.length, line.to + 1) });
      }
      upto = line.number;
    }
    linewise = true;
  }
  return { text: contents.join(view.state.lineBreak), ranges, linewise };
}

/** Write full text to the OS clipboard, with async + legacy fallback. */
async function putClipboard(text: string): Promise<boolean> {
  // 1. Modern async Clipboard API (works in a user-gesture handler).
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    /* fall through */
  }
  // 2. Legacy: hidden textarea + execCommand("copy") — full text, DOM-selection
  //    independent (this is the same trick CM6 uses for captureCopy).
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;left:-10000px;top:10px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

export function installReliableCopy(): void {
  if (installed) return;
  installed = true;

  // Keydown capture: Cmd/Ctrl+C / Cmd/Ctrl+X on a focused editor view.
  window.addEventListener(
    "keydown",
    (e) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
      const isCopy = e.key.toLowerCase() === "c";
      const isCut = e.key.toLowerCase() === "x";
      if (!isCopy && !isCut) return;
      const view = focusedView();
      if (!view) return; // not our editor (file tree, inputs…) → native behaviour
      const { text, ranges, linewise } = copiedRange(view);
      if (!text && !linewise) return;

      e.preventDefault();
      e.stopImmediatePropagation();

      void (async () => {
        const ok = await putClipboard(text);
        if (isCut && ranges.length && !view.state.readOnly) {
          view.dispatch({
            changes: ranges.map((r) => ({ from: r.from, to: r.to })),
            scrollIntoView: true,
            userEvent: "delete.cut",
          });
        }
        if (ok && text.length > 0) {
          toast(`已复制 ${text.length} 字符`);
        }
      })();
    },
    true
  );

  // Window copy capture: menu-bar Edit→Copy / context-menu copy reach the page
  // as a copy event. Write state text so we never fall back to DOM-selection copy.
  window.addEventListener(
    "copy",
    (e) => {
      const view = focusedView();
      if (!view) return;
      const { text, linewise } = copiedRange(view);
      if (!text && !linewise) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const data = e.clipboardData;
      if (data) {
        data.clearData();
        data.setData("text/plain", text);
      } else {
        void putClipboard(text);
      }
    },
    true
  );

  // Window cut capture (menu path).
  window.addEventListener(
    "cut",
    (e) => {
      const view = focusedView();
      if (!view) return;
      const { text, ranges, linewise } = copiedRange(view);
      if (!text && !linewise) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const data = e.clipboardData;
      if (data) {
        data.clearData();
        data.setData("text/plain", text);
      } else {
        void putClipboard(text);
      }
      if (ranges.length && !view.state.readOnly) {
        view.dispatch({
          changes: ranges.map((r) => ({ from: r.from, to: r.to })),
          scrollIntoView: true,
          userEvent: "delete.cut",
        });
      }
    },
    true
  );
}
