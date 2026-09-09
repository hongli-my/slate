// esbuild.chat.config.mjs
// Slate chat frontend bundler — esbuild.
//
//   Entry:  web/chat/src/entry.js      (依赖初始化 + 业务模块按序 import)
//   Entry:  web/chat/src/hljs-entry.js (hljs 独立 chunk，markdown.js 懒加载)
//   Output: web/chat/chat.bundle.js    (IIFE, committed for offline builds)
//   Output: web/chat/hljs.bundle.js    (IIFE, 懒加载 <script>)
//
// 打包内容（chat.bundle.js）：
//   - 外部库本地化：marked / dompurify / morphdom / remend（hljs 已拆出懒加载）
//   - 业务模块：web/chat/js/*.js（IIFE 挂 window.Hermes）
//   - eventsource-parser：web/chat/js/eventsource-parser.js（IIFE 挂 window.EventSourceParser）
//
// hljs.bundle.js：highlight.js core + 25 语言，markdown.js scheduleIdleHighlight
// 首次需要时动态 <script> 加载（流式渲染不触达 hljs，首屏无代码块对话零开销）。
//
// 保留为独立 <script> 的：cronstrue（web/chat/vendor/cronstrue.min.js，UMD 无 ESM）

import { build, context } from "esbuild";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const isProd =
  process.env.NODE_ENV === "production" || process.argv.includes("--prod");
const isWatch = process.argv.includes("--watch");

const entry = resolve("web/chat/src/entry.js");
const outfile = resolve("web/chat/chat.bundle.js");
const hljsEntry = resolve("web/chat/src/hljs-entry.js");
const hljsOutfile = resolve("web/chat/hljs.bundle.js");

const outDir = dirname(outfile);
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

/** @type {import("esbuild").BuildOptions} */
const options = {
  entryPoints: [entry],
  bundle: true,
  // 业务模块挂 window.Hermes，用 IIFE 直接执行；index.html 用普通 <script> 加载。
  format: "iife",
  platform: "browser",
  // Tauri webviews: macOS = WebKit (Safari), Windows = WebView2 (Chrome/Edge).
  target: ["safari16", "chrome110"],
  outfile,
  sourcemap: true,
  minify: isProd,
  logLevel: "info",
  legalComments: "none",
  external: [],
};

/** @type {import("esbuild").BuildOptions} */
const hljsOptions = {
  entryPoints: [hljsEntry],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["safari16", "chrome110"],
  outfile: hljsOutfile,
  sourcemap: true,
  minify: isProd,
  logLevel: "info",
  legalComments: "none",
  external: [],
};

if (isWatch) {
  const ctx = await context(options);
  await ctx.watch();
  const hljsCtx = await context(hljsOptions);
  await hljsCtx.watch();
  console.log(
    `[esbuild:chat] watching ${entry} -> ${outfile} + ${hljsEntry} -> ${hljsOutfile} (mode: ${isProd ? "prod" : "dev"})`
  );
} else {
  await build(options);
  await build(hljsOptions);
  console.log(
    `[esbuild:chat] built ${entry} -> ${outfile} + ${hljsEntry} -> ${hljsOutfile} (mode: ${isProd ? "prod" : "dev"})`
  );
}
