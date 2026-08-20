// web/src/editor/commands.ts
// SQL format, JSON format, EOL toggle (FIX #15), theme toggle.

import { format as sqlFormat } from "sql-formatter";
import { state, getActiveTab, groupElId } from "./state";
import { applyTheme } from "./cm";
import { setSearchQuery, SearchQuery } from "@codemirror/search";
import { renderTabsBar } from "./tabs";
import { updateStatusBar, updateEolLabel } from "./statusbar";
import { toast } from "./ui";
import { saveSession } from "./session";

// Flink 分布提示（distribution hint）：JOIN [shuffle](...) / JOIN [broadcast](...)
// sql-formatter 的解析文法不支持该语法，格式化前先替换为注释占位符，格式化后还原。
const FLINK_HINT_RE = /\[(shuffle|broadcast)\]\s*(?=\()/gi;
const FLINK_HINT_RESTORE_RE = /\/\*HINT:(shuffle|broadcast)\*\//g;

export function formatSQL(): void {
  const view = state.view;
  if (!view) return;
  const tab = getActiveTab();
  if (!tab || !/\.sql$/i.test(tab.name)) return;
  const btn = document.getElementById(groupElId("btnFormat", state.activeGroup));
  try {
    const raw = view.state.doc.toString();
    // 预处理：保护 [shuffle]( / [broadcast]( 分布提示，避免 sql-formatter 报语法错误
    const sanitized = raw.replace(FLINK_HINT_RE, "/*HINT:$1*/");
    const dialects = ["mysql", "mariadb", "postgresql", "sql"] as const;
    let formatted: string | null = null;
    let lastErr: unknown = null;
    for (const lang of dialects) {
      try {
        formatted = sqlFormat(sanitized, {
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
        formatted = sqlFormat(sanitized, { tabWidth: 4, useTabs: false, keywordCase: "upper" });
      } catch (e2) {
        throw lastErr || e2;
      }
    }
    // 还原分布提示：/*HINT:shuffle*/ -> [shuffle]
    formatted = formatted.replace(FLINK_HINT_RESTORE_RE, "[$1]");
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
  const btn = document.getElementById(groupElId("btnFormatJson", state.activeGroup));
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

/** Replace the whole document in ONE dispatch (preserves history entry).
 *  Deliberately minimal: NO manual scrollTop manipulation (hacking scrollDOM
 *  behind CM6's back desyncs its coordinate cache — clicks then hit wrong
 *  positions and the view jumps on the next interaction). A programmatic
 *  dispatch does not scroll; CM6 keeps the viewport stable on its own.
 *  Selection is set to a single point (old cursor clamped) so a pre-format
 *  range selection doesn't linger as a "block selection", and any stale
 *  in-file search highlights are cleared in the same transaction. Focus is
 *  re-grabbed at the end — see comment below — to prevent the toolbar-button
 *  loss-of-focus from corrupting the next click's selection. */
function replaceWholeDoc(view: { state: { doc: { length: number } }; dispatch: (tr: unknown) => void }, text: string): void {
  const v = view as unknown as import("@codemirror/view").EditorView;
  const oldHead = v.state.selection.main.head;
  const newPos = Math.min(Math.max(oldHead, 0), text.length);
  v.dispatch({
    changes: { from: 0, to: v.state.doc.length, insert: text },
    selection: { anchor: newPos },
    effects: setSearchQuery.of(new SearchQuery({ search: "" })),
    // ^ Clear stale in-file search highlights in the same transaction. MUST be
    // a valid SearchQuery, not null: now that search() is loaded (cm.ts), the
    // setSearchQuery effect is handled and the handler dereferences
    // effect.value — passing null throws "effect.value.create" TypeError.
  });
  // Re-grab focus so the next click in the editor has hasFocus=true and
  // mustFocus=false in CM6's mousedown handler. Without this, a format
  // triggered from the toolbar leaves the editor unfocused; the subsequent
  // click focuses it between two readMeasured() calls, the layout shifts,
  // start.pos != cur.pos, and basicMouseSelection synthesizes a cross-line
  // range — manifesting as "click after format selects multiple lines".
  v.focus();
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
