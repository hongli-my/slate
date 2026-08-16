// web/src/editor/search.ts
// Global search (Cmd+Shift+F) + in-file search/replace panel.
// FIX #3: global search uses Rust `search_in_files` (replaces serial JS loop).
// FIX #14: replace-all uses CM6 collect-then-single-dispatch (offset-safe).

import {
  SearchQuery,
  setSearchQuery,
  findNext,
  findPrevious,
  replaceAll,
  selectMatches,
  openSearchPanel,
} from "@codemirror/search";
import { state, getActiveTab } from "./state";
import { $, escapeHtml, toast } from "./ui";
import { searchInFiles, type SearchHit } from "./io";
import { getFileIcon } from "./icons";
import { openScannedFile } from "./files";

let searchAllPanel: HTMLElement | null = null;

export function showSearchAllPanel(): void {
  closeSearchAllPanel();
  if (!state.currentDirPath && state.scannedFiles.length === 0) {
    toast("请先打开文件夹");
    return;
  }
  searchAllPanel = document.createElement("div");
  searchAllPanel.id = "searchAllPanel";
  searchAllPanel.className = "float-panel";
  searchAllPanel.innerHTML = `
    <input type="text" id="searchAllInput" placeholder="在文件夹中搜索（Cmd+Shift+F）...">
    <div class="fp-list" id="searchAllList"><div class="fp-empty">输入关键词开始搜索</div></div>
  `;
  document.body.appendChild(searchAllPanel);
  const input = document.getElementById("searchAllInput") as HTMLInputElement;
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void runGlobalSearch(input.value);
    } else if (e.key === "Escape") {
      closeSearchAllPanel();
    }
  });
  input.focus();
}

export function closeSearchAllPanel(): void {
  if (searchAllPanel) {
    searchAllPanel.remove();
    searchAllPanel = null;
  }
}

async function runGlobalSearch(term: string): Promise<void> {
  term = (term || "").trim();
  if (!term || !state.currentDirPath) return;
  const list = document.getElementById("searchAllList");
  if (!list) return;
  list.innerHTML = '<div class="fp-empty">搜索中...</div>';
  // FIX #3: single Rust call instead of a serial JS fsReadText loop.
  let hits: SearchHit[] = [];
  try {
    hits = await searchInFiles(state.currentDirPath, term, {
      caseSensitive: false,
      regex: false,
      maxResults: 200,
    });
  } catch (e) {
    list.innerHTML = '<div class="fp-empty">搜索失败: ' + escapeHtml((e as Error).message) + "</div>";
    return;
  }
  if (hits.length === 0) {
    list.innerHTML = '<div class="fp-empty">未找到匹配</div>';
    return;
  }
  list.innerHTML = "";
  for (const r of hits) {
    const row = document.createElement("div");
    row.className = "fp-item";
    const name = r.path.split("/").pop() || r.path;
    row.innerHTML =
      '<span class="fp-icon">' + getFileIcon(name) + "</span>" +
      '<span class="fp-snippet">' + escapeHtml(r.snippet) + "</span>" +
      '<span class="fp-line">' + r.line + "</span>";
    row.onclick = () => {
      closeSearchAllPanel();
      void openSearchResult(r);
    };
    list.appendChild(row);
  }
}

async function openSearchResult(r: SearchHit): Promise<void> {
  const absPath = r.path;
  const existing = state.openTabs.find((t) => t.absPath === absPath);
  const view = state.view;
  if (existing) {
    const { switchToTab } = await import("./tabs");
    switchToTab(existing.id);
  } else {
    const name = absPath.split("/").pop() || absPath;
    await openScannedFile({ name, path: name, absPath });
  }
  if (view) {
    const line = Math.max(1, r.line);
    const lineObj = view.state.doc.line(line);
    view.dispatch({
      selection: { anchor: lineObj.from },
      effects: [],
      scrollIntoView: true,
    } as never);
    view.focus();
  }
}

// ---- In-file search/replace panel (custom UI over CM6 search API) ----
let searchPanel: HTMLElement | null = null;

