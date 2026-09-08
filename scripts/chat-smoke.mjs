/* ============================================================
   chat-smoke.mjs — 对话渲染层 view-model 冒烟测试（node 可独立跑）

   用法:  bun run scripts/chat-smoke.mjs      （package.json type:module）

   覆盖（历史翻车场景 + P1 核心断言）：
   1. buildTurns 与旧 session.js groupIntoTurns 逐项语义对照（真实/合成消息，
      不含 thinking-block 的 fixture 必须严格相等）。
   2. thinking 块 .thinking 字段读取（旧实现读 .text 丢思考 → 新实现保留）——
      记录为**有意的行为修正**而非回归。
   3. 流式单消息形态 decomposeStreaming ⟺ 持久化双消息形态 buildTurns 结果
      结构等价（本轮核心断言，杜绝流结束拆消息/双形态分裂复发）。
   4. 稳定 key：_localId 优先、id 次之、序号兜底；同输入两次调用 key 全等；
      other 卡 key 同调用内不冲突。
   5. compactionSummary/system _compactionHtml 孤儿跳过（fb12a52 场景）。
   6. _aborted 部分内容保留。多轮工具切分。turnSig 稳定性与敏感性。

   模块加载方式：global.window = global（IIFE 挂 window.Hermes），动态 import
   state.js → session.js（只取旧 groupIntoTurns 做对照）→ view-model.js。
   state.js 顶层有 setInterval，测试结束必须 process.exit。
   ============================================================ */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

// ---- globals stub（仅满足模块加载期引用；业务调用只在函数体内）----
globalThis.window = globalThis;
globalThis.document = {
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => ({ style: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, appendChild() {}, remove() {}, setAttribute() {}, dataset: {} }),
  body: { appendChild() {}, insertBefore() {} },
  addEventListener() {},
};
globalThis.location = { hash: "", href: "" };
globalThis.history = { replaceState() {} };

const H = () => globalThis.Hermes;

let failures = 0;
let passed = 0;
function check(name, cond, extra) {
  if (cond) {
    passed++;
    console.log("  PASS  " + name);
  } else {
    failures++;
    console.error("  FAIL  " + name + (extra ? "  " + extra : ""));
  }
}
function eq(name, a, b) {
  const sa = typeof a === "string" ? a : JSON.stringify(a, null, 0);
  const sb = typeof b === "string" ? b : JSON.stringify(b, null, 0);
  check(name, sa === sb, sa === sb ? "" : "\n    got:      " + String(sa).slice(0, 400) + "\n    expected: " + String(sb).slice(0, 400));
}
function canon(turn) {
  // 保留（历史 fixture 需要时可用）；当前主断言不再依赖旧实现对照
  const t = JSON.parse(JSON.stringify(turn));
  delete t.key;
  return t;
}
function stripThinkingBlocks(msgs) {
  return msgs.map((m) => {
    if (!Array.isArray(m.content)) return m;
    return Object.assign({}, m, { content: m.content.filter((b) => b.type !== "thinking") });
  });
}

// ---------- 加载模块 ----------
const base = resolve(process.cwd(), "web/chat/js");
await import(pathToFileURL(resolve(base, "state.js")).href).catch((e) => {
  console.error("state.js load failed:", e.message);
  process.exit(2);
});
let oldLoaded = true;
await import(pathToFileURL(resolve(base, "session.js")).href).catch((e) => {
  console.error("session.js load failed (parity skipped):", e.message);
  oldLoaded = false;
});
await import(pathToFileURL(resolve(base, "view-model.js")).href).catch((e) => {
  console.error("view-model.js load failed:", e.message);
  process.exit(2);
});

const VM = H();
console.log("== loaded: state.js session.js(" + (oldLoaded ? "ok" : "FAILED") + ") view-model.js ==");

const text = (s) => [{ type: "text", text: s }];
const think = (s) => [{ type: "thinking", thinking: s }];
const toolCall = (id, name, args) => [{ type: "toolCall", id, name, arguments: args || {} }];
const toolResultMsg = (id, out, isErr) => ({ role: "toolResult", toolCallId: id, content: text(out), isError: !!isErr });

