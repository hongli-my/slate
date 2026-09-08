/* ============================================================
   Hermes WebUI - View Model Module (pure functions)

   对话渲染层重构 P1 核心交付：把"消息数组"归一化为"带稳定 key 的
   turn 视图"，全部为**纯函数**（加载期零 DOM / 零外部依赖，node 可单测）。

   设计目标（对应 PLAN-chat-render-refactor.md）：
   - buildTurns 语义与 session.js groupIntoTurns **完全一致**（view 分组、
     流式/中止/pi 原生三种 assistant 形态、压缩卡片、孤儿跳过），仅增加 key；
   - 流式单消息形态 → decomposeStreaming 分解出的 steps 与"持久化双消息
     形态"在 buildTurns 里归组的结果**结构等价**（根治 R1/R3：流结束拆消息）；
   - turnSig 为廉价结构签名，供渲染器逐 turn 判定是否需重渲。

   实测数据契约（2026-09-08 真实 sidecar 验证）：
   - pi 原生 thinking block 的正文在 **.thinking** 字段（非 .text）；
   - REST /messages 返回的消息**没有 id 字段**，key 主要靠 _localId / 序号兜底。
   ============================================================ */

window.Hermes = window.Hermes || {};

(function() {
  'use strict';

  // ---- 本地消息身份 ----
  /** 短随机 id：本地创建的消息（user / SSE 合成 system 等）在创建时分配 */
  function uid() {
    return 'l' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  }

  // ---- 纯文本提取（合并 chat.js _extractText 与 session.js _extractContentText）----
  /** 任意 content 形态 → 纯文本：string 直返；blocks 数组取 text 块拼接；对象 JSON.stringify */
  function msgText(content) {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content
        .filter(function(b) { return b && b.type === 'text'; })
        .map(function(b) { return b.text || ''; })
        .join('');
    }
    try { return JSON.stringify(content); } catch (e) { return String(content); }
  }

  // ---- 确定性 hash（fnv1a-32，node/浏览器一致）----
  function hashStr(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return h.toString(36);
  }

  // ---- assistant 消息分解（语义 = session.js extractAssistantParts + 兼容修正）----
  // pi 原生：content = (Text|Thinking|ToolCall)[] blocks，thinking 正文在 b.thinking。
  // 兼容旧 Hermes：content:string + reasoning + tool_calls(可 string) + _toolSteps 兜底。
  function extractAssistantParts(a) {
    var text = '', reasoning = '', toolCalls = [];
    if (Array.isArray(a.content)) {
      var tParts = [], rParts = [];
      a.content.forEach(function(b) {
        if (!b || typeof b !== 'object') return;
        if (b.type === 'text' && b.text) tParts.push(b.text);
        else if (b.type === 'thinking' && (b.thinking != null || b.text)) rParts.push(b.thinking != null ? b.thinking : b.text);
        else if (b.type === 'toolCall') toolCalls.push({ name: b.name, arguments: b.arguments, id: b.id });
      });
      text = tParts.join('');
      reasoning = rParts.join('');
    } else if (typeof a.content === 'string') {
      text = a.content;
      reasoning = a.reasoning || '';
      // 旧 Hermes 兼容
      if (a.tool_calls) {
        try {
          var raw = typeof a.tool_calls === 'string' ? JSON.parse(a.tool_calls) : a.tool_calls;
          toolCalls = (raw || []).map(function(tc) {
            return { name: tc.function ? tc.function.name : undefined, arguments: tc.function ? tc.function.arguments : undefined, id: tc.id || tc.call_id };
          });
        } catch (e) { toolCalls = []; }
      }
      // streaming msg 结束后（_streaming=false）的 _toolSteps 兜底
      if (!toolCalls.length && a._toolSteps && a._toolSteps.length > 0) {
        toolCalls = a._toolSteps.map(function(ts) {
          return { name: ts.name, arguments: ts.args, id: ts.toolCallId };
        });
      }
    }
    return { text: text, reasoning: reasoning, toolCalls: toolCalls };
  }

  // ---- 流式残留判定（remnant）----
  // 流结束/中止/出错后，_streaming 已置 false 但消息仍是"流式形态"
  // （content:string + _toolSteps[]，尚未被 backgroundReFetch 换成 DB pi 原生形态）。
  // 这类消息必须用 decomposeStreaming 归一化成与 DB 持久化形态等价的 steps，
  // 而非旧代码的 groupIntoTurns _aborted 分支（后者把工具卡片全部丢掉）。
  function isStreamRemnant(a) {
    if (!a || a.role !== 'assistant' || a._streaming) return false;
    if (typeof a.content !== 'string') return false; // 已是 blocks 形态 = DB 原生，走原生分支
    return !!a._aborted || !!a._error || (Array.isArray(a._toolSteps) && a._toolSteps.length > 0);
  }

  // ---- 压缩/分支摘要卡片 HTML（唯一构造点，D3 收口）----
  // summary 为纯文本，输出进 HTML 前必须转义（与旧 groupIntoTurns 内联版 esc() 语义一致）
  var _escMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) { return _escMap[c]; });
  }
  function compactionCardHtml(summary) {
    var safe = escHtml(summary || '');
    return '<div class="compaction-result">'
      + '<div class="compaction-head">✂️ 上下文已压缩</div>'
      + (safe ? '<details class="compaction-summary"><summary>查看压缩摘要</summary><div class="compaction-summary-body">' + safe + '</div></details>' : '')
      + '</div>';
  }

  // ============================================================
  // Turn 分组（语义与 session.js groupIntoTurns 完全一致，仅加 key）
  // ============================================================
  /**
   * @param {Array} messages  消息数组（pi 原生 / 流式临时形态均可）
   * @returns {Array} turns，每项 { key, type, ... }：
   *   - user turn: { key, type:'user', user:{content:纯文本,...}, steps:[...] }
   *     steps 条目形态与 groupIntoTurns 完全一致：
   *       { streaming: sm } / { assistant:normA, toolCalls, toolResults, hasMore } /
   *       { system: m } / { orphan: m }
   *   - 'other' turn: { key, type:'other', message:m }
   * key 规则：user = user._localId || user.id || ('t'+分组序号)；
   *           other = message._localId || message.id || hash(role+内容前24字符)（单次调用内去重后缀）。
   */
  function buildTurns(messages) {
    const turns = [];
    var usedOtherKeys = {}; // 单次调用内的 other-key 去重（保证同一输出内 key 唯一且确定性）
    var i = 0;
    var turnOrdinal = 0; // 分组序号（每产出一个 turn 递增；孤儿/other 也算）
    if (!messages) return turns;

    function nextOtherKey(m, contentText) {
      var base = m._localId || m.id;
      if (base) return String(base);
      var src = String(contentText || '');
      var key = 'o' + hashStr((m.role || 'msg') + ':' + src.slice(0, 24));
      // 同一次调用内重复（如同前缀的两个压缩卡片）→ 追加去重序号，保持确定性
      if (usedOtherKeys[key] != null) {
        var n = ++usedOtherKeys[key];
        key = key + '-' + n;
      } else {
        usedOtherKeys[key] = 0;
      }
      return key;
    }

    while (i < messages.length) {
      const m = messages[i];
      if (m.role === 'user') {
        var _userContent = typeof m.content === 'string' ? m.content : msgText(m.content);
        const userCopy = Object.assign({}, m, { content: _userContent });
        var ukey = userCopy._localId || userCopy.id || ('t' + turnOrdinal);
        turnOrdinal++;
        const turn = { key: String(ukey), type: 'user', user: userCopy, steps: [] };
        i++;
        while (i < messages.length && messages[i].role !== 'user') {
          const a = messages[i];
          if (a.role === 'assistant' && a._streaming) {
            // 活跃流式：渲染层按 streaming step 渲染（live 状态，不归一化）
            turn.steps.push({ streaming: a });
            i++;
          } else if (a.role === 'assistant' && isStreamRemnant(a)) {
            // 流式残留：结束/中止/出错但尚未被 reFetch 替换。归一化为与 DB
            // 持久化形态等价的 steps（工具卡片保留 + 正文独立 final step）。
            var dec = decomposeStreaming(a);
            for (var di = 0; di < dec.steps.length; di++) turn.steps.push(dec.steps[di]);
            i++;
          } else if (a.role === 'assistant') {
            // pi 原生 AssistantMessage：content 是 (Text|Thinking|ToolCall)[] blocks
            var parts = extractAssistantParts(a);
            var normA = Object.assign({}, a, { content: parts.text, reasoning: parts.reasoning });
            if (parts.toolCalls.length > 0) {
              const step = { assistant: normA, toolCalls: parts.toolCalls, toolResults: [], hasMore: true };
              i++;
              // pi 原生 toolResult（兼容旧 'tool'）
              while (i < messages.length && (messages[i].role === 'toolResult' || messages[i].role === 'tool')) {
                step.toolResults.push(messages[i]);
                i++;
              }
              // 多轮工具调用：下一条 assistant 也有 toolCall blocks → 继续归入下一 step
              if (i < messages.length && messages[i].role === 'assistant') {
                var nextParts = extractAssistantParts(messages[i]);
                if (nextParts.toolCalls.length > 0) {
                  turn.steps.push(step);
                  continue;
                }
              }
              turn.steps.push(step);
            } else {
              turn.steps.push({ assistant: normA, toolCalls: null, toolResults: [], hasMore: false });
              i++;
            }
          } else if (a.role === 'system') {
            turn.steps.push({ system: a });
            i++;
          } else {
            turn.steps.push({ orphan: a });
            i++;
          }
        }
        turns.push(turn);
      } else if (m.role === 'system' && m._compactionHtml) {
        // 独立出现的压缩卡片（数组头部）：作为 other turn，跳过其后到下一个
        // user 的所有孤儿消息（fb12a52：防止扁平化渲染成视觉灾难）
        turns.push({ key: nextOtherKey(m, m._compactionHtml), type: 'other', message: m });
        turnOrdinal++;
        i++;
        while (i < messages.length && messages[i].role !== 'user') i++;
      } else if (m.role === 'compactionSummary') {
        // pi 原生压缩摘要消息：{ role:'compactionSummary', summary:'...' }
        var _key = nextOtherKey(m, m.summary || msgText(m.content));
        turnOrdinal++;
        turns.push({
          key: _key,
          type: 'other',
          message: { role: 'system', _compactionHtml: compactionCardHtml(m.summary || ''), _isCompaction: true }
        });
        i++;
        while (i < messages.length && messages[i].role !== 'user') i++;
      } else {
        turns.push({ key: nextOtherKey(m, msgText(m.content)), type: 'other', message: m });
        turnOrdinal++;
        i++;
      }
    }
    return turns;
  }

  // ============================================================
  // 流式消息 → steps 唯一分解（语义 = session.js renderTurnStepsHTML 流式分支）
  // ============================================================
  /**
   * 把一条 streaming assistant（content:string + _toolSteps[]）分解成与
   * "持久化 pi 双消息形态"等价的 steps（供渲染层与测试断言共用）。
   * @returns {{ steps: Array, flags: Object }}
   *   steps:   toolStep(含 reasoning)/finalStep(含 content)/仅思考 step，
   *            形态与 buildTurns 产出的 assistant step 一致；
   *   flags:   { hasContent, hasReasoning, usage, aborted, runningSet, toolTimes }
   *            —— running/toolTimes 边通道供 HTML 构建器算实时耗时（live timer）。
   */
  function decomposeStreaming(sm) {
    var flags = {
      hasContent: !!(sm.content && sm.content.trim()),
      hasReasoning: !!(sm.reasoning && sm.reasoning.trim()),
      usage: sm._usage || null,
      aborted: !!sm._aborted,
      runningSet: {},
      toolTimes: {}
    };
    var steps = [];

    // 有工具步骤 → 构建 toolStep（reasoning 跟着 toolStep，content 拆到 finalStep）
    if (sm._toolSteps && sm._toolSteps.length > 0) {
      var toolCalls = sm._toolSteps.map(function(ts, idx) {
        return { name: ts.name || 'unknown', arguments: ts.args, id: ts.toolCallId || ('call_stream_' + idx) };
      });
      var toolResults = [];
      sm._toolSteps.forEach(function(ts, idx) {
        var tcId = ts.toolCallId || ('call_stream_' + idx);
        if (ts.result !== undefined && ts.result !== null && ts.result !== '') {
          toolResults.push({
            role: 'toolResult',
            toolCallId: tcId,
            content: typeof ts.result === 'string' ? ts.result : JSON.stringify(ts.result),
            isError: !!ts.error
          });
        }
        if (ts.running) flags.runningSet[tcId] = true;
        flags.toolTimes[tcId] = {
          startTime: ts.startTime || null,
          endTime: ts.endTime || null,
          running: !!ts.running
        };
      });
      steps.push({
        assistant: { reasoning: sm.reasoning || '', content: '', timestamp: sm.timestamp },
        toolCalls: toolCalls,
        toolResults: toolResults,
        hasMore: flags.hasContent
      });
    }

    // 有正文内容 → 构建 finalStep
    if (flags.hasContent) {
      var finalReasoning = (sm._toolSteps && sm._toolSteps.length > 0) ? '' : (sm.reasoning || '');
      steps.push({
        assistant: { content: sm.content, reasoning: finalReasoning, timestamp: sm.timestamp },
        toolCalls: null, toolResults: [], hasMore: false
      });
    } else if (!sm._toolSteps || sm._toolSteps.length === 0) {
      // 无工具、无正文，仅思考
      if (flags.hasReasoning) {
        steps.push({
          assistant: { reasoning: sm.reasoning, content: '', timestamp: sm.timestamp },
          toolCalls: null, toolResults: [], hasMore: false,
          _reasoningActive: true
        });
      }
    }

    return { steps: steps, flags: flags };
  }

  // ============================================================
  // Turn 结构签名（廉价、保守：宁可过度重渲，不可漏渲）
  // ============================================================
  /**
   * 设计不变式（oracle）：旧 _lastSig 漏字段 → 走错 patch → 渲染错误；
   * 本签名漏字段 → 仅过度重渲（损性能不损正确性）。等长内容替换等"漏渲"
   * 场景由结构性改写路径（delete/压缩/全量 load/merge）的强制重渲封死。
   * 注意：不含墙上时钟（running 步骤的每秒跳动由 live timer 显式触发重渲，
   * 不依赖签名变化）。
   */
  function contentMarker(text) {
    var s = String(text == null ? '' : text);
    return s.length + ':' + s.slice(0, 12);
  }

  function stepSig(step) {
    if (!step) return '?';
    var out = [];
    if (step.streaming) {
      var sm = step.streaming;
      out.push('S');
      out.push(contentMarker(sm.content));
      out.push(contentMarker(sm.reasoning));
      out.push('ab=' + (sm._aborted ? 1 : 0));
      out.push('ap=' + (sm._approval && !sm._approvalResolved ? 1 : 0));
      out.push('us=' + (sm._usage ? ((sm._usage.total_tokens || 0) + ':' + (sm._usage.prompt_tokens || 0)) : '-'));
      var tss = sm._toolSteps || [];
      out.push('ts=' + tss.length);
      tss.forEach(function(ts) {
        out.push((ts.toolCallId || '') + '|' + (ts.name || '') + '|r' + (ts.running ? 1 : 0) + '|e' + (ts.error ? 1 : 0) + '|' + contentMarker(ts.result));
      });
      return out.join('~');
    }
    if (step.assistant) {
      var a = step.assistant;
      out.push('A');
      out.push(contentMarker(a.content));
      out.push(contentMarker(a.reasoning));
      out.push('hm=' + (step.hasMore ? 1 : 0));
      if (step._reasoningActive) out.push('ra=1');
      var tcs = step.toolCalls || [];
      out.push('tc=' + tcs.length);
      tcs.forEach(function(tc) {
        out.push((tc.id || tc.toolCallId || '') + '|' + (tc.name || ''));
      });
      var trs = step.toolResults || [];
      out.push('tr=' + trs.length);
      trs.forEach(function(tr) {
        out.push((tr.toolCallId || tr.tool_call_id || '') + '|e' + (tr.isError ? 1 : 0) + '|' + contentMarker(msgText(tr.content)));
      });
      return out.join('~');
    }
    if (step.system) {
      out.push('SY:' + contentMarker(step.system.content) + ':' + (step.system._compactionHtml ? 'html' : '-') + ':' + (step.system._isCompaction ? 'comp' : '-'));
      return out.join('~');
    }
    if (step.orphan) {
      out.push('O:' + contentMarker(msgText(step.orphan.content)));
      return out.join('~');
    }
    return '?';
  }

  function turnSig(turn) {
    var parts = [];
    parts.push('type=' + turn.type);
    if (turn.type === 'user') {
      parts.push('u=' + contentMarker(turn.user.content));
      parts.push('n=' + (turn.steps || []).length);
      (turn.steps || []).forEach(function(s) { parts.push(stepSig(s)); });
    } else {
      parts.push('m=' + contentMarker(msgText(turn.message.content)));
      parts.push('c=' + (turn.message._compactionHtml ? '1' : '0') + (turn.message._isCompaction ? ':c' : ''));
    }
    return parts.join('|');
  }

  // ---- Exports ----
  window.Hermes.uid = uid;
  window.Hermes.msgText = msgText;
  window.Hermes.hashStr = hashStr;
  window.Hermes.buildTurns = buildTurns;
  window.Hermes.turnSig = turnSig;
  window.Hermes.decomposeStreaming = decomposeStreaming;
  window.Hermes.isStreamRemnant = isStreamRemnant;
  window.Hermes.compactionCardHtml = compactionCardHtml;
  window.Hermes.extractAssistantParts = extractAssistantParts;

})();
