// esbuild.config.mjs
// Slate frontend bundler — esbuild + CodeMirror 6.
//
//   Entry:  web/src/main.ts
//   Output: web/vendor/editor.bundle.js   (ESM, committed for offline builds)
//
// Usage:
//   bun run build          one-shot build (minified when NODE_ENV=production or --prod)
//   bun run build:watch    watch mode (used by `tauri dev` beforeDevCommand)
//
// The bundle is committed to the repo so `tauri build` works fully offline
// (frontendDist=../web). index.html / editor.js / editor.css are intentionally
// NOT touched in this phase — the legacy CDN editor keeps running until the
// editor phase loads this bundle via <script type="module">.

import { build, context } from "esbuild";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const isProd =
  process.env.NODE_ENV === "production" || process.argv.includes("--prod");
const isWatch = process.argv.includes("--watch");

const entry = resolve("web/src/main.ts");
const outfile = resolve("web/vendor/editor.bundle.js");

// web/vendor may not exist on a fresh clone before the first build — create it.
const outDir = dirname(outfile);
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

/** @type {import("esbuild").BuildOptions} */
const options = {
  entryPoints: [entry],
  bundle: true,
  // CM6 ships ESM; load via <script type="module"> in the editor phase.
  format: "esm",
  // Tauri webviews: macOS = WebKit (Safari), Windows = WebView2 (Chrome/Edge).
  target: ["safari16", "chrome110"],
  outfile,
  sourcemap: true,
  minify: isProd,
  logLevel: "info",
  legalComments: "none",
  // Keep bundle self-contained: bundle everything, leave nothing external.
  external: [],
};

if (isWatch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log(
    `[esbuild] watching ${entry} -> ${outfile} (mode: ${isProd ? "prod" : "dev"})`
  );
} else {
  await build(options);
  console.log(
    `[esbuild] built ${entry} -> ${outfile} (mode: ${isProd ? "prod" : "dev"})`
  );
}