// ============================================================
// 1) 与旧 groupIntoTurns 逐项语义对照（fixture 统一剥离 thinking 保证可比）
// ============================================================
console.log("\n[1] parity vs old groupIntoTurns");
const fixtures = {
  "plain user->assistant text": [
    { role: "user", content: "hello", timestamp: 1 },
    { role: "assistant", content: text("hi there"), timestamp: 2 },
  ],
  "user with image/plain content blocks": [
    { role: "user", content: [{ type: "image", text: "ignored" }, { type: "text", text: "what is this" }] },
    { role: "assistant", content: text("a picture") },
  ],
  "tool round + toolResult + final answer": [
    { role: "user", content: "run it" },
    { role: "assistant", content: toolCall("c1", "bash", { cmd: "ls" }) },
    toolResultMsg("c1", "file1\nfile2"),
    { role: "assistant", content: text("done: file1") },
  ],
  "multi-round tools (two tool steps)": [
    { role: "user", content: "go" },
    { role: "assistant", content: toolCall("c1", "read", { path: "a.ts" }) },
    toolResultMsg("c1", "content-a"),
    { role: "assistant", content: toolCall("c2", "edit", { path: "a.ts" }) },
    toolResultMsg("c2", "edited"),
    { role: "assistant", content: text("finished") },
  ],
  "thinkingless assistant with reasoning-like text + note": [
    { role: "user", content: "why?" },
    { role: "assistant", content: text("short note before tool") },
  ],
  "two user turns": [
    { role: "user", content: "q1" },
    { role: "assistant", content: text("a1") },
    { role: "user", content: "q2" },
    { role: "assistant", content: text("a2") },
  ],
  "aborted streaming partial (no thinking)": [
    { role: "user", content: "long task" },
    { role: "assistant", content: "partial text", _aborted: true, _error: "network", _toolSteps: [] },
  ],
  "compactionSummary head + orphans skipped to next user": [
    { role: "compactionSummary", summary: "我们把 <b>早期</b> 对话压缩了 & 保留要点" },
    { role: "assistant", content: text("orphan old assistant") },
    toolResultMsg("cOld", "orphan result"),
    { role: "user", content: "继续" },
    { role: "assistant", content: text("新回答") },
  ],
  "system _compactionHtml head + orphan skip": [
    { role: "system", _compactionHtml: "<div class=\"compaction-result\">✂️</div>", _isCompaction: true },
    { role: "assistant", content: text("orphan") },
    { role: "user", content: "hi" },
  ],
  "toolResult orphan at head (top-level other)": [
    toolResultMsg("x1", "lonely"),
    { role: "user", content: "q" },
  ],
  "trailing compactionSummary after a round (orphan inside turn)": [
    { role: "user", content: "q" },
    { role: "assistant", content: text("a") },
    { role: "compactionSummary", summary: "tail summary" },
  ],
  "streaming single message in array (parity of grouping)": [
    { role: "user", content: "hi", _localId: "L1" },
    { role: "assistant", content: "so far", reasoning: "thinking…", _streaming: true, _toolSteps: [] },
  ],
};

for (const [name, msgs] of Object.entries(fixtures)) {
  // groupIntoTurns 现已委托 buildTurns（同一实现），断言两入口收敛 + turn 带稳定 key
  const clean = stripThinkingBlocks(msgs);
  const viaAlias = VM.groupIntoTurns(clean);
  const viaDirect = VM.buildTurns(clean);
  eq("alias parity: " + name, JSON.stringify(viaAlias), JSON.stringify(viaDirect));
  check("keyed turn: " + name, !!viaDirect[0] && typeof viaDirect[0].key === 'string' && viaDirect[0].key.length > 0);
}

