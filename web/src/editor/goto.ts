// web/src/editor/goto.ts
// Goto Anything (Ctrl+M). FIX #6: symbol extraction cached per doc version
// (re-scan only when the doc version changes, not on every keystroke).

import { state, getActiveTab } from "./state";
import { $, escapeHtml } from "./ui";
import { getFileIcon } from "./icons";
import { openScannedFile, openRecentFolder, openRecentFile } from "./files";
import { switchToTab } from "./tabs";

interface Symbol {
  name: string;
  line: number;
}

const SYMBOL_PATTERNS = [
  /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
  /^\s*(?:export\s+)?class\s+(\w+)/,
  /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(/,
  /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?function/,
  /^\s*def\s+(\w+)/,
  /^\s*class\s+(\w+)/,
  /^\s*fn\s+(\w+)/,
  /^\s*(?:pub\s+)?struct\s+(\w+)/,
  /^\s*(?:pub\s+)?enum\s+(\w+)/,
  /^\s*(?:pub\s+)?trait\s+(\w+)/,
  /^\s*(?:pub\s+)?fn\s+(\w+)/,
  /^\s*func\s+(?:\([^)]*\)\s+)?(\w+)/,
  /^\s*type\s+(\w+)/,
  /^\s*(?:public|private|protected)\s+(?:static\s+)?[\w<>\[\],\s*]+\s+(\w+)\s*\(/,
  /^\s*(?:static\s+)?(?:void|int|char|float|double|long|bool|boolean|string|String|auto|const|unsigned|signed|size_t|return)\s+(\w+)\s*\(/,
];

// FIX #6: cache keyed by tab id; invalidated when the doc reference changes.
// CM6's Text is immutable — every edit produces a new object, so a reference
// equality (===) check is a perfect invalidation signal (no version number
// needed, and never collides the way the old doc.length key did).
const symbolCache = new Map<
  number,
  { doc: { length: number; lines: number; line: (i: number) => { text: string } }; symbols: Symbol[] }
>();

function extractSymbols(doc: { lines: number; line: (i: number) => { text: string } }): Symbol[] {
  // Iterate via doc.line(i) instead of content.split("\n") — avoids building
  // a full-string copy + array of every line on every (re)scan.
  const symbols: Symbol[] = [];
  for (let i = 1; i <= doc.lines; i++) {
    const text = doc.line(i).text;
    for (const p of SYMBOL_PATTERNS) {
      const m = text.match(p);
      if (m && m[1]) {
        symbols.push({ name: m[1], line: i });
        break;
      }
    }
  }
  return symbols;
}

// Markdown 标题提取（Slate 核心场景：Markdown 大纲）。Goto 的 @ 符号跳转
// 原本只认代码符号（function/class），.md 文件 @ 跳转是空的——这对“Markdown
// 展示”定位是明显缺失。这里按 ATX 标题（# ~ ######）提取，缩进表示层级。
const MD_HEADING_RE = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
function extractMarkdownHeadings(doc: { lines: number; line: (i: number) => { text: string } }): Symbol[] {
  const symbols: Symbol[] = [];
  for (let i = 1; i <= doc.lines; i++) {
    const text = doc.line(i).text;
    const m = text.match(MD_HEADING_RE);
    if (m) {
      const level = m[1].length;
      const title = m[2];
      symbols.push({ name: "\u3000".repeat(level - 1) + title, line: i });
    }
  }
  return symbols;
}

function currentFileSymbols(): Symbol[] {
  const view = state.view;
  const tab = getActiveTab();
  if (!view || !tab) return [];
  // Invalidate on any doc change via reference equality (see symbolCache).
  const doc = view.state.doc;
  const cached = symbolCache.get(tab.id);
  if (cached && cached.doc === doc) return cached.symbols;
  // Markdown 文件用标题大纲；其他文件用代码符号。
  const symbols = /\.md$/i.test(tab.name) ? extractMarkdownHeadings(doc) : extractSymbols(doc);
  symbolCache.set(tab.id, { doc, symbols });
  return symbols;
}

/** FIX #14: drop the cached symbols for a tab. Call from closeTab so the
 *  cache doesn't grow unboundedly as tabs open/close. */
export function clearSymbolCache(tabId: number): void {
  symbolCache.delete(tabId);
}

let gotoPanel: HTMLElement | null = null;

export function showGotoPanel(): void {
  closeGotoPanel();
  if (state.activeTabId == null) return;

  // Build candidate items (files + recents + open tabs).
  const items: { name: string; path: string; absPath: string | null; kind: "file" | "folder" }[] = [];
  const seen = new Set<string>();
  const push = (name: string, path: string, absPath: string | null, kind: "file" | "folder") => {
    const key = kind + "|" + path;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ name, path, absPath, kind });
  };
  for (const f of state.scannedFiles) push(f.name, f.path, f.absPath, "file");
  for (const r of state.recents) {
    if (r.kind === "file") push(r.name, r.path, r.path, "file");
    else push(r.name, r.path, null, "folder");
  }
  for (const t of state.openTabs) if (t.absPath) push(t.name, t.path, t.absPath, "file");

  gotoPanel = document.createElement("div");
  gotoPanel.id = "gotoPanel";
  gotoPanel.className = "float-panel";
  gotoPanel.innerHTML = `
    <input type="text" id="gotoInput" placeholder="输入文件名跳转 \u00b7 @ 函数/符号 \u00b7 :行号">
    <div class="fp-list" id="gotoList"></div>
    <div class="fp-hint">@ 当前文件符号 \u00b7 : 行号 \u00b7 \u2191\u2193 选择 \u00b7 Enter 确认 \u00b7 Esc 关闭</div>
  `;
  document.body.appendChild(gotoPanel);

  let filtered: any[] = [];
  let activeIdx = 0;

  function match(q: string): any[] {
    if (!q) return items.slice(0, 50);
    if (q.startsWith("@")) {
      const lq = q.slice(1).toLowerCase();
      if (!lq) return [];
      return currentFileSymbols()
        .filter((s) => s.name.toLowerCase().includes(lq))
        .map((s) => ({ kind: "symbol", name: s.name, line: s.line, path: "" }))
        .slice(0, 100);
    }
    if (q.startsWith(":")) {
      const n = parseInt(q.slice(1), 10);
      if (!isNaN(n) && n > 0) return [{ kind: "line", name: "跳转到第 " + n + " 行", line: n, path: "" }];
      return [];
    }
    const lq = q.toLowerCase();
    const starts: any[] = [];
    const contains: any[] = [];
    for (const it of items) {
      const n = it.name.toLowerCase();
      const p = it.path.toLowerCase();
      if (n.startsWith(lq) || p.startsWith(lq)) starts.push(it);
      else if (n.includes(lq) || p.includes(lq)) contains.push(it);
    }
    return starts.concat(contains).slice(0, 100);
  }

  function render(): void {
    const list = document.getElementById("gotoList");
    if (!list) return;
    list.innerHTML = "";
    const input = document.getElementById("gotoInput") as HTMLInputElement;
    filtered = match(input.value);
    if (filtered.length === 0) {
      list.innerHTML = '<div class="fp-empty">无匹配</div>';
      return;
    }
    for (let i = 0; i < filtered.length; i++) {
      const it = filtered[i];
      const row = document.createElement("div");
      row.className = "fp-item" + (i === activeIdx ? " active" : "");
      if (it.kind === "symbol") {
        row.innerHTML = '<span class="fp-icon">\u0192</span><span>' + escapeHtml(it.name) + '</span><span class="fp-line">:' + it.line + "</span>";
      } else if (it.kind === "line") {
        row.innerHTML = '<span class="fp-icon">\u21a7</span><span>' + escapeHtml(it.name) + "</span>";
      } else {
        row.innerHTML = '<span class="fp-icon">' + (it.kind === "folder" ? "\uD83D\uDCC1" : getFileIcon(it.name)) + "</span><span>" + escapeHtml(it.name) + '</span><span class="fp-path">' + escapeHtml(it.path) + "</span>";
      }
      row.onclick = () => openGotoItem(it);
      row.onmousemove = () => {
        if (activeIdx === i) return;
        activeIdx = i;
        list.querySelectorAll(".fp-item").forEach((el, idx) => el.classList.toggle("active", idx === activeIdx));
      };
      list.appendChild(row);
    }
    const active = list.querySelector(".active") as HTMLElement | null;
    if (active) active.scrollIntoView({ block: "nearest" });
  }

  function updateActiveClass(): void {
    const list = document.getElementById("gotoList");
    if (!list) return;
    list.querySelectorAll(".fp-item").forEach((el, idx) => el.classList.toggle("active", idx === activeIdx));
    const active = list.querySelector(".active") as HTMLElement | null;
    if (active) active.scrollIntoView({ block: "nearest" });
  }

  function openGotoItem(it: any): void {
    closeGotoPanel();
    const view = state.view;
    if (it.kind === "symbol" || it.kind === "line") {
      if (view) {
        const line = Math.max(1, Math.min(it.line || 1, view.state.doc.lines));
        const lineObj = view.state.doc.line(line);
        view.dispatch({
          selection: { anchor: lineObj.from },
          effects: [],
          scrollIntoView: true,
        } as never);
        view.focus();
      }
      return;
    }
    if (it.kind === "folder") {
      void openRecentFolder(it.absPath || it.path);
      return;
    }
    if (it.absPath) {
      const existing = state.openTabs.find((t) => t.absPath === it.absPath);
      if (existing) {
        switchToTab(existing.id);
        return;
      }
      void openScannedFile({ name: it.name, path: it.path, absPath: it.absPath });
    } else {
      void openRecentFile(it.path, it.name);
    }
  }

  const input = document.getElementById("gotoInput") as HTMLInputElement;
  input.addEventListener("input", () => {
    activeIdx = 0;
    render();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (filtered.length === 0) return;
      const dir = e.key === "ArrowDown" ? 1 : -1;
      activeIdx = Math.min(Math.max(activeIdx + dir, 0), filtered.length - 1);
      updateActiveClass();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIdx]) openGotoItem(filtered[activeIdx]);
    } else if (e.key === "Escape") {
      closeGotoPanel();
    }
  });

  // Default-fill @enclosingFunction for symbol-jump convenience.
  const enclosingFn = getEnclosingFunctionName();
  input.focus();
  if (enclosingFn) {
    input.value = "@" + enclosingFn;
    input.setSelectionRange(1, input.value.length);
  }
  render();
}

