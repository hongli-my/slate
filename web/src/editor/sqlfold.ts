// web/src/editor/sqlfold.ts
// SQL 细粒度折叠。
//
// @codemirror/lang-sql 默认只给每条顶层 Statement 提供折叠（语句首行折到结尾），
// 长查询里真正想收起的子查询 / 括号块 / CASE...END 都无法单独折。这里通过 foldService
// 在 SQL 语言激活时补充两类折叠点：
//   1. 多行 Parens（子查询 / 派生表 / 条件组 / IN 列表等）——按语法树节点定位，
//      折叠起点是该行可见的 "("，整块折到闭合的 ")"。
//   2. CASE ... END 块——语法树没有独立节点（CASE/WHEN/END 平铺在 Statement 下），
//      用字符串/注释/引号标识符感知的关键字扫描匹配闭合 END。

import { foldService, language, syntaxTree } from "@codemirror/language";
import type { Extension, EditorState } from "@codemirror/state";
import { sqlSupport } from "./languages";

/** 括号块内容至少这么长才给折叠点（过滤单行/迷你括号，避免 gutter 噪音） */
const MIN_PAREN_SPAN = 20;
/** 未闭合 CASE 的扫描上限：编辑中途（还没写 END）避免把整个文件扫一遍 */
const MAX_CASE_SCAN_CHARS = 24000;

interface FoldRange { from: number; to: number; }

function isWordChar(c: string | undefined): boolean {
  return !!c && /[A-Za-z0-9_$]/.test(c);
}

/** 找本行内起始（from 落在 [lineStart, lineEnd)）且跨多行的最小可折 Parens。 */
function parenFoldOnLine(state: EditorState, lineStart: number, lineEnd: number): FoldRange | null {
  const doc = state.doc;
  // 从 lineEnd 解析：若行尾是 "("，lineEnd-1 恰好落在其起点会因 side=-1 左偏跳过，
  // 从 lineEnd（换行位）解析能稳定落到括号内容内，再沿父链找本行起始的 Parens。
  for (let node = syntaxTree(state).resolveInner(lineEnd, -1); node; node = node.parent) {
    // 向上走到起始行早于本行的节点：更外层的起点只会更早，本行没有新折叠点。
    if (node.from < lineStart) break;
    if (node.name !== "Parens") continue;
    // 太短 / 同行闭合的括号不折（过滤单行括号与迷你括号，避免 gutter 噪音）。
    if (node.to - node.from < MIN_PAREN_SPAN) continue;
    if (doc.lineAt(node.to).number <= doc.lineAt(node.from).number) continue;
    // 折“括号内容”而非括号本身：折叠后保留 (…) 首尾括号可读。
    const close =
      doc.sliceString(node.to - 1, node.to) === ")" ? node.to - 1 : node.to;
    return { from: node.from + 1, to: close };
  }
  return null;
}

/**
 * 从 CASE 关键字位置向后扫描，找与之匹配的 END（返回 END 单词的绝对位置）。
 * 正确跳过：'字符串'（''/\\' 转义）、"引号标识符"（"" 转义）、`反引号`、
 * -- 行注释、# 行注释（MySQL）、块注释（斜杠星号包裹）；case/end 作为单词才计数。
 */
function findMatchingEnd(state: EditorState, from: number): number | null {
  const limit = Math.min(state.doc.length, from + MAX_CASE_SCAN_CHARS);
  const text = state.doc.sliceString(from, limit);
  const n = text.length;
  let i = 0;
  let depth = 0;
  while (i < n) {
    const ch = text[i];
    if (ch === "'" || ch === '"' || ch === "`") {
      const q = ch;
      i++;
      while (i < n) {
        const c = text[i];
        if (c === "\\") { i += 2; continue; }            // mysql 反斜杠转义
        if (c === q) {
          if (text[i + 1] === q) { i += 2; continue; }  // '' / "" / `` 双写转义
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    if ((ch === "-" && text[i + 1] === "-") || ch === "#") {
      while (i < n && text[i] !== "\n") i++;            // 行注释
      continue;
    }
    if (ch === "/" && text[i + 1] === "*") {
      const close = text.indexOf("*/", i + 2);
      i = close < 0 ? n : close + 2;                    // 块注释（不嵌套）
      continue;
    }
    if (isWordChar(ch)) {
      let j = i;
      while (j < n && isWordChar(text[j])) j++;
      const word = text.slice(i, j).toUpperCase();
      if (word === "CASE") depth++;
      else if (word === "END") {
        if (depth === 0) return from + i;               // 防御：从 CASE 起不应发生
        depth--;
        if (depth === 0) return from + i;
      }
      i = j;
      continue;
    }
    i++;
  }
  return null;
}

/** CASE 行（行首单词是 CASE）的折叠：从本行行尾折到闭合 END 前。 */
function caseFoldOnLine(state: EditorState, lineStart: number, lineEnd: number): FoldRange | null {
  const text = state.doc.sliceString(lineStart, lineEnd);
  const m = /^\s*case\b/i.exec(text);
  if (!m) return null;
  const endPos = findMatchingEnd(state, lineStart + m.index);
  if (endPos == null) return null;
  const doc = state.doc;
  // END 必须在后续物理行：同行 CASE 无折叠意义。
  if (doc.lineAt(endPos).number <= doc.lineAt(lineStart).number) return null;
  return { from: lineEnd, to: endPos };
}

/**
 * foldService：仅当激活语言是 SQL 时提供补充折叠点，其它文件零开销返回 null。
 * 加入 buildExtensions 即可（两分栏共用同一扩展集）。
 */
export const sqlFolding: Extension = foldService.of((state, lineStart, lineEnd) => {
  if (lineEnd <= lineStart || state.facet(language) !== sqlSupport.language) return null;
  const text = state.doc.sliceString(lineStart, lineEnd);
  // 1) 多行括号块（子查询 / 派生表 / 条件组 / IN 列表…）
  if (text.includes("(")) {
    const r = parenFoldOnLine(state, lineStart, lineEnd);
    if (r) return r;
  }
  // 2) CASE ... END 块（sql-formatter 产物里 CASE 独占一行，行首即锚点）
  if (/^\s*case\b/i.test(text)) return caseFoldOnLine(state, lineStart, lineEnd);
  return null;
});