export function showSearchReplacePanel(showReplace = true): void {
  closeSearchReplacePanel();
  const view = state.view;
  if (!view) return;
  // Prefer the built-in CM6 panel for keyboard parity, but also expose our
  // custom panel for the existing UI. Use CM6's openSearchPanel when no
  // replace is needed; otherwise show our custom panel.
  if (!showReplace) {
    openSearchPanel(view);
    return;
  }
  searchPanel = document.createElement("div");
  searchPanel.id = "searchReplacePanel";
  searchPanel.innerHTML = `
    <button class="close-btn" id="srCloseBtn">\u00d7</button>
    <div class="row"><label>查找</label><input type="text" id="searchInput" placeholder="输入查找内容..."><span class="counter" id="searchCounter"></span></div>
    <div class="row" id="replaceRow"><label>替换</label><input type="text" id="replaceInput" placeholder="输入替换内容..."></div>
    <div class="btn-group">
      <button id="srNext">下一个</button>
      <button id="srPrev">上一个</button>
      <button id="srReplace">替换</button>
      <button class="primary" id="srReplaceAll">全部替换</button>
    </div>
  `;
  document.body.appendChild(searchPanel);

  const input = document.getElementById("searchInput") as HTMLInputElement;
  input.focus();
  input.addEventListener("input", () => {
    const term = input.value;
    if (term && view) {
      // Set the query so CM6 highlights matches natively + count via selectMatches.
      view.dispatch({ effects: setSearchQuery.of(new SearchQuery({ search: term })) });
      updateCounter(countMatches(view, term));
    } else {
      updateCounter(0);
    }
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) doSearchPrev();
      else doSearchNext();
    } else if (e.key === "Escape") {
      closeSearchReplacePanel();
    }
  });
  document.getElementById("srCloseBtn")?.addEventListener("click", closeSearchReplacePanel);
  document.getElementById("srNext")?.addEventListener("click", doSearchNext);
  document.getElementById("srPrev")?.addEventListener("click", doSearchPrev);
  document.getElementById("srReplace")?.addEventListener("click", doReplace);
  document.getElementById("srReplaceAll")?.addEventListener("click", doReplaceAll);
}

export function closeSearchReplacePanel(): void {
  if (searchPanel) {
    searchPanel.remove();
    searchPanel = null;
  }
}

function getTerm(): string {
  return (document.getElementById("searchInput") as HTMLInputElement | null)?.value ?? "";
}
function getReplacement(): string {
  return (document.getElementById("replaceInput") as HTMLInputElement | null)?.value ?? "";
}

function countMatches(view: import("@codemirror/view").EditorView, term: string): number {
  if (!term) return 0;
  const doc = view.state.doc.toString();
  let count = 0;
  let i = 0;
  while (i <= doc.length) {
    const idx = doc.indexOf(term, i);
    if (idx < 0) break;
    count++;
    i = idx + term.length;
  }
  return count;
}

function updateCounter(n: number): void {
  const c = document.getElementById("searchCounter");
  if (c) c.textContent = n > 0 ? n + " 个匹配" : "";
}

function doSearchNext(): void {
  const view = state.view;
  if (!view) return;
  const term = getTerm();
  if (!term) return;
  view.dispatch({ effects: setSearchQuery.of(new SearchQuery({ search: term })) });
  findNext(view);
  view.focus();
}
function doSearchPrev(): void {
  const view = state.view;
  if (!view) return;
  const term = getTerm();
  if (!term) return;
  view.dispatch({ effects: setSearchQuery.of(new SearchQuery({ search: term })) });
  findPrevious(view);
  view.focus();
}
function doReplace(): void {
  // CM6 single replace: select next match then replace selection.
  const view = state.view;
  if (!view) return;
  const term = getTerm();
  const replacement = getReplacement();
  if (!term) return;
  view.dispatch({ effects: setSearchQuery.of(new SearchQuery({ search: term, replace: replacement })) });
  // Use CM6's replaceAll with a single-match trick is overkill; do one replace:
  const sel = view.state.selection.main;
  const selected = view.state.sliceDoc(sel.from, sel.to);
  if (selected === term) {
    view.dispatch({ changes: { from: sel.from, to: sel.to, insert: replacement } });
  }
  findNext(view);
}
function doReplaceAll(): void {
  const view = state.view;
  if (!view) return;
  const term = getTerm();
  const replacement = getReplacement();
  if (!term) return;
  // FIX #14: CM6 replaceAll collects all matches then applies in ONE dispatch
  // (offset-safe, unlike the old loop that mutated offsets each iteration).
  view.dispatch({
    effects: setSearchQuery.of(new SearchQuery({ search: term, replace: replacement })),
  });
  const before = countMatches(view, term);
  replaceAll(view);
  toast(`已替换 ${before} 处`);
  closeSearchReplacePanel();
}

/** Cmd+Shift+L: select all occurrences of current selection/word. */
export function selectAllOccurrences(): void {
  const view = state.view;
  if (!view) return;
  const sel = view.state.selection.main;
  let term = view.state.sliceDoc(sel.from, sel.to);
  if (!term) {
    // Word at cursor.
    const line = view.state.doc.lineAt(sel.head);
    const text = line.text;
    let s = sel.head - line.from;
    let a = s;
    while (a > 0 && /[\w$]/.test(text[a - 1])) a--;
    let b = s;
    while (b < text.length && /[\w$]/.test(text[b])) b++;
    term = text.slice(a, b);
  }
  if (!term) return;
  view.dispatch({ effects: setSearchQuery.of(new SearchQuery({ search: term })) });
  selectMatches(view);
  view.focus();
}

export { $, getActiveTab };
