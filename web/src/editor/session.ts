// web/src/editor/session.ts
// Session restore. FIX #2/#12: localStorage stores ONLY paths + cursor +
// theme + EOL, NOT content (content lives on disk; re-read on restore).
// 500ms debounce. Silent-fail (try/catch).

import { state, getActiveTab } from "./state";
import { switchToTab } from "./tabs";
import { applyTheme } from "./cm";
import { readTextFile } from "./io";
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
  if (state.activeTabId == null) return;
  try {
    const view = state.view;
    const tab = getActiveTab();
    const cursor = view ? view.state.selection.main.head : 0;
    // FIX #2: NO content stored — only path/name/absPath/eol/encoding.
    const data = {
      tabs: state.openTabs.map((t) => ({
        name: t.name,
        path: t.path,
        absPath: t.absPath,
        eol: t.eol,
        encoding: t.encoding,
      })),
      activePath: tab ? tab.path : null,
      cursor,
      theme: state.lightTheme,
      split: state.splitActive,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    /* silent fail */
  }
}

export async function restoreSession(): Promise<void> {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.tabs) || data.tabs.length === 0) return;

    // Re-read file content from disk for each tab (content is NOT in session).
    const { addTab } = await import("./tabs");
    const pathToId: Record<string, number> = {};
    for (const t of data.tabs) {
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
      const eol: "LF" | "CRLF" = t.eol || "LF";
      const tab = addTab(t.name, t.path, content, t.absPath || null, encoding, eol, mtimeMs);
      pathToId[t.path] = tab.id;
    }

    // Restore active tab + cursor.
    const activeId = data.activePath && pathToId[data.activePath]
      ? pathToId[data.activePath]
      : state.openTabs[0]?.id;
    if (activeId != null) {
      switchToTab(activeId);
      const view = state.view;
      if (view && typeof data.cursor === "number") {
        const pos = Math.min(Math.max(0, data.cursor), view.state.doc.length);
        view.dispatch({
          selection: { anchor: pos },
          effects: [],
        });
        view.dispatch({});
      }
    }
    if (data.theme) {
      state.lightTheme = true;
      const view = state.view;
      const root = document.getElementById("view-editor");
      if (root) root.classList.add("light-theme");
      if (view) applyTheme(view, true);
    }
    showSessionToast(data.tabs.length);
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
