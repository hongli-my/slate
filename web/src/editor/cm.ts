// web/src/editor/cm.ts
// CodeMirror 6 EditorView factory + runtime compartments (theme/lang/readonly/wrap)
// + occurrence-highlight StateField (FIX #16: replaces CM5 getAllMarks).

import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightSpecialChars,
  ViewUpdate,
} from "@codemirror/view";
import {
  EditorState,
  Compartment,
  StateField,
  StateEffect,
  Extension,
  EditorSelection,
} from "@codemirror/state";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
  deleteLine,
  undoSelection,
  redoSelection,
} from "@codemirror/commands";
import {
  bracketMatching,
  foldGutter,
  indentOnInput,
  codeFolding,
  syntaxHighlighting,
  defaultHighlightStyle,
  foldKeymap,
} from "@codemirror/language";
import {
  closeBrackets,
  closeBracketsKeymap,
  autocompletion,
  completionKeymap,
} from "@codemirror/autocomplete";
import { search, searchKeymap, setSearchQuery, SearchQuery } from "@codemirror/search";
import { EditorView as EV } from "@codemirror/view";

import { state, setActiveGroup } from "./state";
import { darkThemeExt, lightThemeExt } from "./theme";
import { languageForFile } from "./languages";

// ---- Occurrence highlight via StateField (FIX #16) ----
interface OccRange { from: number; to: number; }

const setOccurrences = StateEffect.define<OccRange[]>();

const occurrenceField = StateField.define({
  create: () => Decoration.none,
  update: (dec, tr) => {
    dec = dec.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(setOccurrences)) {
        const ranges = e.value;
        if (ranges.length === 0) return Decoration.none;
        return Decoration.set(
          ranges.map((r) => Decoration.mark({ class: "cm-occurrence" }).range(r.from, r.to)),
          true
        );
      }
    }
    return dec;
  },
  provide: (f) => EV.decorations.from(f),
});

// Need Decoration import (defined below to avoid hoisting issues).
import { Decoration } from "@codemirror/view";

/** Clear occurrence marks — only touches this field, folding untouched (FIX #16). */
export function clearOccurrences(view: EditorView): void {
  view.dispatch({ effects: setOccurrences.of([]) });
}

/** Clear the in-file search highlight (cm-searchMatch) so a stale search term
 *  doesn't keep painting matches across the document after an operation that
 *  replaces the whole doc (e.g. format / EOL toggle). */
export function clearSearchHighlights(view: EditorView): void {
  view.dispatch({ effects: setSearchQuery.of(null) });
}

let occTimer: ReturnType<typeof setTimeout> | null = null;
const MAX_OCC = 300;
const MAX_OCC_DOC = 200000;

/** Debounced (220ms) occurrence highlight of the word at / around the cursor. */
export function scheduleOccurrenceHighlight(view: EditorView): void {
  if (occTimer) clearTimeout(occTimer);
  occTimer = setTimeout(() => {
    occTimer = null;
    highlightOccurrences(view);
  }, 220);
}

/** Cancel a pending (debounced) occurrence highlight. Used after operations
 *  that replace the whole doc, so we don't re-highlight a stale cursor word. */
export function cancelOccurrenceHighlight(): void {
  if (occTimer) {
    clearTimeout(occTimer);
    occTimer = null;
  }
}

