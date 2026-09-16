#!/usr/bin/env node
/**
 * chat-render-check.mjs — 对话渲染/滚动层的**无头浏览器回归检查**（零新依赖）
 *
 * 为什么需要它：对话的"闪 / 抖 / 不丝滑"不是单测能表达的，必须看真实布局与真实 DOM 身份。
 * 这里用系统已装的 Chrome（CDP over WebSocket，node 内置 WebSocket）+ 真实
 * web/chat/index.html + 真实 chat.bundle.js 跑一遍完整流式过程，断言：
 *   - 无 .turn 嵌套 / 无 data-key 重复 / 回复左位置与正文宽度恒定（不抖）
 *   - finalize / reFetch 重渲后 .turn-agent-body 与已高亮 <code> 节点身份保留（不掉色重上色）
 *   - 流式全程钉底偏差 ≤2px；帧后长高（异步 hljs / 图片）自动追齐
 *   - 用户上滚立刻解锁、回到底部自动重新粘住；流式期零全量重渲
 *
 * 用法：
 *   node scripts/chat-render-check.mjs                # 默认 1280x820（= tauri 默认窗口）
 *   node scripts/chat-render-check.mjs --width=1100,1280,1440
 *   CHROME_PATH=/path/to/chrome node scripts/chat-render-check.mjs
 *
 * 退出码：0 全绿；1 有失败。
 */
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(process.cwd());
const PAGE = pathToFileURL(join(ROOT, "web/chat/index.html")).href;
const DRIVER = join(ROOT, "scripts/chat-render-check.driver.js");

const argv = process.argv.slice(2);
const widthArg = argv.find((a) => a.startsWith("--width="));
const WIDTHS = (widthArg ? widthArg.slice("--width=".length) : "1280").split(",").map((n) => parseInt(n, 10)).filter(Boolean);
const HEIGHT = 820;

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser",
    "/snap/bin/chromium",
  ].filter(Boolean);
  for (const c of candidates) if (existsSync(c)) return c;
  throw new Error("未找到 Chrome/Chromium，请用 CHROME_PATH 指定可执行文件");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withBrowser(fn) {
  const chrome = findChrome();
  const profile = mkdtempSync(join(tmpdir(), "slate-render-check-"));
  const port = 9200 + Math.floor(process.pid % 300);
  const proc = spawn(chrome, [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--no-first-run", "--no-default-browser-check", "--disable-gpu",
    "--allow-file-access-from-files",
    "--hide-scrollbars=false",
    "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });
  try {
    let up = false;
    for (let i = 0; i < 60; i++) {
      try { await fetch(`http://127.0.0.1:${port}/json/version`); up = true; break; } catch { await sleep(250); }
    }
    if (!up) throw new Error("Chrome 未能在 15s 内启动调试端口");
    return await fn({ port });
  } finally {
    try { proc.kill("SIGKILL"); } catch {}
    try { rmSync(profile, { recursive: true, force: true }); } catch {}
  }
}

/** 在一个新标签页里按指定视口执行 driver，返回解析后的结果 + 页面 console 输出 */
async function runOnce(port, width, driverSrc) {
  const t = await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(PAGE)}`, { method: "PUT" })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const logs = [];
  ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
    if (m.method === "Runtime.consoleAPICalled" && ["warning", "error"].includes(m.params.type)) {
      logs.push(m.params.type + ": " + m.params.args.map((a) => a.value ?? a.description ?? a.type).join(" "));
    }
    if (m.method === "Runtime.exceptionThrown") {
      logs.push("exception: " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    }
  });
  await new Promise((r) => ws.addEventListener("open", r));
  const send = (method, params) => {
    const mid = ++id;
    ws.send(JSON.stringify({ id: mid, method, params }));
    return new Promise((r) => pending.set(mid, r));
  };
  try {
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { width, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
    await sleep(2500); // 等 bundle/字体/CSS 就绪
    const res = await send("Runtime.evaluate", { expression: driverSrc, awaitPromise: true, returnByValue: true });
    const exc = res.result?.exceptionDetails;
    if (exc) throw new Error("driver 抛错: " + (exc.exception?.description || exc.text));
    const raw = res.result?.result?.value;
    if (typeof raw !== "string") throw new Error("driver 未返回 JSON 字符串");
    return { result: JSON.parse(raw), logs };
  } finally {
    try { ws.close(); } catch {}
    try { await fetch(`http://127.0.0.1:${port}/json/close/${t.id}`); } catch {}
  }
}

const driverSrc = readFileSync(DRIVER, "utf8");

try {
  const code = await withBrowser(async ({ port }) => {
    let failures = 0;
    for (const width of WIDTHS) {
      console.log(`\n=== chat render check @ ${width}x${HEIGHT} ===`);
      let r;
      try {
        r = await runOnce(port, width, driverSrc);
      } catch (e) {
        console.log(`  FATAL ${e.message}`);
        failures++;
        continue;
      }
      for (const it of r.result.list) {
        console.log(`  ${it.pass ? "PASS" : "FAIL"}  ${it.name}${it.detail ? "   [" + it.detail + "]" : ""}`);
      }
      // 页面里的渲染告警（[render] renderSingleTurnHTML failed 等）也算失败
      const renderWarnings = r.logs.filter((l) => l.includes("[render]") || l.includes("exception:"));
      if (renderWarnings.length) {
        console.log("  FAIL  页面出现渲染异常/告警");
        renderWarnings.slice(0, 5).forEach((l) => console.log("        " + l));
        failures += renderWarnings.length;
      }
      console.log(`  -- ${r.result.pass} passed, ${r.result.fail} failed`);
      failures += r.result.fail;
    }
    return failures;
  });
  console.log(`\n==== chat render check: ${code === 0 ? "ALL GREEN" : code + " failure(s)"} ====`);
  process.exit(code === 0 ? 0 : 1);
} catch (e) {
  console.error("chat-render-check 运行失败:", e.message);
  process.exit(2);
}
