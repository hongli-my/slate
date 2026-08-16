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

// FIX #6: cache keyed by tab id; invalidated when doc version changes.
const symbolCache = new Map<
  number,
  { version: number; symbols: Symbol[] }
>();

function extractSymbols(content: string): Symbol[] {
  const lines = String(content || "").split("\n");
  const symbols: Symbol[] = [];
  for (let i = 0; i < lines.length; i++) {
    for (const p of SYMBOL_PATTERNS) {
      const m = lines[i].match(p);
      if (m && m[1]) {
        symbols.push({ name: m[1], line: i + 1 });
        break;
      }
    }
  }
  return symbols;
}

function currentFileSymbols(): Symbol[] {
  const view = state.view;
  const tab = getActiveTab();
  if (!view || !tab) return [];
  const version = view.state.doc.length; // cheap proxy; full version via view.state.version
  const cached = symbolCache.get(tab.id);
  if (cached && cached.version === version) return cached.symbols;
  const symbols = extractSymbols(view.state.doc.toString());
  symbolCache.set(tab.id, { version, symbols });
  return symbols;
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
  const content = view.state.doc.toString();
  const lines = content.split("\n");
  const cursorLine = view.state.doc.lineAt(view.state.selection.main.head).number - 1;
  const symbols = currentFileSymbols();
  const candidates = symbols
    .filter((s) => s.line - 1 <= cursorLine)
    .sort((a, b) => b.line - a.line);
  for (const s of candidates) {
    let depth = 0;
    let closed = false;
    for (let i = s.line - 1; i <= cursorLine; i++) {
      const l = lines[i] || "";
      for (const ch of l) {
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
    if (depth === 0 && (lines[s.line - 1] || "").includes("def")) return s.name;
    if (!closed) return s.name;
  }
  return null;
}

export { $ };
