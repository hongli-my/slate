/* ============================================================
   Hermes WebUI - View Model Module (pure functions)

   把"消息数组"归一化为"带稳定 key 的 turn 视图"，全部为**纯函数**
   （加载期零 DOM / 零外部依赖，node 可单测）。

   形态统一（本轮重构核心）：
   - 流式与历史共用 **pi 原生消息形态**（content blocks + 独立 toolResult 消息）。
     流式期前端只维护累积器（text/reasoning/toolCalls/runningTools），
     message_end 到达时用事件携带的权威消息原地替换 partial（嫁接 _localId
     保持 turn key 稳定）。不再有 Hermes 遗留的 content:string + _toolSteps
     双形态，不再需要 decomposeStreaming / isStreamRemnant 归一化。
   - buildTurns(messages, live) 第二参数为可选的活跃流状态（live）：
     含 partial 的 step 用累积器覆盖 content/reasoning 并标记 step.partial，
     turn 级挂 turn.live 供渲染层做流式装饰（spinner/实时耗时/审批卡）。
   - turnSig 为廉价结构签名，供渲染器逐 turn 判定是否需重渲。

   实测数据契约（2026-09-08 真实 sidecar 验证）：
   - pi 原生 thinking block 的正文在 **.thinking** 字段（非 .text）；
   - REST /messages 返回的消息**没有 id 字段**，key 主要靠 _localId / 序号兜底；
   - ToolCall block：{type:'toolCall', id, name, arguments}；
   - Usage：{input, output, cacheRead, cacheWrite, totalTokens, ...}。
   ============================================================ */

window.Hermes = window.Hermes || {};