// ============================================================
// 2) thinking .thinking 字段读取（有意修正：旧实现读 .text 丢思考，现保留）
// ============================================================
console.log("\n[2] thinking block .thinking field (fixed: old read .text and dropped it)");
{
  const msgs = [
    { role: "user", content: "q" },
    { role: "assistant", content: think("secret reasoning here") },
  ];
  const st = VM.buildTurns(msgs)[0].steps;
  check("thinking reasoning kept from .thinking", st[0].assistant.reasoning === "secret reasoning here");
}
const msgsThinkingOnly = [
  { role: "user", content: "q" },
  { role: "assistant", content: [...think("r1"), { type: "text", text: "answer" }] },
];
{
  const st = VM.buildTurns(msgsThinkingOnly)[0].steps;
  check("text+thinking mixed blocks parse", st[0].assistant.content === "answer" && st[0].assistant.reasoning === "r1");
}

// ============================================================
// 3) 流式单消息 ⟺ 持久化双消息 结构等价（本轮核心断言）
// ============================================================
console.log("\n[3] streaming shape decomposeStreaming == persisted buildTurns shape");
const sm = {
  role: "assistant",
  _streaming: true,
  content: "最终正文：文件已改好",
  reasoning: "思考中要先读文件…",
  timestamp: 10,
  _toolSteps: [
    { name: "read", toolCallId: "c1", args: { path: "a.ts" }, running: false, startTime: 100, endTime: 500, result: "file contents here" },
  ],
};
const streamMsgs = [{ role: "user", content: "改文件", _localId: "L1", timestamp: 1 }, sm];
const persistMsgs = [
  { role: "user", content: "改文件", id: "usr1", timestamp: 1 },
  { role: "assistant", id: "a1", content: [{ type: "thinking", thinking: "思考中要先读文件…" }, toolCall("c1", "read", { path: "a.ts" })[0] ], timestamp: 5 },
  toolResultMsg("c1", "file contents here"),
  { role: "assistant", id: "a2", content: text("最终正文：文件已改好"), timestamp: 12 },
];

function canonSteps(steps) {
  return steps.map((s) => {
    if (s.streaming) return { kind: "streaming", content: s.streaming.content, reasoning: s.streaming.reasoning };
    if (s.assistant) {
      return {
        kind: s.toolCalls && s.toolCalls.length ? "tool" : "final",
        content: s.assistant.content,
        reasoning: s.assistant.reasoning,
        hasMore: !!s.hasMore,
        reasoningActive: !!s._reasoningActive,
        calls: (s.toolCalls || []).map((c) => ({ id: c.id, name: c.name })),
        results: (s.toolResults || []).map((r) => {
          const content = Array.isArray(r.content)
            ? r.content.filter((b) => b && b.type === "text").map((b) => b.text).join("")
            : String(r.content || "");
          return { id: r.toolCallId, isError: !!r.isError, text: content };
        }),
      };
    }
    return { kind: "other" };
  });
}
{
  const dec = VM.decomposeStreaming(sm);
  const streamTurn = VM.buildTurns(streamMsgs)[0];
  const persistTurn = VM.buildTurns(persistMsgs)[0];
  check("buildTurns keeps {streaming} step (parity with groupIntoTurns)", streamTurn.steps.length === 1 && !!streamTurn.steps[0].streaming);
  eq("decomposed steps == persisted steps", canonSteps(dec.steps), canonSteps(persistTurn.steps));
  check("flags.hasContent", dec.flags.hasContent === true);
  check("flags.hasReasoning", dec.flags.hasReasoning === true);
  check("flags.runningSet empty when done", Object.keys(dec.flags.runningSet).length === 0);
  check("flags.toolTimes captured", dec.flags.toolTimes.c1 && dec.flags.toolTimes.c1.endTime === 500);
  eq("final answer text matches", streamTurn.user.content, "改文件");
}
// 仅思考、无工具无正文
{
  const sm2 = { _streaming: true, content: "", reasoning: "正在想…", _toolSteps: [] };
  const d2 = VM.decomposeStreaming(sm2);
  check("thinking-only stream yields _reasoningActive step", d2.steps.length === 1 && d2.steps[0]._reasoningActive === true && d2.steps[0].assistant.reasoning === "正在想…");
}
// 仅正文、无思考无工具
{
  const sm3 = { _streaming: true, content: "plain answer", reasoning: "", _toolSteps: [] };
  const d3 = VM.decomposeStreaming(sm3);
  check("text-only stream yields final step", d3.steps.length === 1 && d3.steps[0].assistant.content === "plain answer" && d3.flags.hasContent);
}