function highlightOccurrences(view: EditorView): void {
  if (!view) return;
  // Multi-selection: clear, don't compete with Cmd+D.
  if (view.state.selection.ranges.length > 1) {
    clearOccurrences(view);
    return;
  }
  const doc = view.state.doc;
  if (doc.length > MAX_OCC_DOC) {
    clearOccurrences(view);
    return;
  }
  const sel = view.state.selection.main;
  // FIX: CM6's selection mapping can produce a range where `from > to` when
  // both endpoints were inside a fully-deleted range (e.g., after
  // `replaceWholeDoc`). Normalize to (min, max) before any sliceString call.
  const selFrom = Math.min(sel.from, sel.to);
  const selTo = Math.max(sel.from, sel.to);
  let word = "";
  let wordFrom = selFrom;
  let wordTo = selTo;
  if (selFrom !== selTo) {
    const s = doc.sliceString(selFrom, selTo);
    if (s.length === 0 || s.length > 40 || s.includes("\n")) {
      // FIX: empty result (e.g., from a reversed-from mapping) is treated as
      // "no usable word" — clear highlights instead of inifinte-loop padding.
      clearOccurrences(view);
      return;
    }
    word = s;
    wordFrom = selFrom;
    wordTo = selTo;
  } else {
    // Word at cursor (Sublime-style).
    const line = doc.lineAt(sel.head);
    const text = line.text;
    let s = sel.head - line.from;
    let a = s;
    while (a > 0 && /[\w$]/.test(text[a - 1])) a--;
    let b = s;
    while (b < text.length && /[\w$]/.test(text[b])) b++;
    word = text.slice(a, b);
    wordFrom = line.from + a;
    wordTo = line.from + b;
    if (word.length < 2 || !/^[\w$]+$/.test(word)) {
      clearOccurrences(view);
      return;
    }
  }

  // Collect all matches in one pass, then a single dispatch.
  const ranges: OccRange[] = [];
  const text = doc.toString();
  let i = 0;
  let count = 0;
  while (i <= text.length) {
    const idx = text.indexOf(word, i);
    if (idx < 0) break;
    // Skip the cursor's own occurrence (matches CM5 behavior).
    if (!(idx === wordFrom && idx + word.length === wordTo)) {
      ranges.push({ from: idx, to: idx + word.length });
      if (++count >= MAX_OCC) break;
    }
    i = idx + word.length;
  }
  // FIX: defensively filter out any empty/zero-width ranges so we never
  // throw "Mark decorations may not be empty" inside the field update.
  const safeRanges = ranges.length === ranges.filter((r) => r.from !== r.to).length
    ? ranges
    : ranges.filter((r) => r.from !== r.to);
  view.dispatch({ effects: setOccurrences.of(safeRanges) });
}

// ---- Compartments ----
export const themeComp = new Compartment();
export const langComp = new Compartment();
export const readOnlyComp = new Compartment();
export const wrapComp = new Compartment();
export const minimapComp = new Compartment();

/** Update listener: central change/cursor/scroll dispatch. */
export function makeUpdateListener(onUpdate: (u: ViewUpdate) => void): Extension {
  return EditorView.updateListener.of(onUpdate);
}

// cmd+click add cursor (multi-cursor) — domEventHandlers.
function cmdClickHandler(): Extension {
  return EditorView.domEventHandlers({
    mousedown(e, view) {
      if (e.button !== 0 || (!e.metaKey && !e.ctrlKey)) return false;
      const pos = view.posAtCoords({ x: e.clientX, y: e.clientY });
      if (pos == null) return false;
      view.dispatch({
        selection: EditorSelection.create(
          [...view.state.selection.ranges, EditorSelection.cursor(pos)],
          view.state.selection.ranges.length
        ),
      });
      return true;
    },
  });
}

