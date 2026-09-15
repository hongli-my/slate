/* ============================================================
   chat-smoke.mjs — 对话渲染层 view-model / session-manager 冒烟测试（node 可独立跑）

   用法:  bun run scripts/chat-smoke.mjs      （package.json type:module）

   覆盖（历史翻车场景 + 本轮形态统一核心断言）：
   1. pi 原生形态分组（buildTurns 唯一实现）：纯文本 / 工具轮 / 多轮工具 /
      thinking 块（.thinking 字段）/ 孤儿跳过 / 压缩卡片。
   2. 【核心】三段等价：live 累积器形态（step.partial + live 覆盖）→
      message_end 嫁接（_localId 保持 turn key）→ DB reFetch 原生形态。
      后两段 turnSig 全等 → renderDiff 零 DOM 操作（800ms reFetch 无跳动）。
   3. 【核心】finalizeLiveStream 物化：中止/错误路径把累积器物化为
      pi 原生 blocks（_aborted/_error 标记 + _localId 保持），空 partial 删除；
      幂等；activeStreams 清理。
   4. 稳定 key：_localId 优先、id 次之、序号兜底；other 卡 key 不冲突。
   5. turnSig 敏感性（等长内容替换 / usage / 工具 / toolResult / partial 标记）。
   6. compactionCardHtml 转义 + msgText 多形态。

   模块加载方式：global.window = global（IIFE 挂 window.Hermes），动态 import
   state.js → view-model.js → session-manager.js（finalizeLiveStream 集成）。
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
  addEventListener: () => {},
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

// ---------- 加载模块 ----------
const base = resolve(process.cwd(), "web/chat/js");
await import(pathToFileURL(resolve(base, "state.js")).href).catch((e) => {
  console.error("state.js load failed:", e.message);
  process.exit(2);
});
await import(pathToFileURL(resolve(base, "view-model.js")).href).catch((e) => {
  console.error("view-model.js load failed:", e.message);
  process.exit(2);
});
let smLoaded = true;
await import(pathToFileURL(resolve(base, "session-manager.js")).href).catch((e) => {
  console.error("session-manager.js load failed (finalize tests skipped):", e.message);
  smLoaded = false;
});

const VM = H();
console.log("== loaded: state.js view-model.js session-manager.js(" + (smLoaded ? "ok" : "FAILED") + ") ==");

const text = (s) => [{ type: "text", text: s }];
const think = (s) => [{ type: "thinking", thinking: s }];
const tcBlock = (id, name, args) => ({ type: "toolCall", id, name, arguments: args || {} });
const toolResultMsg = (id, out, isErr) => ({ role: "toolResult", toolCallId: id, content: text(out), isError: !!isErr });

// ============================================================
// 1) pi 原生形态分组
// ============================================================
console.log("\n[1] native-form grouping (buildTurns)");
{
  const turns = VM.buildTurns([
    { role: "user", content: "hello", timestamp: 1 },
    { role: "assistant", content: text("hi there"), timestamp: 2 },
  ]);
  check("plain: 1 turn, 1 step, text extracted", turns.length === 1 && turns[0].steps.length === 1 && turns[0].steps[0].assistant.content === "hi there");
  check("plain: no toolCalls", turns[0].steps[0].toolCalls === null && turns[0].steps[0].hasMore === false);
}
{
  const turns = VM.buildTurns([
    { role: "user", content: [{ type: "image", text: "ignored" }, { type: "text", text: "what is this" }] },
    { role: "assistant", content: text("a picture") },
  ]);
  check("user content blocks normalized to text", turns[0].user.content === "what is this");
  check("user blocks turn still keyed", typeof turns[0].key === "string" && turns[0].key.length > 0);
}
{
  const turns = VM.buildTurns([
    { role: "user", content: "run it" },
    { role: "assistant", content: [tcBlock("c1", "bash", { cmd: "ls" })] },
    toolResultMsg("c1", "file1\nfile2"),
    { role: "assistant", content: text("done: file1") },
  ]);
  const st = turns[0].steps;
  check("tool round: 2 steps", st.length === 2);
  check("tool round: tool step shape", st[0].toolCalls.length === 1 && st[0].toolCalls[0].id === "c1" && st[0].toolCalls[0].name === "bash" && st[0].hasMore === true);
  check("tool round: toolResult attached", st[0].toolResults.length === 1 && st[0].toolResults[0].toolCallId === "c1");
  check("tool round: final step", st[1].assistant.content === "done: file1" && st[1].toolCalls === null);
}
{
  const turns = VM.buildTurns([
    { role: "user", content: "go" },
    { role: "assistant", content: [tcBlock("c1", "read", { path: "a.ts" })] },
    toolResultMsg("c1", "content-a"),
    { role: "assistant", content: [tcBlock("c2", "edit", { path: "a.ts" })] },
    toolResultMsg("c2", "edited"),
    { role: "assistant", content: text("finished") },
  ]);
  const st = turns[0].steps;
  check("multi-round: 3 steps, 2 with tools", st.length === 3 && st[0].toolCalls.length === 1 && st[1].toolCalls.length === 1 && !st[2].toolCalls);
}
{
  // thinking + text 混合 blocks（pi 原生：thinking 正文在 .thinking）
  const turns = VM.buildTurns([
    { role: "user", content: "q" },
    { role: "assistant", content: [...think("secret reasoning here"), { type: "text", text: "answer" }] },
  ]);
  const st = turns[0].steps[0];
  check("thinking .thinking field kept (not .text)", st.assistant.reasoning === "secret reasoning here");
  check("text+thinking mixed parse", st.assistant.content === "answer");
}

// ============================================================
// 2)【核心】三段等价：live 累积器 → message_end 嫁接 → DB 原生
// ============================================================
console.log("\n[2] three-stage equivalence: live accumulator -> graft -> DB native");
const USER = { role: "user", content: "改文件", _localId: "L1", timestamp: 1 };
const FINAL_TEXT = "最终正文：文件已改好";
const REASONING = "思考中要先读文件…";

// —— 阶段 A：live 累积（thinking_delta → text_delta 累积中）——
const partial = { role: "assistant", content: [], timestamp: 10, _localId: "L2" };
const live = { partial, text: FINAL_TEXT, reasoning: REASONING, toolCalls: [], runningTools: {}, approval: null, error: null, aborted: false };
{
  const turns = VM.buildTurns([USER, partial], live);
  const st = turns[0].steps;
  check("A: partial flagged", st.length === 1 && st[0].partial === true);
  check("A: content from live accumulator", st[0].assistant.content === FINAL_TEXT && st[0].assistant.reasoning === REASONING);
  check("A: turn.live mounted", turns[0].live === live);
  check("A: reasoning-only phase marks _reasoningActive", (() => {
    const l2 = Object.assign({}, live, { text: "" });
    return VM.buildTurns([USER, partial], l2)[0].steps[0]._reasoningActive === true;
  })());
  check("A: with text _reasoningActive off", VM.buildTurns([USER, partial], live)[0].steps[0]._reasoningActive !== true);
}
{
  // 阶段 A'：toolcall_end 先于 tool_execution_start 到达（toolCalls 在 live 累积器）
  const liveTc = { partial, text: "", reasoning: REASONING, toolCalls: [tcBlock("c1", "read", { path: "a.ts" })], runningTools: {}, approval: null };
  const st = VM.buildTurns([USER, partial], liveTc)[0].steps;
  check("A': live toolCalls drive tool step", st[0].toolCalls && st[0].toolCalls.length === 1 && st[0].toolCalls[0].id === "c1" && st[0].hasMore === false);
  check("A': partial tool step flagged", st[0].partial === true);
}
{
  // 阶段 A''：partial 已被 message_end 替换、工具执行中（runningTools-only）→ live 挂最后 turn
  const authTool = { role: "assistant", content: [tcBlock("c1", "read", { path: "a.ts" })], timestamp: 10, _localId: "L2" };
  const liveRun = { partial: null, text: "", reasoning: "", toolCalls: [], runningTools: { c1: { name: "read", args: {}, startTime: Date.now(), preview: "" } }, approval: null };
  const turns = VM.buildTurns([USER, authTool], liveRun);
  check("A'': running-only live mounted on last turn", turns[0].live === liveRun);
  check("A'': tool step from authoritative blocks", turns[0].steps[0].toolCalls[0].id === "c1");
}

// —— 阶段 B：message_end 嫁接（_localId 保持 → 原地替换）——
const USAGE = { input: 120, output: 80, totalTokens: 200 };
const grafted = { role: "assistant", content: [...think(REASONING), { type: "text", text: FINAL_TEXT }], usage: USAGE, timestamp: 12 };
grafted._localId = partial._localId; // chat.js _finalizePartialWithMessage 嫁接
const stageB = VM.buildTurns([USER, grafted]);
{
  const st = stageB[0].steps;
  check("B: partial flag gone", st.length === 1 && !st[0].partial);
  check("B: blocks parsed to text/reasoning", st[0].assistant.content === FINAL_TEXT && st[0].assistant.reasoning === REASONING);
  check("B: turn key stable across morph (user _localId)", stageB[0].key === "L1");
}

// —— 阶段 C：DB reFetch 原生形态（无 id；boundary user 嫁接 _localId）——
const userFromDb = { role: "user", content: "改文件", timestamp: 1 };
userFromDb._localId = USER._localId; // backgroundReFetch H3 边界嫁接
const dbAssistant = { role: "assistant", content: [...think(REASONING), { type: "text", text: FINAL_TEXT }], usage: USAGE, timestamp: 12 };
const stageC = VM.buildTurns([userFromDb, dbAssistant]);
{
  eq("B ⟺ C: turnSig identical (reFetch no-jump gate)", VM.turnSig(stageB[0]), VM.turnSig(stageC[0]));
  check("B ⟺ C: turn key identical", stageB[0].key === stageC[0].key);
}
{
  // 工具轮的三段等价：live 工具步骤 → 嫁接（含 toolResult 独立消息）→ DB
  const uMsg = { role: "user", content: "跑", _localId: "K1", timestamp: 1 };
  const p2 = { role: "assistant", content: [], timestamp: 5, _localId: "K2" };
  const live2 = { partial: p2, text: "", reasoning: "", toolCalls: [tcBlock("c9", "bash", { cmd: "ls" })], runningTools: { c9: { name: "bash", startTime: 1, preview: "" } }, approval: null };
  const tLive = VM.buildTurns([uMsg, p2], live2);
  check("tool live: running turn has live", tLive[0].live === live2);
  check("tool live: step.partial on tool step", tLive[0].steps[0].partial === true);

  // message_end：工具消息落定；tool_execution_end：独立 toolResult 消息 push
  const authT = { role: "assistant", content: [tcBlock("c9", "bash", { cmd: "ls" })], timestamp: 5 };
  authT._localId = "K2";
  const trMsg = toolResultMsg("c9", "file-a");
  trMsg._localId = "K3";
  const stageB2 = VM.buildTurns([uMsg, authT, trMsg]);
  // DB reFetch：同样三消息（无 id）
  const stageC2 = VM.buildTurns([
    Object.assign({ role: "user", content: "跑", timestamp: 1 }, { _localId: "K1" }),
    { role: "assistant", content: [tcBlock("c9", "bash", { cmd: "ls" })], timestamp: 5 },
    toolResultMsg("c9", "file-a"),
  ]);
  eq("tool B ⟺ C: turnSig identical", VM.turnSig(stageB2[0]), VM.turnSig(stageC2[0]));
  check("tool B: toolResult attached to tool step", stageB2[0].steps[0].toolResults.length === 1 && stageB2[0].steps[0].toolResults[0].toolCallId === "c9");
}

// ============================================================
// 3)【核心】finalizeLiveStream 物化（session-manager 集成）
// ============================================================
if (smLoaded) {
  console.log("\n[3] finalizeLiveStream materialization");
  const sid = "sm-test-1";
  const pMsg = { role: "assistant", content: [], timestamp: 10, _localId: "F2" };
  H().state.sessionMessages[sid] = { messages: [{ role: "user", content: "q", _localId: "F1", timestamp: 1 }, pMsg], version: 1, isStale: false, loadedAt: Date.now() };
  H().state.activeStreams[sid] = { partial: pMsg, text: "部分正文", reasoning: "思考中", toolCalls: [], runningTools: { c1: {} }, finished: false, preStreamCount: 1 };
  H().finalizeLiveStream(sid, { aborted: true });
  const msgs = H().state.sessionMessages[sid].messages;
  check("finalize: partial replaced in place (length stable)", msgs.length === 2);
  eq("finalize: materialized pi native blocks", msgs[1].content, [{ type: "thinking", thinking: "思考中" }, { type: "text", text: "部分正文" }]);
  check("finalize: _aborted marker", msgs[1]._aborted === true);
  check("finalize: _localId grafted (turn key stable)", msgs[1]._localId === "F2");
  check("finalize: activeStreams cleaned", H().state.activeStreams[sid] === undefined);
  check("finalize: cache marked stale", H().state.sessionMessages[sid].isStale === true);
  {
    const st = VM.buildTurns(msgs)[0].steps;
    check("finalize: static step renders content + abort flag", st[0].assistant.content === "部分正文" && st[0]._aborted === true && !st[0].partial);
  }
  // 幂等：stream 已删，再次调用无副作用
  H().finalizeLiveStream(sid, { error: "again" });
  check("finalize: idempotent", H().state.sessionMessages[sid].messages.length === 2 && H().state.activeStreams[sid] === undefined);

  // 空 partial → 删除
  const sid2 = "sm-test-2";
  const pEmpty = { role: "assistant", content: [], timestamp: 10, _localId: "E2" };
  H().state.sessionMessages[sid2] = { messages: [{ role: "user", content: "q", _localId: "E1" }, pEmpty], version: 1, isStale: false, loadedAt: Date.now() };
  H().state.activeStreams[sid2] = { partial: pEmpty, text: "", reasoning: "", toolCalls: [], runningTools: {}, finished: false };
  H().finalizeLiveStream(sid2, { error: "timeout" });
  check("finalize: empty partial removed", H().state.sessionMessages[sid2].messages.length === 1);

  // 工具累积 → 物化含 toolCall block
  const sid3 = "sm-test-3";
  const pTool = { role: "assistant", content: [], timestamp: 10, _localId: "T2" };
  H().state.sessionMessages[sid3] = { messages: [{ role: "user", content: "q", _localId: "T1" }, pTool], version: 1, isStale: false, loadedAt: Date.now() };
  H().state.activeStreams[sid3] = { partial: pTool, text: "跑了", reasoning: "", toolCalls: [tcBlock("c9", "bash", { cmd: "ls" })], runningTools: {}, finished: false };
  H().finalizeLiveStream(sid3, { error: "network" });
  const m3 = H().state.sessionMessages[sid3].messages[1];
  eq("finalize: tool blocks materialized", m3.content, [{ type: "toolCall", id: "c9", name: "bash", arguments: { cmd: "ls" } }, { type: "text", text: "跑了" }]);
  check("finalize: error marker kept", m3._error === "network");
  {
    const st = VM.buildTurns(H().state.sessionMessages[sid3].messages)[0].steps;
    check("finalize: tool step preserved (L1: 卡片不消失)", st[0].toolCalls && st[0].toolCalls[0].id === "c9" && st[0].hasMore === true);
    // 同一消息内 text+toolCall：文本保留在 step.assistant.content（渲染层按
    // “触发旁白”规则展示——短文本作为工具卡片上下文，非独立 final step，与 DB 重载一致）
    check("finalize: text kept in tool step content", st[0].assistant.content === "跑了");
  }
  // 清理测试残留
  delete H().state.sessionMessages[sid];
  delete H().state.sessionMessages[sid2];
  delete H().state.sessionMessages[sid3];
} else {
  console.log("\n[3] finalizeLiveStream tests SKIPPED (session-manager failed to load)");
}

// ============================================================
// 4) 孤儿跳过 / 压缩卡片 / 稳定 key
// ============================================================
console.log("\n[4] orphan skip, compaction cards, stable keys");
{
  const ts = VM.buildTurns([
    { role: "compactionSummary", summary: "压缩了历史" },
    { role: "assistant", content: text("orphan1") },
    toolResultMsg("co", "orphan result"),
    { role: "user", content: "新问题" },
    { role: "assistant", content: text("新回答") },
  ]);
  check("compaction + orphans skipped -> exactly 2 turns", ts.length === 2);
  check("orphans do not appear as extra turns", ts[1].type === "user" && ts[1].user.content === "新问题" && ts[1].steps.length === 1);
  check("compactionSummary -> other turn with card html", ts[0].type === "other" && ts[0].message._isCompaction === true && !!ts[0].message._compactionHtml);
}
{
  const ts = VM.buildTurns([
    { role: "system", _compactionHtml: '<div class="compaction-result">✂️</div>', _isCompaction: true },
    { role: "assistant", content: text("orphan") },
    { role: "user", content: "hi" },
  ]);
  check("system _compactionHtml head + orphan skip", ts.length === 2 && ts[0].type === "other" && ts[1].type === "user");
}
{
  const ts = VM.buildTurns([toolResultMsg("x1", "lonely"), { role: "user", content: "q" }]);
  check("toolResult orphan at head -> other turn first", ts.length === 2 && ts[0].type === "other");
}
{
  const ts = VM.buildTurns([
    { role: "user", content: "q" },
    { role: "assistant", content: text("a") },
    { role: "compactionSummary", summary: "tail summary" },
  ]);
  check("trailing compactionSummary swallowed into turn steps", ts.length === 1 && ts[0].steps.some((s) => s.system));
}
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
  const ts = VM.buildTurns([
    { role: "user", content: "q", _localId: "Lx", id: "real1" },
    { role: "assistant", content: text("a") },
    { role: "user", content: "q2", id: "real2" },
  ]);
  check("_localId beats id", ts[0].key === "Lx");
  check("id used when no _localId", ts[1].key === "real2");
}
{
  const ts = VM.buildTurns([
    { role: "system", content: "完全相同的前缀内容 111", _isSystemDisplay: true },
    { role: "system", content: "完全相同的前缀内容 222", _isSystemDisplay: true },
  ]);
  check("other cards dedupe keys", ts.length === 2 && ts[0].key !== ts[1].key && ts[0].key.startsWith("o"));
}

// ============================================================
// 5) turnSig 敏感性（宁可过度重渲，不可漏渲）
// ============================================================
console.log("\n[5] turnSig sensitivity");
{
  const mk = (assistantContent, usage) => VM.buildTurns([
    { role: "user", content: "hi" },
    Object.assign({ role: "assistant", content: assistantContent }, usage ? { usage } : {}),
  ])[0];
  const s1 = VM.turnSig(mk(text("same length!")));
  check("sig: deterministic", VM.turnSig(mk(text("same length!"))) === s1);
  check("sig: equal-length content change detected", VM.turnSig(mk(text("sami length?"))) !== s1);
  check("sig: usage change detected", VM.turnSig(mk(text("same length!"), { input: 1, output: 2, totalTokens: 3 })) !== s1);
  check("sig: toolCall block addition detected", VM.turnSig(mk([tcBlock("z", "bash", {}), ...text("same length!")])) !== s1);
  {
    // toolResult 数量变化
    const baseMsgs = [
      { role: "user", content: "hi" },
      { role: "assistant", content: [tcBlock("c1", "read", {})] },
    ];
    const sa = VM.turnSig(VM.buildTurns(baseMsgs)[0]);
    const sb = VM.turnSig(VM.buildTurns([...baseMsgs, toolResultMsg("c1", "out")])[0]);
    check("sig: toolResult count change detected", sa !== sb);
    const sc = VM.turnSig(VM.buildTurns([...baseMsgs, toolResultMsg("c1", "out", true)])[0]);
    check("sig: toolResult isError change detected", sb !== sc);
  }
  {
    // partial 标记变化（live→static morph 必须触发——渲染层 _updateTurn 显式比对）
    const u = { role: "user", content: "hi", _localId: "P1" };
    const pMsg = { role: "assistant", content: [], _localId: "P2" };
    const live = { partial: pMsg, text: "ans", reasoning: "", toolCalls: [], runningTools: {} };
    const sigLive = VM.turnSig(VM.buildTurns([u, pMsg], live)[0]);
    const auth = { role: "assistant", content: text("ans"), _localId: "P2" };
    const sigStatic = VM.turnSig(VM.buildTurns([u, auth])[0]);
    check("sig: partial flag change detected (live->static)", sigLive !== sigStatic);
  }
  {
    // _aborted 标记变化
    const mkA = (ab) => VM.buildTurns([
      { role: "user", content: "hi" },
      { role: "assistant", content: text("partial"), _aborted: ab },
    ])[0];
    check("sig: _aborted change detected", VM.turnSig(mkA(false)) !== VM.turnSig(mkA(true)));
  }
}

// ============================================================
// 6) compactionCardHtml 转义 + msgText 多形态
// ============================================================
console.log("\n[6] escaping & msgText");
{
  const html = VM.compactionCardHtml('我们把 <b>早期</b> 对话压缩了 & 保留要点');
  check("card html escapes summary", html.includes("&lt;b&gt;") && html.includes("&amp;") && !html.includes("<b>早期"));
  check("card html keeps structure", html.includes('class="compaction-result"') && html.includes("✂️ 上下文已压缩"));
  check("empty summary -> no details block", !VM.compactionCardHtml("").includes("compaction-summary"));
}
check("msgText: string passthrough", VM.msgText("abc") === "abc");
check("msgText: blocks join text", VM.msgText([...think("r"), ...text("a"), ...text("b")]) === "ab");
check("msgText: object JSON stringify", VM.msgText({ k: 1 }) === '{"k":1}');
check("msgText: null safe", VM.msgText(null) === "" && VM.msgText(undefined) === "");

console.log("\n==== smoke summary: " + passed + " passed, " + failures + " failed ====");
if (failures > 0) process.exit(1);
process.exit(0);