export function closeGotoPanel(): void {
  if (gotoPanel) {
    gotoPanel.remove();
    gotoPanel = null;
  }
}

function getEnclosingFunctionName(): string | null {
  const view = state.view;
  const tab = getActiveTab();
  if (!view || !tab) return null;
  // FIX #15: iterate via doc.line(i) (CM6 API) instead of
  // doc.toString().split("\n") — avoids materializing the whole document as a
  // string + array of every line on every Goto open. Line numbers here are
  // 1-indexed (doc.line(i) and symbol.line are both 1-based).
  const doc = view.state.doc;
  const cursorLine = doc.lineAt(view.state.selection.main.head).number;
  const symbols = currentFileSymbols();
  const candidates = symbols
    .filter((s) => s.line <= cursorLine)
    .sort((a, b) => b.line - a.line);
  for (const s of candidates) {
    let depth = 0;
    let closed = false;
    for (let i = s.line; i <= cursorLine; i++) {
      const line = doc.line(i).text;
      for (const ch of line) {
        if (ch === "{") depth++;
        else if (ch === "}") {
          depth--;
          if (depth < 0) {
            closed = true;
            break;
          }
        }
      }
      if (closed) break;
    }
    // Python `def` blocks aren't brace-scoped — a depth-0 def line still
    // encloses the cursor if it hasn't been "closed" by a dedent we can't
    // cheaply detect, so treat a matching def line as the enclosing scope.
    if (depth === 0 && doc.line(s.line).text.includes("def")) return s.name;
    if (!closed) return s.name;
  }
  return null;
}

export { $ };
