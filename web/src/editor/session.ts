// web/src/editor/session.ts
// Session restore. FIX #2/#12: localStorage stores ONLY paths + cursor +
// theme + EOL, NOT content (content lives on disk; re-read on restore).
// 500ms debounce. Silent-fail (try/catch).
//
// === v2 format (dual editor groups) ===
// { version:2, groups:[{tabs,activePath}, {tabs,activePath}], activeGroup,
//   splitActive, splitMode, cursor, theme }
// v1 (flat {tabs, activePath, cursor, theme}) is still read: all tabs go to
// group0, split closed. Fully backward-compatible.

import { state, getActiveView, setActiveGroup } from "./state";
import { switchToTab } from "./tabs";
import { applyTheme } from "./cm";
import { readTextFile } from "./io";
import { syncPreviewPane } from "./preview";
import { toast } from "./ui";

export const SESSION_KEY = "slate.session.v1";

let sessionTimer: ReturnType<typeof setTimeout> | null = null;

export function saveSession(): void {
  if (sessionTimer) return;
  sessionTimer = setTimeout(() => {
    sessionTimer = null;
    saveSessionNow();
  }, 500); // FIX #12: 500ms debounce (was 200ms)
}

function saveSessionNow(): void {
  try {
    const total = state.groups[0].tabs.length + state.groups[1].tabs.length;
    if (total === 0) return;
    const view = getActiveView();
    const cursor = view ? view.state.selection.main.head : 0;
    // FIX #2: NO content stored — only path/name/absPath/eol/encoding.
    const data = {
      version: 2,
      groups: state.groups.map((g) => ({
        tabs: g.tabs.map((t) => ({
          name: t.name,
          path: t.path,
          absPath: t.absPath,
          eol: t.eol,
          encoding: t.encoding,
        })),
        activePath: g.tabs.find((t) => t.id === g.activeTabId)?.path ?? null,
      })),
      activeGroup: state.activeGroup,
      splitActive: state.splitActive,
      splitMode: state.splitMode,
      splitRatio: state.splitRatio,
      cursor,
      theme: state.lightTheme,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    /* silent fail */
  }
}

interface TabRecord {
  name: string;
  path: string;
  absPath?: string;
  eol?: string;
  encoding?: string;
}

async function loadTabContent(
  t: TabRecord
): Promise<{ content: string; encoding: string; mtimeMs: number | null }> {
  let content = "";
  let encoding = t.encoding || "utf-8";
  let mtimeMs: number | null = null;
  if (t.absPath) {
    try {
      const r = await readTextFile(t.absPath);
      content = r.text;
      encoding = r.encoding;
    } catch {
      content = ""; // file may have been deleted/moved
    }
  }
  return { content, encoding, mtimeMs };
}

export async function restoreSession(): Promise<void> {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);

    // Normalize v1 (flat tabs) and v2 (groups array) into a common shape.
    let groupTabsList: TabRecord[][] = [[], []];
    let activePaths: (string | null)[] = [null, null];
    let activeGroup: 0 | 1 = 0;
    let splitActive = false;
    let splitMode: "horizontal" | "vertical" | null = null;
    let splitRatio: number | null = null;
    let cursor = 0;
    let theme = false;

    if (data && data.version === 2 && Array.isArray(data.groups)) {
      const gs = data.groups as TabRecord[][];
      groupTabsList[0] = Array.isArray(gs[0]?.tabs) ? gs[0].tabs : [];
      groupTabsList[1] = Array.isArray(gs[1]?.tabs) ? gs[1].tabs : [];
      const ap0 = data.groups[0]?.activePath;
      const ap1 = data.groups[1]?.activePath;
      activePaths[0] = typeof ap0 === "string" ? ap0 : null;
      activePaths[1] = typeof ap1 === "string" ? ap1 : null;
      activeGroup = data.activeGroup === 1 ? 1 : 0;
      splitActive = !!data.splitActive && groupTabsList[1].length > 0;
      splitMode =
        data.splitMode === "vertical" ? "vertical"
        : data.splitMode === "horizontal" ? "horizontal"
        : null;
      splitRatio = typeof data.splitRatio === "number" ? data.splitRatio : null;
      cursor = typeof data.cursor === "number" ? data.cursor : 0;
      theme = !!data.theme;
    } else if (data && Array.isArray(data.tabs) && data.tabs.length > 0) {
      // v1 compat: all tabs into group0, split closed.
      groupTabsList[0] = data.tabs as TabRecord[];
      activePaths[0] = typeof data.activePath === "string" ? data.activePath : null;
      cursor = typeof data.cursor === "number" ? data.cursor : 0;
      theme = !!data.theme;
    } else {
      return;
    }

    const totalTabs = groupTabsList[0].length + groupTabsList[1].length;
    if (totalTabs === 0) return;

    const { addTab } = await import("./tabs");
    const pathToIdPerGroup: Record<number, Record<string, number>> = { 0: {}, 1: {} };

    // ---- Restore group0 tabs (group0 view already mounted by initEditor). ----
    for (const t of groupTabsList[0]) {
      // Field validation: localStorage may be externally written or version-
      // migrated. A non-string name makes addTab→languageLabel().split() throw,
      // which would abort the whole restore loop. Skip invalid entries.
      if (!t || typeof t.name !== "string" || typeof t.path !== "string") {
        console.warn("恢复会话: 跳过非法 tab 条目", t);
        continue;
      }
      const { content, encoding, mtimeMs } = await loadTabContent(t);
      const eol: "LF" | "CRLF" = t.eol === "CRLF" ? "CRLF" : "LF";
      const tab = addTab(t.name, t.path, content, t.absPath || null, encoding, eol, mtimeMs, 0);
      pathToIdPerGroup[0][t.path] = tab.id;
    }
    // Restore group0 active tab.
    if (state.groups[0].tabs.length > 0) {
      const ap = activePaths[0];
      const aid = ap && pathToIdPerGroup[0][ap]
        ? pathToIdPerGroup[0][ap]
        : state.groups[0].tabs[0].id;
      switchToTab(aid, 0);
    }

    // ---- Restore split + group1 tabs (mount group1 view first). ----
    if (splitActive && groupTabsList[1].length > 0) {
      const { mountGroup1 } = await import("./split");
      const dir = splitMode ?? "horizontal";
      // Stash ratio before mountGroup1 consumes it (mountGroup1 reads state.splitRatio).
      state.splitRatio = splitRatio;
      const g1View = mountGroup1(dir);
      if (g1View) {
        for (const t of groupTabsList[1]) {
          if (!t || typeof t.name !== "string" || typeof t.path !== "string") {
            console.warn("恢复会话: 跳过非法 tab 条目", t);
            continue;
          }
          const { content, encoding, mtimeMs } = await loadTabContent(t);
          const eol: "LF" | "CRLF" = t.eol === "CRLF" ? "CRLF" : "LF";
          const tab = addTab(t.name, t.path, content, t.absPath || null, encoding, eol, mtimeMs, 1);
          pathToIdPerGroup[1][t.path] = tab.id;
        }
        // Restore group1 active tab.
        if (state.groups[1].tabs.length > 0) {
          const ap = activePaths[1];
          const aid = ap && pathToIdPerGroup[1][ap]
            ? pathToIdPerGroup[1][ap]
            : state.groups[1].tabs[0].id;
          switchToTab(aid, 1);
        }
      }
    }

    // ---- Final active group + cursor. ----
    setActiveGroup(activeGroup === 1 && state.splitActive ? 1 : 0);
    const view = getActiveView();
    if (view && cursor > 0) {
      const pos = Math.min(Math.max(0, cursor), view.state.doc.length);
      view.dispatch({ selection: { anchor: pos }, effects: [] });
      view.dispatch({});
    }

    // ---- Theme across all mounted views. ----
    if (theme) {
      state.lightTheme = true;
      const root = document.getElementById("view-editor");
      if (root) root.classList.add("light-theme");
      for (const g of state.groups) {
        if (g.view) applyTheme(g.view, true);
      }
    }

    syncPreviewPane();
    showSessionToast(totalTabs);
  } catch (e) {
    console.error("恢复会话失败:", e);
  }
}

function showSessionToast(n: number): void {
  const old = document.getElementById("sessionToast");
  if (old) old.remove();
  const el = document.createElement("div");
  el.id = "sessionToast";
  el.innerHTML =
    `<span>已恢复上次会话（${n} 个标签页）</span>` +
    `<button onclick="document.getElementById('sessionToast').remove()">知道了</button>`;
  document.body.appendChild(el);
  setTimeout(() => {
    if (el.parentNode) el.remove();
  }, 6000);
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

// referenced to keep toast import alive (used elsewhere)
void toast;