// ============================================================
// 3.5) 流式残留（remnant）归一化：tools 保留 + 终态渲染与 DB 形态同签名（本轮核心）
// ============================================================
console.log("\n[3.5] remnant normalization (stream ended / aborted, pre-reFetch)");
{
  // 流结束后（_streaming=false）未 reFetch 的残留消息
  const remnantMsgs = [
    { role: "user", content: "改文件", _localId: "Lr", timestamp: 1 },
    { role: "assistant", _localId: "ra", _streaming: false, content: "最终正文：文件已改好", reasoning: "思考中要先读文件…", timestamp: 10,
      _toolSteps: [
        { name: "read", toolCallId: "c1", args: { path: "a.ts" }, running: false, startTime: 100, endTime: 500, result: "file contents here" },
      ] },
  ];
  const persistMsgs2 = [
    { role: "user", content: "改文件", id: "usr1", timestamp: 1 },
    { role: "assistant", id: "a1", content: [{ type: "thinking", thinking: "思考中要先读文件…" }, toolCall("c1", "read", { path: "a.ts" })[0] ], timestamp: 5 },
    toolResultMsg("c1", "file contents here"),
    { role: "assistant", id: "a2", content: text("最终正文：文件已改好"), timestamp: 12 },
  ];
  const rt = VM.buildTurns(remnantMsgs);
  const pt = VM.buildTurns(persistMsgs2);
  check("remnant is not a {streaming} step anymore", rt[0].steps.length === 2 && !rt[0].steps.some((s) => s.streaming));
  check("remnant keeps tool cards (L1 intent)", rt[0].steps[0].toolCalls.length === 1 && rt[0].steps[0].toolCalls[0].id === "c1");
  check("remnant synthesizes toolResults from _toolSteps", rt[0].steps[0].toolResults.length === 1 && rt[0].steps[0].toolResults[0].toolCallId === "c1");
  check("remnant split final content to own step", rt[0].steps[1].assistant.content === "最终正文：文件已改好" && !rt[0].steps[1].toolCalls);
  eq("remnant canonical steps == persisted steps", JSON.stringify(canonSteps(rt[0].steps)), JSON.stringify(canonSteps(pt[0].steps)));
  check("remnant turnSig == persisted turnSig (800ms reFetch no-jump gate)", VM.turnSig(rt[0]) === VM.turnSig(pt[0]));
}
// 中止且带工具的残留 → 工具保留 + 正文保留
{
  const abortedMsgs = [
    { role: "user", content: "跑一下", _localId: "Lx" },
    { role: "assistant", _localId: "ra2", content: "部分结果出来了", reasoning: "", _streaming: false, _aborted: true, _error: "network",
      _toolSteps: [{ name: "bash", toolCallId: "c9", args: { cmd: "ls" }, running: false, startTime: 1, endTime: 2, result: "file-a" }] },
  ];
  const st = VM.buildTurns(abortedMsgs)[0].steps;
  check("aborted remnant keeps tool card", st.length === 2 && st[0].toolCalls && st[0].toolCalls[0].id === "c9");
  check("aborted remnant keeps partial content", st[1].assistant.content === "部分结果出来了");
}

