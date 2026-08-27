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

import hljs from "highlight.js/lib/core";
// 按需注册常用语言，替代 CDN 全量包（190+ 语言 → 25 种，体积压缩 ~90%）
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import bash from "highlight.js/lib/languages/bash";
import shell from "highlight.js/lib/languages/shell";
import json from "highlight.js/lib/languages/json";
import sql from "highlight.js/lib/languages/sql";
import rust from "highlight.js/lib/languages/rust";
import go from "highlight.js/lib/languages/go";
import cpp from "highlight.js/lib/languages/cpp";
import c from "highlight.js/lib/languages/c";
import java from "highlight.js/lib/languages/java";
import csharp from "highlight.js/lib/languages/csharp";
import php from "highlight.js/lib/languages/php";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import yaml from "highlight.js/lib/languages/yaml";
import markdown from "highlight.js/lib/languages/markdown";
import ruby from "highlight.js/lib/languages/ruby";
import swift from "highlight.js/lib/languages/swift";
import kotlin from "highlight.js/lib/languages/kotlin";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import diff from "highlight.js/lib/languages/diff";
import ini from "highlight.js/lib/languages/ini";
import plaintext from "highlight.js/lib/languages/plaintext";

[
  ["javascript", javascript],
  ["typescript", typescript],
  ["python", python],
  ["bash", bash],
  ["shell", shell],
  ["json", json],
  ["sql", sql],
  ["rust", rust],
  ["go", go],
  ["cpp", cpp],
  ["c", c],
  ["java", java],
  ["csharp", csharp],
  ["php", php],
  ["xml", xml],
  ["css", css],
  ["yaml", yaml],
  ["markdown", markdown],
  ["ruby", ruby],
  ["swift", swift],
  ["kotlin", kotlin],
  ["dockerfile", dockerfile],
  ["diff", diff],
  ["ini", ini],
  ["plaintext", plaintext],
].forEach(([name, def]) => hljs.registerLanguage(name, def));
window.hljs = hljs;

import DOMPurify from "dompurify";
window.DOMPurify = DOMPurify;

import morphdom from "morphdom";
window.morphdom = morphdom;

import remend from "remend";
window.remend = remend;
