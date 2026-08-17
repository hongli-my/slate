// web/src/editor/commands.ts
// SQL format, JSON format, EOL toggle (FIX #15), theme toggle.

import { format as sqlFormat } from "sql-formatter";
import { state, getActiveTab } from "./state";
import { applyTheme } from "./cm";
import { renderTabsBar } from "./tabs";
import { updateStatusBar, updateEolLabel } from "./statusbar";
import { toast } from "./ui";
import { saveSession } from "./session";

export function formatSQL(): void {
  const view = state.view;
  if (!view) return;
  const tab = getActiveTab();
  if (!tab || !/\.sql$/i.test(tab.name)) return;
  const btn = document.getElementById("btnFormat");
  try {
    const raw = view.state.doc.toString();
    const dialects = ["mysql", "mariadb", "postgresql", "sql"] as const;
    let formatted: string | null = null;
    let lastErr: unknown = null;
    for (const lang of dialects) {
      try {
        formatted = sqlFormat(raw, {
          language: lang,
          tabWidth: 4,
          useTabs: false,
          keywordCase: "upper",
          linesBetweenQueries: 2,
        });
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (formatted === null) {
      try {
        formatted = sqlFormat(raw, { tabWidth: 4, useTabs: false, keywordCase: "upper" });
      } catch (e2) {
        throw lastErr || e2;
      }
    }
    replaceWholeDoc(view, formatted);
    if (btn) {
      btn.textContent = "\u2713 已格式化";
      btn.classList.add("done");
      setTimeout(() => {
        btn.textContent = "\u270E 格式化 SQL";
        btn.classList.remove("done");
      }, 1500);
    }
    toast("SQL 格式化完成");
  } catch (e) {
    console.error("SQL 格式化失败:", e);
    toast("格式化失败: " + (e as Error).message);
  }
}

export function formatJSON(): void {
  const view = state.view;
  if (!view) return;
  const tab = getActiveTab();
  if (!tab || !/\.json$/i.test(tab.name)) return;
  const btn = document.getElementById("btnFormatJson");
  try {
    const raw = view.state.doc.toString();
    const parsed = JSON.parse(raw);
    const formatted = JSON.stringify(parsed, null, 4);
    replaceWholeDoc(view, formatted);
    if (btn) {
      btn.textContent = "\u2713 已格式化";
      btn.classList.add("done");
      setTimeout(() => {
        btn.textContent = "\u270E 格式化 JSON";
        btn.classList.remove("done");
      }, 1500);
    }
    toast("JSON 格式化完成");
  } catch (e) {
    console.error("JSON 格式化失败:", e);
    toast("格式化失败: " + (e as Error).message);
  }
}

/** Replace the whole document in one dispatch (preserves history entry). */
function replaceWholeDoc(view: { state: { doc: { length: number } }; dispatch: (tr: unknown) => void }, text: string): void {
  const v = view as unknown as import("@codemirror/view").EditorView;
  v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: text } });
}

/** FIX #15: normalize to LF first, then convert to CRLF if requested. */
export function toggleEol(): void {
  const view = state.view;
  const tab = getActiveTab();
  if (!view || !tab) return;
  let content = view.state.doc.toString();
  const isCRLF = tab.eol === "CRLF" || content.includes("\r\n");
  // Normalize ALL line endings to LF first (prevents \r\r\n corruption).
  content = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (!isCRLF) {
    // LF -> CRLF
    content = content.replace(/\n/g, "\r\n");
    tab.eol = "CRLF";
  } else {
    tab.eol = "LF";
  }
  replaceWholeDoc(view, content);
  tab.modified = true;
  renderTabsBar();
  updateStatusBar();
  updateEolLabel();
  saveSession();
  toast("已切换为 " + tab.eol);
}

export function toggleTheme(): void {
  state.lightTheme = !state.lightTheme;
  const root = document.getElementById("view-editor");
  if (root) root.classList.toggle("light-theme", state.lightTheme);
  // Apply to every mounted group view (applyTheme dispatches themeComp.reconfigure).
  for (const g of state.groups) {
    if (g.view) applyTheme(g.view, state.lightTheme);
  }
  toast(state.lightTheme ? "已切换亮色主题" : "已切换暗色主题");
  saveSession();
}
