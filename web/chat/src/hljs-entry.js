/**
 * hljs 独立 bundle 入口 —— 由 esbuild.chat.config.mjs 单独打包为 hljs.bundle.js。
 * markdown.js 的 scheduleIdleHighlight 首次需要时动态 <script> 加载本文件，
 * 加载完执行：注册 25 种语言 + 挂 window.hljs，再 resolve 等待中的 promise。
 *
 * 不进 chat.bundle.js（IIFE 格式不支持 code-splitting）：独立 <script> 同样可达
 * 延迟加载目的，且不改变现有 IIFE 构建结构。
 */
import hljs from "highlight.js/lib/core";
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
].forEach(function (entry) { hljs.registerLanguage(entry[0], entry[1]); });

window.hljs = hljs;
// 通知等待者：hljs 已就绪（markdown.js loadHljs 监听此标志）
window.__hljsReady = true;
if (window.__hljsResolve) window.__hljsResolve(hljs);