/** Build the full base extension set for the main editor. */
export function buildExtensions(onUpdate: (u: ViewUpdate) => void): Extension[] {
  return [
    highlightSpecialChars(),
    history(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    rectangularSelection(),
    crosshairCursor(),
    // FIX: highlightActiveLine() REMOVED — with lineWrapping on, a long line
    // (e.g. a long SQL string in JSON) wraps into a dozen visual lines, and the
    // whole-line active background then paints a huge block that looks exactly
    // like a spurious multi-line selection. Keep only the gutter (line-number)
    // highlight so the cursor line is still locatable, but the content area
    // stays clean.
    highlightActiveLineGutter(),
    codeFolding(),
    foldGutter({
      markerDOM: (open) => {
        const el = document.createElement("span");
        el.textContent = open ? "\u25BC" : "\u25B6";
        el.style.cssText = "cursor:pointer;color:#999;font-size:10px;";
        return el;
      },
    }),
    lineNumbers(),
    // NOTE: highlightSelectionMatches() and occurrenceField were REMOVED because
    // they caused confusing "fake selection" backgrounds — clicking on a common
    // word (e.g., "selected", "total" in JSON) would highlight ALL occurrences
    // across many lines, making it look like a large block was selected.
    EditorView.lineWrapping, // default wrap on (matches CM5 lineWrapping:true)
    wrapComp.of([]),
    themeComp.of(state.lightTheme ? lightThemeExt : darkThemeExt),
    langComp.of([]),
    readOnlyComp.of(EditorState.readOnly.of(true)),
    minimapComp.of([]),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    // Load the search() extension so searchState always exists. Without it,
    // setSearchQuery.of() effects have no handler (highlights never appear),
    // and findNext/findPrevious — used by our custom panel's "next/prev"
    // buttons AND by the F3/Mod-g keymap — fall back to openSearchPanel(),
    // which dynamically injects searchExtensions and spawns CM6's native
    // bottom panel. search() itself does NOT open the panel (the panel only
    // shows on togglePanel.of(true) / openSearchPanel), so loading it is safe.
    search(),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      // Drop CM6's built-in search-panel-opening keys. Mod-f is handled by a
      // document-level listener (keymap.ts) that opens our custom panel. F3
      // and Mod-g (find next/prev) are dropped because with an empty/invalid
      // query — the state right after opening our panel — they still call
      // openSearchPanel() and spawn the native panel. Our custom panel's
      // buttons call findNext/findPrevious directly and, with search() loaded
      // and a valid query, take the normal branch without opening the panel.
      ...searchKeymap.filter(
        (k) => k.key !== "Mod-f" && k.key !== "F3" && k.key !== "Mod-g",
      ),
      ...historyKeymap,
      ...foldKeymap,
      ...completionKeymap,
      indentWithTab,
    ]),
    autocompletion({
      activateOnTyping: true,
      defaultKeymap: true,
    }),
    cmdClickHandler(),
    makeUpdateListener(onUpdate),
  ];
}

/**
 * 精简扩展集已移除——双独立可编辑分栏模型下，两个 group 都使用
 * buildExtensions()（完整可编辑扩展集）。Phase 2 删除 buildReadOnlyExtensions。
 */

/** Create an EditorView mounted into `parent`, belonging to editor group
 *  `groupId`. The focus listener routes file-open / statusbar updates to
 *  whichever pane the user clicks. */
export function createEditorView(
  parent: HTMLElement,
  groupId: 0 | 1,
  onUpdate: (u: ViewUpdate) => void
): EditorView {
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc: "",
      extensions: buildExtensions(onUpdate),
    }),
  });
  view.dom.style.display = "none"; // hidden until a tab is opened
  state.groups[groupId].view = view;
  // Wire compartments into state (idempotent — only needs to happen once).
  state.themeComp = themeComp as never;
  state.langComp = langComp as never;
  state.readOnlyComp = readOnlyComp as never;
  state.wrapComp = wrapComp as never;
  // Focus routing: clicking this pane makes it the active group.
  view.dom.addEventListener("mousedown", () => setActiveGroup(groupId), true);
  return view;
}

/** Switch the active language by file name. */
export function setLanguage(view: EditorView, name: string): void {
  const lang = languageForFile(name);
  view.dispatch({ effects: langComp.reconfigure(lang as Extension) });
}

/** Toggle theme via compartment reconfigure. */
export function applyTheme(view: EditorView, light: boolean): void {
  view.dispatch({ effects: themeComp.reconfigure(light ? lightThemeExt : darkThemeExt) });
}

export function setReadOnly(view: EditorView, ro: boolean): void {
  view.dispatch({ effects: readOnlyComp.reconfigure(EditorState.readOnly.of(ro)) });
}

// re-export for index
export { Decoration, EditorState, EditorSelection };
export { foldKeymap, deleteLine, undoSelection, redoSelection };
export { EV };
