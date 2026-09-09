/**
 * 外部库初始化：import 后挂 window（业务模块以裸全局名引用）。
 *
 * 必须作为独立模块被 entry.js 最先 import —— ESM 的 import 会先于 entry.js
 * 模块体求值，若把 window.marked = marked 写在 entry.js 模块体里，markdown.js
 * 顶层的 initMarked()（裸 `marked` 引用）会先执行而抛 "marked is not defined"。
 * 独立 deps.js + 首条 import 保证求值顺序：库 → 挂载 → 业务模块。
 */

import { marked } from "marked";
window.marked = marked;

// hljs 不再静态打包进 chat.bundle.js（~350KB，仅终态渲染用）。
// 改由独立 hljs.bundle.js 在 scheduleIdleHighlight 首次需要时动态 <script> 加载。
// 见 markdown.js loadHljs() 与 esbuild.chat.config.mjs 的 hljs entry。

import DOMPurify from "dompurify";
window.DOMPurify = DOMPurify;

import morphdom from "morphdom";
window.morphdom = morphdom;

import remend from "remend";
window.remend = remend;