(function() {
  'use strict';

  // ---- 本地消息身份 ----
  /** 短随机 id：本地创建的消息（user / 流式 partial 等）在创建时分配 */
  function uid() {
    return 'l' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  }

  // ---- 纯文本提取 ----
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

  // ---- assistant 消息分解 ----
  // pi 原生：content = (Text|Thinking|ToolCall)[] blocks，thinking 正文在 b.thinking。
  // 流式 partial 的 blocks 为空（正文在 live 累积器），由 buildTurns 覆盖。
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
      // 兜底：物化前的本地消息 / 异常数据。正常路径不出现。
      text = a.content;
      reasoning = a.reasoning || '';
    }
    return { text: text, reasoning: reasoning, toolCalls: toolCalls };
  }

  // ---- 压缩/分支摘要卡片 HTML（唯一构造点）----
  // summary 为纯文本，输出进 HTML 前必须转义
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
  // Turn 分组（唯一实现；流式与历史统一走原生形态）
  // ============================================================
  /**
   * @param {Array} messages  消息数组（pi 原生 / 流式 partial 均为原生形态）
   * @param {Object} [live]   活跃流状态（streamState）：含 partial / text /
   *                          reasoning / toolCalls / runningTools / approval /
   *                          error / aborted。非焦点会话或流结束后传 null。
   * @returns {Array} turns，每项 { key, type, ... }：
   *   - user turn: { key, type:'user', user, steps, live? }
   *     steps 条目（单一形态）：
   *       { assistant, toolCalls, toolResults, hasMore,
   *         partial?, _reasoningActive?, _error?, _aborted? }
   *       - partial: 该 step 的 assistant 消息是流式进行中的 partial，
   *         content/reasoning 已用 live 累积器覆盖
   *       - toolCalls: pi 原生 ToolCall block（partial 用 live.toolCalls）
   *   - 'other' turn: { key, type:'other', message }
   * key 规则：user = user._localId || user.id || ('t'+分组序号)；
   *           other = message._localId || message.id || hash(role+内容前24字符)。
   */
  function buildTurns(messages, live) {
    const turns = [];
    var usedOtherKeys = {}; // 单次调用内的 other-key 去重（保证同一输出内 key 唯一且确定性）
    var i = 0;
    var turnOrdinal = 0; // 分组序号（每产出一个 turn 递增；孤儿/other 也算）
    if (!messages) return turns;
    var livePartial = live ? live.partial : null;

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
          if (a.role === 'assistant') {
            // pi 原生 AssistantMessage：content 是 (Text|Thinking|ToolCall)[] blocks。
            // partial（流式进行中）：blocks 为空，正文/思考/工具调用来自 live 累积器。
            const isPartial = a === livePartial;
            var parts = extractAssistantParts(a);
            var normA = Object.assign({}, a, { content: parts.text, reasoning: parts.reasoning });
            if (isPartial && live) {
              normA.content = live.text || '';
              normA.reasoning = live.reasoning || '';
            }
            var tcs = parts.toolCalls;
            if (!tcs.length && isPartial && live.toolCalls) tcs = live.toolCalls;
            if (tcs.length > 0) {
              const step = { assistant: normA, toolCalls: tcs, toolResults: [], hasMore: true };
              if (isPartial) {
                step.partial = true;
                step.hasMore = !!(live.text && live.text.trim());
              }
              if (a._error) step._error = a._error;
              if (a._aborted) step._aborted = true;
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
              const step = { assistant: normA, toolCalls: null, toolResults: [], hasMore: false };
              if (isPartial) {
                step.partial = true;
                // 纯思考阶段（无正文无工具）：思考 item 显示为活跃态
                if (live.reasoning && live.reasoning.trim() && !(live.text && live.text.trim())) {
                  step._reasoningActive = true;
                }
              }
              if (a._error) step._error = a._error;
              if (a._aborted) step._aborted = true;
              turn.steps.push(step);
              i++;
            }
          } else if (a.role === 'system') {
            turn.steps.push({ system: a });
            i++;
          } else if (a.role === 'compactionSummary') {
            // turn 内尾随的压缩摘要（DB 加载形态）：归一为压缩卡片，避免 orphan 空渲染
            turn.steps.push({ system: { role: 'system', _compactionHtml: compactionCardHtml(a.summary || ''), _isCompaction: true } });
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

    // ---- live 挂载 ----
    // partial 所在的 turn；无 partial（工具执行中 / 占位阶段）→ 最后一个 turn。
    // 渲染层（render.js / session.js）用 turn.live 做流式装饰。
    if (live) {
      var target = null;
      for (var ti = 0; ti < turns.length; ti++) {
        var sts = turns[ti].steps || [];
        for (var si = 0; si < sts.length; si++) {
          if (sts[si].partial) { target = turns[ti]; break; }
        }
        if (target) break;
      }
      if (!target && turns.length > 0) target = turns[turns.length - 1];
      if (target) target.live = live;
    }
    return turns;
  }

  // ============================================================
  // Turn 结构签名（廉价、保守：宁可过度重渲，不可漏渲）
  // ============================================================
  /**
   * 设计不变式：签名漏字段 → 仅过度重渲（损性能不损正确性）。等长内容替换等
   * "漏渲"场景由结构性改写路径（delete/压缩/全量 load/merge）的强制重渲封死。
   * 注意：不含墙上时钟（running 步骤的每秒跳动由 live timer 显式触发重渲，
   * 不依赖签名变化）。
   */
  // contentMarker 结果缓存：流式期 renderDiff 每 tick 对全部 turn 调 turnSig→contentMarker，
  // 但只有最后一个（流式）turn 的内容在变，前序 turn 的 content 字符串值不变 → 命中缓存跳过 FNV-1a。
  // 按"字符串值"作 key（同值不同引用也命中）。
  // 容量上限避免长会话无界增长；LRU 式淘汰最旧项。
  var _cmCache = new Map();
  var _CM_CACHE_MAX = 1024;

  function contentMarker(text) {
    var s = String(text == null ? '' : text);
    // 全量哈希（FNV-1a，复用 hashStr）：等长但内容不同的替换不会再撞签名导致漏渲。
    var cached = _cmCache.get(s);
    if (cached !== undefined) return cached;
    var m = s.length + ':' + hashStr(s);
    if (_cmCache.size >= _CM_CACHE_MAX) {
      var fk = _cmCache.keys().next().value;
      _cmCache.delete(fk);
    }
    _cmCache.set(s, m);
    return m;
  }

  function stepSig(step) {
    if (!step) return '?';
    var out = [];
    if (step.assistant) {
      var a = step.assistant;
      out.push('A');
      out.push(contentMarker(a.content));
      out.push(contentMarker(a.reasoning));
      out.push('hm=' + (step.hasMore ? 1 : 0));
      if (step.partial) out.push('p=1');
      if (step._reasoningActive) out.push('ra=1');
      if (step._error) out.push('er=1');
      if (step._aborted) out.push('ab=1');
      if (a.usage) out.push('us=' + (a.usage.input || 0) + '/' + (a.usage.output || 0) + '/' + (a.usage.totalTokens || 0));
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
  window.Hermes.compactionCardHtml = compactionCardHtml;
  window.Hermes.extractAssistantParts = extractAssistantParts;

})();