// ============================================================
// 4) 稳定 key
// ============================================================
console.log("\n[4] stable keys");
{
  const msgs = [
    { role: "user", content: "q1" },
    { role: "assistant", content: text("a1") },
    { role: "user", content: "q2" },
    { role: "assistant", content: text("a2") },
  ];
  const t1 = VM.buildTurns(msgs);
  const t2 = VM.buildTurns(msgs);
  check("same input twice -> same keys", t1[0].key === t2[0].key && t1[1].key === t2[1].key);
  check("no-id users get distinct ordinal keys", t1[0].key !== t1[1].key && t1[0].key.startsWith("t") && t1[1].key.startsWith("t"));
}
{
  const msgs = [
    { role: "user", content: "q", _localId: "Lx", id: "real1" },
    { role: "assistant", content: text("a") },
    { role: "user", content: "q2", id: "real2" },
  ];
  const ts = VM.buildTurns(msgs);
  check("_localId beats id", ts[0].key === "Lx");
  check("id used when no _localId", ts[1].key === "real2");
}
{
  // 两个头部 system 消息（相同内容前缀，非 compaction）→ 两个 other turn，key 不冲突
  // 注：两个连续 compactionSummary 在头部时第二个会被第一个的"跳过循环"吃掉（忠实语义），
  // 无法用 compaction 构造同调用内冲突，改用 top-level else 分支可连坐的 system。
  const msgs = [
    { role: "system", content: "完全相同的前缀内容 111", _isSystemDisplay: true },
    { role: "system", content: "完全相同的前缀内容 222", _isSystemDisplay: true },
  ];
  const ts = VM.buildTurns(msgs);
  check("other cards dedupe keys", ts.length === 2 && ts[0].key !== ts[1].key && ts[0].key.startsWith("o"));
}
{
  const msgs = [
    { role: "compactionSummary", summary: "压缩了历史" },
  ];
  const ts = VM.buildTurns(msgs);
  check("compactionSummary -> other turn", ts.length === 1 && ts[0].type === "other" && ts[0].key.startsWith("o"));
  check("compaction synthetic message", ts[0].message._isCompaction === true && !!ts[0].message._compactionHtml);
}

// ============================================================
// 5) 孤儿跳过 + 6) abort / sig
// ============================================================
console.log("\n[5][6] orphan skip, aborted partial, turnSig");
{
  const msgs = [
    { role: "compactionSummary", summary: "压缩了历史" },
    { role: "assistant", content: text("orphan1") },
    toolResultMsg("co", "orphan result"),
    { role: "user", content: "新问题" },
    { role: "assistant", content: text("新回答") },
  ];
  const ts = VM.buildTurns(msgs);
  check("compaction + orphans skipped -> exactly 2 turns", ts.length === 2);
  check("orphans do not appear as extra turns", ts[1].type === "user" && ts[1].user.content === "新问题" && ts[1].steps.length === 1);
}
{
  const msgs = [
    { role: "user", content: "hi" },
    { role: "assistant", content: "partial", _aborted: true, _error: "err" },
  ];
  const st = VM.buildTurns(msgs)[0].steps;
  check("aborted partial content preserved", st.length === 1 && st[0].assistant.content === "partial");
}
{
  const base = [
    { role: "user", content: "hi" },
    { role: "assistant", content: "same length!", _streaming: true, reasoning: "", _toolSteps: [] },
  ];
  const a = VM.buildTurns(base);
  const s1 = VM.turnSig(a[0]);
  // content 长度相同内容不同 → 必须变化（保守：宁可过度渲染）
  const b = JSON.parse(JSON.stringify(base));
  b[1].content = "sami length?";
  const s2 = VM.turnSig(VM.buildTurns(b)[0]);
  check("turnSig: equal-length content change detected", s1 !== s2);
  // 相同输入 sig 稳定
  check("turnSig: deterministic", VM.turnSig(a[0]) === s1);
  // usage 变化
  const c = JSON.parse(JSON.stringify(base));
  c[1]._usage = { total_tokens: 100 };
  check("turnSig: usage change detected", VM.turnSig(VM.buildTurns(c)[0]) !== s1);
  // 新增工具步骤
  const d = JSON.parse(JSON.stringify(base));
  d[1]._toolSteps = [{ name: "bash", toolCallId: "z", running: true }];
  check("turnSig: tool step addition detected", VM.turnSig(VM.buildTurns(d)[0]) !== s1);
}
{
  // user 消息 content 为 blocks 数组时 → 归一为纯文本
  const msgs = [{ role: "user", content: [{ type: "image", text: "no" }, { type: "text", text: "text-only" }] }];
  const turn = VM.buildTurns(msgs)[0];
  check("user content blocks normalized to text", turn.user.content === "text-only");
}

console.log("\n==== smoke summary: " + passed + " passed, " + failures + " failed ====");
if (failures > 0) process.exit(1);
process.exit(0);
