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
  foldEffect,
  syntaxTree,
} from "@codemirror/language";
import {
  closeBrackets,
  closeBracketsKeymap,
  autocompletion,
  completionKeymap,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";
import { search, searchKeymap, setSearchQuery, SearchQuery, SearchCursor } from "@codemirror/search";
import { EditorView as EV } from "@codemirror/view";

import { state, setActiveGroup } from "./state";
import { darkThemeExt, lightThemeExt } from "./theme";
import { languageForFile } from "./languages";
import { getNoteFileList, fuzzyScore } from "./wikilink";

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
  // 必须是有效 SearchQuery（空串），不能传 null：setSearchQuery 的 handler
  // 会 dereference effect.value，null.create 会抛 TypeError。
  view.dispatch({ effects: setSearchQuery.of(new SearchQuery({ search: "" })) });
}

let occTimer: ReturnType<typeof setTimeout> | null = null;
const MAX_OCC = 300;
const MAX_OCC_DOC = 200000;

/** Debounced (120ms) occurrence highlight of the word at / around the cursor.
 *  120ms (down from 220ms) makes same-word highlighting feel instant, like
 *  Sublime — the MAX_OCC / MAX_OCC_DOC guards keep this safe on big docs. */
export function scheduleOccurrenceHighlight(view: EditorView): void {
  if (occTimer) clearTimeout(occTimer);
  occTimer = setTimeout(() => {
    occTimer = null;
    highlightOccurrences(view);
  }, 120);
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
    // 用户正在选择文本（很可能准备复制）。此时不做任何 occurrence 高亮：
    // Decoration.mark 会改变 DOM（在选中的词外包一层 span），导致浏览器原生
    // 选区错乱 —— 表现为“复制只复制了一半”。直接清除并返回，保持 DOM 稳定。
    clearOccurrences(view);
    return;
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

  // Collect matches via SearchCursor — no full-doc toString() + indexOf scan
  // (that was O(n) string copy per keystroke and janked on large files).
  const ranges: OccRange[] = [];
  const cursor = new SearchCursor(doc, word);
  let count = 0;
  while (!cursor.next().done && count < MAX_OCC) {
    const m = cursor.value;
    // Skip the cursor's own occurrence (matches CM5 behavior).
    if (m.from === wordFrom && m.to === wordTo) continue;
    ranges.push({ from: m.from, to: m.to });
    count++;
  }
  view.dispatch({ effects: setOccurrences.of(ranges) });
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

// ---- Wikilink [[ ]] autocomplete ----
// Triggered when the cursor sits right after `[[` (with an optional partial
// query). Offers every note title in the vault, ranked by fuzzyScore. The
// note-title list comes from getNoteFileList() — a provider registered by
// index.ts after the vault loads; until then this source returns null
// (silent no-op). Bails inside code blocks / inline code so `[[x]]` inside
// a fenced ``` block doesn't pop a spurious popup.
const CODE_NODE_RE = /code/i;

function wikilinkCompletionSource(context: CompletionContext): CompletionResult | null {
  // matchBefore requires the match to end exactly at the cursor.
  // /\[\[([^\]|]*)/ matches `[[` plus zero+ non-]/non-| chars.
  const word = context.matchBefore(/\[\[([^\]|]*)/);
  if (!word || word.text.length < 2) return null; // need at least "[["

  // Skip when the cursor is inside a code construct (fenced block, inline
  // code, etc.) so we don't interfere with code editing.
  const node = syntaxTree(context.state).resolveInner(context.pos, -1);
  if (node.name && CODE_NODE_RE.test(node.name)) return null;

  const all = getNoteFileList();
  if (all.length === 0) return null; // provider not wired / empty vault

  const query = word.text.slice(2); // text after "[["

  let items: { label: string; score: number }[];
  if (query === "") {
    // No query yet — show everything, alphabetical.
    items = all.map((t) => ({ label: t, score: 0 }));
  } else {
    items = all
      .map((t) => ({ label: t, score: fuzzyScore(query, t) }))
      .filter((it) => it.score > 0);
  }
  if (items.length === 0) return null;
  items.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));

  return {
    // Replace starting right after `[[` — `[[` stays typed, we insert
    // `${label}]]`. `to` covers any partial query the user already typed.
    from: word.from + 2,
    to: word.to,
    options: items.map((it) => ({ label: it.label, apply: `${it.label}]]` })),
    // Stay valid while the user keeps typing non-]/non-| chars after `[[`.
    validFor: /^[^\]|]*$/,
  };
}

/** Build the full base extension set for the main editor. */
export function buildExtensions(onUpdate: (u: ViewUpdate) => void): Extension[] {
  return [
    highlightSpecialChars(),
    // CM6's history has no configurable max depth (only minDepth + grouping
    // delay); the default minDepth of 100 is fine. Undo memory is bounded
    // internally by the editor, not by this config.
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
      // Wikilink [[ ]] completion source. See wikilinkCompletionSource above.
      override: [wikilinkCompletionSource],
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

/** 自动折叠大 JSON 的顶层 value（Slate 定位：JSON 查看）。
 *  遍历语法树，找顶层 Object/Array 的直接子节点中类型为 Object/Array 的
 *  value，逐个 foldEffect。这样打开大 JSON 时每个顶层 key 显示为
 *  "key": {...} / "key": [...]，深层内容折叠，结构一眼可读。
 *  幂等：已折叠的范围再 fold 不会出错。 */
export function autoFoldJson(view: EditorView): void {
  const tree = syntaxTree(view.state);
  const top = tree.topNode;
  if (top.name !== "JsonText") return;
  const root = top.firstChild; // 顶层 Object 或 Array
  if (!root) return;
  const effects: ReturnType<typeof foldEffect.of>[] = [];
  let child = root.firstChild;
  while (child) {
    // Object 的子节点是 Property(name: value)；Array 的子节点直接是 value。
    // 对 Property，找其子节点中的 Object/Array（即 value）；对 Array 元素同理。
    let valueNode = child;
    if (child.name === "Property") {
      // Property = PropertyName : value；value 是 Object/Array/String/... 之一。
      valueNode = child.lastChild ?? child;
    }
    if (valueNode && (valueNode.name === "Object" || valueNode.name === "Array")) {
      // 跳过空 {} / []（折叠无意义且可能被 CM6 忽略）。
      if (valueNode.to > valueNode.from + 2) {
        effects.push(foldEffect.of({ from: valueNode.from, to: valueNode.to }));
      }
    }
    child = child.nextSibling;
  }
  if (effects.length) view.dispatch({ effects });
}

// re-export for index
export { Decoration, EditorState, EditorSelection };
export { foldKeymap, deleteLine, undoSelection, redoSelection };
export { EV };
