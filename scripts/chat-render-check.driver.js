/* eslint-disable */
/**
 * chat-render-check.driver.js
 *
 * 在**真实页面**里跑的渲染/滚动回归断言（由 scripts/chat-render-check.mjs 通过 CDP
 * Runtime.evaluate 注入执行，awaitPromise，返回 JSON 字符串）。
 *
 * 覆盖的都是真实翻车过的场景（2026-09 渲染层丝滑化）：
 *   A 结构性：.turn 嵌套 / data-key 重复 / 回复左位置漂移 / 正文宽度被思考气泡挤压
 *   B 节点身份：finalize、reFetch 重渲后 .turn-agent-body / 已高亮 <code> 不得被重建
 *   C 滚动：流式全程钉底偏差 ≤2px；帧后长高（异步 hljs/图片）要自动追齐；
 *            用户上滚立刻解锁、回到底部自动重新粘住
 *   D 分类：正文必须落在 .step-final .step-answer（不能藏进时间线折叠面板）
 *   E 性能：流式期不得出现全量重渲（renderFull）
 *
 * 用法：node scripts/chat-render-check.mjs [--width=1280]
 */
(async function () {
  const H = window.Hermes;
  const R = [];
  const ok = (name, cond, detail) => R.push({ name, pass: !!cond, detail: detail === undefined ? '' : String(detail) });

  const state = H.state;
  const sid = 'render-check';
  document.querySelectorAll('.session-view, #welcome-screen').forEach((e) => { e.style.display = 'none'; });
  document.getElementById('chat-mode').style.display = 'flex';
  H.dom = H.dom || {};
  H.dom.chatMessages = document.getElementById('chat-messages');
  state.viewMode = 'chat';
  state.focusedSessionId = sid;

  let fullRenders = 0;
  const _renderFull = H.renderFull;
  H.renderFull = function () { fullRenders++; return _renderFull.apply(this, arguments); };

  const now = Math.floor(Date.now() / 1000);
  const msgs = [];
  for (let i = 0; i < 4; i++) {
    msgs.push({ role: 'user', content: '历史问题 ' + (i + 1), timestamp: now - 500 + i * 60, _localId: 'u' + i });
    msgs.push({ role: 'assistant', content: [{ type: 'text', text: ('历史回答 ' + i + '。').repeat(30) }], timestamp: now - 500 + i * 60 });
  }
  msgs.push({ role: 'user', content: '现在定位一下 bug', timestamp: now, _localId: 'u-cur' });
  const partial = { role: 'assistant', content: [], timestamp: now, _localId: 'a-cur' };
  msgs.push(partial);
  state.sessionMessages[sid] = H.createCache(msgs);

  const stream = {
    sessionId: sid, finished: false, partial: partial, text: '', reasoning: '', toolCalls: [],
    runningTools: {}, approval: null, approvalResolved: false, error: null, aborted: false,
  };
  state.activeStreams[sid] = stream;
  H.clearStreamingMdCache();
  H.renderCurrentChat();

  const c = document.getElementById('chat-messages');
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
  const liveTurn = () => { const t = c.querySelectorAll('.turn'); return t[t.length - 1]; };
  const dev = () => Math.round(c.scrollHeight - c.scrollTop - c.clientHeight);

  const frames = [];
  function snap(tag) {
    const t = liveTurn();
    const body = t ? t.querySelector('.turn-agent-body') : null;
    const think = t ? t.querySelector('.ow-ep-think') : null;
    const f = {
      tag,
      nested: c.querySelectorAll('.turn .turn').length,
      dupKey: c.querySelectorAll('[data-key="u-cur"]').length,
      turnLeft: t ? Math.round(t.getBoundingClientRect().left) : null,
      bodyW: body ? Math.round(body.getBoundingClientRect().width) : null,
      thinkOpen: think ? think.classList.contains('ow-show') : null,
      dev: dev(),
    };
    frames.push(f);
    return f;
  }
  const step = (tag) => { H.renderCurrentChat(); return snap(tag); };

  // ---------- 流式：思考 → 工具 → 正文（含代码块） ----------
  step('init'); await frame();
  const think = '用户在描述 bug。先确认调用链：fetch → parse → render。再看并发写入同一数组的情况。'
    + '需要检查 activeStreams 生命周期、finished 标记、忙锁与渲染 debounce。';
  for (let i = 0; i < think.length; i += 14) { stream.reasoning += think.slice(i, i + 14); step('think'); await frame(); }
  const thinkOpenDuringThinking = frames.filter((f) => f.tag === 'think').every((f) => f.thinkOpen === true);
  step('think-done'); await frame();

  stream.toolCalls.push({ type: 'toolCall', id: 'c1', name: 'grep', arguments: { pattern: 'activeStreams' } });
  stream.runningTools['c1'] = { name: 'grep', args: {}, startTime: Date.now(), preview: '' };
  for (let i = 0; i < 4; i++) {
    stream.runningTools['c1'].preview += 'chat.js:' + (880 + i) + ': state.activeStreams[sid] = stream;\n';
    step('tool'); await frame();
  }
  delete stream.runningTools['c1'];
  msgs.push({ role: 'toolResult', toolCallId: 'c1', toolName: 'grep', content: [{ type: 'text', text: 'ok\n' }], isError: false, timestamp: now + 1 });
  step('tool-done'); await frame();

  const answer = '## 定位结论\n\n问题在 `activeStreams` 生命周期。\n\n1. 发送后切会话\n2. 后台流继续写入\n'
    + '3. 渲染读到半成品\n\n## 关键代码\n\n```js\nfunction onDelta(sid, text) {\n  const s = state.activeStreams[sid];\n'
    + '  if (!s || s.finished) return;\n  s.text += text;\n  scheduleRender(sid, false);\n}\n```\n\n## 建议\n\n'
    + '| 问题 | 建议 |\n| --- | --- |\n| 忙锁失效 | 用 finished 短路 |\n| 重复渲染 | 50ms debounce |\n\n综上建议先修生命周期。';
  for (let i = 0; i < answer.length; i += 8) { stream.text += answer.slice(i, i + 8); step('text'); await frame(); }
  ok('正文落在 .step-final .step-answer（不藏进时间线）', !!liveTurn().querySelector('.step-final .step-answer'));
  ok('思考面板在正文开始后自动收起', snap('x').thinkOpen === false);
  ok('思考期面板全程展开', thinkOpenDuringThinking);
  await sleep(700);

  const bodyNodeBefore = liveTurn().querySelector('.turn-agent-body');
  const codeBefore = liveTurn().querySelector('.step-answer pre code');
  ok('闭围栏后代码块在流式期就已异步上色', !!(codeBefore && codeBefore.hasAttribute('data-highlighted')),
    codeBefore ? codeBefore.className : 'null');
  ok('流式期代码块位于 md-stable(稳定段)', !!(codeBefore && codeBefore.closest('.md-stable')));

  // ---------- finalize（onStreamComplete → finalizeLiveStream 的同一条消息形态） ----------
  const blocks = [{ type: 'thinking', thinking: stream.reasoning }]
    .concat(stream.toolCalls).concat([{ type: 'text', text: stream.text }]);
  msgs[msgs.indexOf(partial)] = {
    role: 'assistant', content: blocks, timestamp: now, _localId: 'a-cur',
    usage: { input: 1, output: 2, totalTokens: 3 }, stopReason: 'endTurn',
  };
  stream.runningTools = {};
  delete state.activeStreams[sid];
  H.clearStreamingMdCache();
  step('finalize');
  const bodyNodeAfter = liveTurn().querySelector('.turn-agent-body');
  const codeAfter = liveTurn().querySelector('.step-answer pre code');
  ok('finalize 前后 .turn-agent-body 节点身份保留', bodyNodeBefore === bodyNodeAfter);
  ok('finalize 前后 代码块节点身份保留（未重建）', !!codeBefore && codeBefore === codeAfter);
  ok('finalize 后代码高亮未被抹掉', !!(codeAfter && codeAfter.hasAttribute('data-highlighted') && /<span/.test(codeAfter.innerHTML)));
  await frame(); await sleep(300);
  step('idle');

  // ---------- reFetch：DB 形态（同文本、不同 block 切分）重渲 ----------
  msgs[msgs.length - 1] = {
    role: 'assistant',
    content: [
      { type: 'thinking', thinking: stream.reasoning },
      { type: 'toolCall', id: 'c1', name: 'grep', arguments: { pattern: 'activeStreams' } },
      { type: 'text', text: answer.slice(0, answer.indexOf('## 建议')) },
      { type: 'text', text: answer.slice(answer.indexOf('## 建议')) },
    ],
    timestamp: now, _localId: 'a-cur', usage: { input: 1, output: 2, totalTokens: 3 }, stopReason: 'endTurn',
  };
  const codeBeforeRefetch = liveTurn().querySelector('.step-answer pre code');
  step('refetch');
  await frame(); await sleep(300);
  step('idle2');
  const codeAfterRefetch = liveTurn().querySelector('.step-answer pre code');
  ok('reFetch 重渲后代码块节点/高亮保持', !!codeAfterRefetch && codeAfterRefetch === codeBeforeRefetch
    && codeAfterRefetch.hasAttribute('data-highlighted'));
  ok('reFetch 重渲后无待上色块（未回退到未上色态）', liveTurn().querySelectorAll('.step-answer code.need-auto-highlight').length === 0);

  // ---------- 帧后异步长高（模拟图片/迟到上色）→ 自动追齐 ----------
  const grow = document.createElement('div');
  grow.style.height = '240px';
  const host = liveTurn().querySelector('.step-answer-wrap') || liveTurn().querySelector('.turn-agent-body');
  host.appendChild(grow);
  for (let i = 0; i < 15; i++) await frame();
  const afterAsyncGrow = snap('async-grow');
  grow.remove();
  for (let i = 0; i < 10; i++) await frame();

  // ---------- 用户滚动意图 ----------
  c.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true }));
  c.scrollTop = Math.max(0, c.scrollTop - 400);
  await frame(); await frame();
  const userTop = c.scrollTop;
  stream.reasoning = '';
  const s2 = {
    sessionId: sid, finished: false, partial: null, text: '', reasoning: '', toolCalls: [],
    runningTools: {}, approval: null, approvalResolved: false, error: null, aborted: false,
  };
  // 用"追加新 turn"的方式模拟继续长高（不需要活跃流）
  msgs.push({ role: 'user', content: '第二个问题', timestamp: now + 2, _localId: 'u-2' });
  const p2 = { role: 'assistant', content: [{ type: 'text', text: '第二段回答。'.repeat(40) }], timestamp: now + 2, _localId: 'a-2' };
  msgs.push(p2);
  void s2;
  for (let i = 0; i < 3; i++) { H.renderCurrentChat(); await frame(); }
  ok('用户上滚后不再被自动拽回底部', Math.abs(c.scrollTop - userTop) < 12, 'top=' + c.scrollTop + ' was=' + userTop);
  ok('上滚解锁后确实不再跟随底部', dev() > 200, 'dev=' + dev());
  // 回到底部 → 自动重新粘住
  c.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true }));
  c.scrollTop = c.scrollHeight;
  await frame(); await frame();
  c.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true }));
  for (let i = 0; i < 3; i++) { p2.content[0].text += '再来一段。'.repeat(20); H.renderCurrentChat(); await frame(); }
  ok('滚回底部后自动重新粘住', Math.abs(dev()) <= 2, 'dev=' + dev());

  // ---------- 汇总断言 ----------
  ok('无嵌套 .turn', Math.max.apply(null, frames.map((f) => f.nested)) === 0, 'maxNest=' + Math.max.apply(null, frames.map((f) => f.nested)));
  ok('无重复 data-key', Math.max.apply(null, frames.map((f) => f.dupKey)) === 1);
  const lefts = [...new Set(frames.map((f) => f.turnLeft).filter((v) => v != null))];
  ok('回复左位置恒定（无 20px 漂移）', lefts.length === 1, JSON.stringify(lefts));
  const widths = [...new Set(frames.map((f) => f.bodyW).filter((v) => v != null))];
  ok('正文宽度恒定（思考不再挤压正文）', widths.length === 1, JSON.stringify(widths));
  const maxDev = Math.max.apply(null, frames.map((f) => Math.abs(f.dev)));
  ok('流式全程钉底偏差 <=2px', maxDev <= 2, 'maxDev=' + maxDev);
  ok('帧后长高被 ResizeObserver+rAF 自动追齐', Math.abs(afterAsyncGrow.dev) <= 2, 'dev=' + afterAsyncGrow.dev);
  ok('流式期零全量重渲（renderFull 未被调用）', fullRenders === 0, 'fullRenders=' + fullRenders);

  const failed = R.filter((x) => !x.pass);
  return JSON.stringify({ pass: R.length - failed.length, fail: failed.length, list: R }, null, 1);
})()
