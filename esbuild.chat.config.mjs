// esbuild.chat.config.mjs
// Slate chat frontend bundler — esbuild.
//
//   Entry:  web/chat/src/entry.js   (依赖初始化 + 13 个业务模块按序 import)
//   Output: web/chat/chat.bundle.js (IIFE, committed for offline builds)
//
// 打包内容：
//   - 外部库本地化：marked / highlight.js(core+25 语言) / dompurify / morphdom / remend
//   - 业务模块：web/chat/js/*.js（IIFE 挂 window.Hermes）
//   - eventsource-parser：web/chat/js/eventsource-parser.js（IIFE 挂 window.EventSourceParser）
//
// 保留为独立 <script> 的：cronstrue（web/chat/vendor/cronstrue.min.js，UMD 无 ESM）
//
// Usage:
//   bun run build:chat        one-shot build
//   bun run build:chat:watch  watch mode

import { build, context } from "esbuild";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const isProd =
  process.env.NODE_ENV === "production" || process.argv.includes("--prod");
const isWatch = process.argv.includes("--watch");

const entry = resolve("web/chat/src/entry.js");
const outfile = resolve("web/chat/chat.bundle.js");

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

if (isWatch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log(
    `[esbuild:chat] watching ${entry} -> ${outfile} (mode: ${isProd ? "prod" : "dev"})`
  );
} else {
  await build(options);
  console.log(
    `[esbuild:chat] built ${entry} -> ${outfile} (mode: ${isProd ? "prod" : "dev"})`
  );
}
