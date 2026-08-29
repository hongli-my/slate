// web/src/editor/statusbar.ts
import { state, getActiveTab } from "./state";
import { languageLabel } from "./languages";
import { $ } from "./ui";
import { syntaxTree } from "@codemirror/language";
import type { EditorView } from "@codemirror/view";

export function updateStatusBar(): void {
  const tab = getActiveTab();
  const fileEl = $("stFile");
  const langEl = $("stLang");
  fileEl.textContent = tab ? tab.name + (tab.modified ? " (已修改)" : "") : "未打开文件";
  langEl.textContent = tab ? (tab.lang || languageLabel(tab.name)) : "-";
  updateStatusCursor();
  updateEolLabel();
}

export function updateStatusCursor(): void {
  const view = state.view;
  const el = $("stPos");
  if (!view || !state.activeTabId) {
    el.textContent = "行 1, 列 1";
    updateJsonStatus();
    return;
  }
  const head = view.state.selection.main.head;
  const line = view.state.doc.lineAt(head);
  el.textContent = "行 " + line.number + ", 列 " + (head - line.from + 1);
  updateJsonStatus();
}

// ---- JSON 路径 + 校验状态（Slate 核心场景：JSON 查看）----
// 光标在 JSON 文档中的位置，用 Lezer 语法树向上遍历收集 key / array index。
// 这是 JSON 查看器的标配（VSCode / Sublime 都有），定位为“JSON 展示”时不可缺。
function jsonPathAt(view: EditorView): string | null {
  const tree = syntaxTree(view.state);
  const pos = view.state.selection.main.head;
  if (tree.length === 0) return null;
  let node = tree.resolveInner(pos, -1);
  const segments: string[] = [];
  while (node.parent) {
    const parent = node.parent;
    if (parent.name === "Property") {
      // Property = PropertyName : value。取第一个子节点（PropertyName）的文本作 key。
      const keyNode = parent.firstChild;
      if (keyNode && keyNode.name === "PropertyName") {
        let key = view.state.doc.sliceString(keyNode.from, keyNode.to);
        key = key.replace(/^"|"$/g, ""); // 去引号
        if (/^[A-Za-z_$][\w$]*$/.test(key)) segments.unshift("." + key);
        else segments.unshift('["' + key + '"]');
      }
    } else if (parent.name === "Array") {
      // 数当前 node 是 Array 的第几个 value 子节点（跳过 [ ] , ）。
      let idx = 0;
      let child = parent.firstChild;
      while (child && child !== node) {
        if (!["[", "]", ","].includes(child.name)) idx++;
        child = child.nextSibling;
      }
      segments.unshift("[" + idx + "]");
    }
    node = parent;
  }
  return "$" + segments.join("");
}

/** 实时 JSON 校验：语法树无 error 节点且覆盖整个文档 → 合法。
 *  大文件（>500KB）跳过校验遍历，避免主线程卡顿。 */
function jsonIsValid(view: EditorView): boolean {
  const doc = view.state.doc;
  if (doc.length === 0) return true;
  if (doc.length > 500_000) return true; // 大文件跳过遍历（性能）
  const tree = syntaxTree(view.state);
  if (tree.length < doc.length) return false; // 有未消费 token → 非法
  let foundError = false;
  tree.iterate({
    enter: (n) => {
      if (foundError) return false;
      if (n.type.isError) {
        foundError = true;
        return false;
      }
      return true;
    },
  });
  return !foundError;
}

/** 状态栏 JSON 区：显示光标路径 + 校验状态。非 JSON 文件时隐藏。 */
export function updateJsonStatus(): void {
  const el = $("stJson");
  if (!el) return;
  const tab = getActiveTab();
  if (!tab || !/\.json$/i.test(tab.name)) {
    el.textContent = "";
    el.style.display = "none";
    return;
  }
  el.style.display = "";
  const view = state.view;
  if (!view) {
    el.textContent = "";
    return;
  }
  const path = jsonPathAt(view) ?? "";
  const ok = jsonIsValid(view);
  el.textContent = path + (ok ? "" : "  \u26a0\u8bed\u6cd5\u9519\u8bef");
  el.style.color = ok ? "#8ab4f8" : "#f59e0b";
}

export function updateEolLabel(): void {
  const el = $("stEol");
  if (!el) return;
  const tab = getActiveTab();
  el.textContent = tab ? tab.eol : "LF";
}

export function updateEncodingLabel(encoding: string): void {
  // The status bar has a fixed <span>UTF-8</span> after stEol. We update it.
  const bar = $("statusBar");
  if (!bar) return;
  const spans = bar.querySelectorAll("span");
  // Last span is the encoding slot.
  const enc = spans[spans.length - 1];
  if (enc) enc.textContent = (encoding || "utf-8").toUpperCase();
}

export function attachCursorListener(view: EditorView): void {
  // cursorActivity is handled centrally via updateListener in index.ts.
  void view;
}
