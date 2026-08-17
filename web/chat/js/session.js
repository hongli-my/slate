/* ============================================================
   Hermes WebUI - Session & Message Rendering Module v3
   
   核心改动（对比 v2）：
   - selectSession 委托给 SessionManager.enterSession
   - deleteSession 使用 SessionManager.cleanupSession
   - rename 使用 api() 封装（不再 raw fetch）
   - loadSessions 透传 limit 参数
   - 消息缓存通过 SessionManager 管理
   - 删除消息后从缓存移除而非全量 re-fetch
   ============================================================ */

window.Hermes = window.Hermes || {};

(function() {
  'use strict';

  const $ = window.Hermes.$;
  const $$ = window.Hermes.$$;
  const esc = window.Hermes.esc;
  const fmtTime = window.Hermes.fmtTime;
  const fmtTokens = window.Hermes.fmtTokens;
  const fmtDuration = window.Hermes.fmtDuration;
  const truncate = window.Hermes.truncate;
  const api = window.Hermes.api;

  // ---- 解析 tool 结果 ----
  function parseToolResult(content) {
    if (!content) return { success: false, text: '' };
    try {
      const obj = typeof content === 'string' ? JSON.parse(content) : content;
      return {
        success: obj.success === true || obj.ok === true || (obj.error == null && (obj.exit_code === undefined || obj.exit_code === 0)),
        text: obj.error || obj.message || obj.output || content,
        raw: content,
      };
    } catch(e) {
      if (content.includes('"error"') || content.startsWith('Error')) {
        return { success: false, text: content, raw: content };
      }
      return { success: true, text: content, raw: content };
    }
  }

  function formatToolOutput(rawText) {
    if (!rawText) return '';
    let text = rawText;
    if (typeof text === 'object') {
      try { text = JSON.stringify(text, null, 2); } catch(e) { text = String(text); }
    }
    if (typeof text === 'string') {
      const trimmed = text.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
          (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          const parsed = JSON.parse(text);
          if (typeof parsed === 'object' && parsed !== null) {
            text = JSON.stringify(parsed, null, 2);
          }
        } catch(e) {}
      }
    }
    if (typeof text === 'string') {
      text = text.replace(/\\n/g, '\n').replace(/\n{3,}/g, '\n\n');
    }
    text = String(text).trim();
    text = text.split('\n').map(line => {
      if (line.length > 120 && !line.includes(' ') && !line.includes('\t')) {
        return line.replace(/(.{80})/g, '$1\n');
      }
      return line;
    }).join('\n');
    return text;
  }

  function renderToolCard(tc, toolResult, stepIdx, isActive, noToggle, running, dur) {
    // Returns { item: HTML, panel: HTML }
    // running: true when tool is still executing (streaming only)
    const name = tc.function?.name || tc.name || 'unknown';
    let args = '';
    let argsPreview = '';
    try {
      const argsObj = typeof tc.function?.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function?.arguments;
      if (argsObj) {
        const keys = Object.keys(argsObj);
        argsPreview = keys.slice(0, 2).map(k => {
          const v = argsObj[k];
          const vs = typeof v === 'string' ? v : JSON.stringify(v);
          const vsShort = vs.length > 40 ? vs.substring(0, 40) + '…' : vs;
          return esc(k) + '=' + esc(vsShort);
        }).join(' ');
        if (keys.length > 2) argsPreview += ' +' + (keys.length - 2);
        args = keys.map(k => {
          const v = argsObj[k];
          return `<span class="tc-arg-key">${esc(k)}</span>=<span class="tc-arg-val">${esc(typeof v === 'string' ? v : JSON.stringify(v))}</span>`;
        }).join(' ');
      }
    } catch(e) { args = esc(truncate(tc.function?.arguments || '', 60)); argsPreview = args; }

    let panelBody = '';
    let statusIcon = '⚡';
    let statusClass = 'ow-pending';
    let tlClass = 'ow-tl-pending';

    if (running) {
      statusIcon = '<div class="ow-spinner"></div>';
      tlClass = 'ow-tl-running';
    } else if (toolResult) {
      const parsed = parseToolResult(toolResult.content);
      statusIcon = parsed.success ? '✓' : '✗';
      statusClass = parsed.success ? 'ow-done' : 'ow-fail';
      tlClass = parsed.success ? 'ow-tl-done' : 'ow-tl-error';
      const bodyText = formatToolOutput(parsed.text || '');
      panelBody = `<div class="ow-ep-b${parsed.success ? '' : ' ow-ep-b-fail'}">${esc(bodyText)}</div>`;
    }

    // 耗时徽标（历史回放 + 流式中均显示）
    var durBadge = '';
    if (running) {
      // 流式中正在运行：显示实时计时
      if (dur != null && dur > 0) {
        durBadge = '<span class="ow-tl-dur ow-tl-dur-live">' + esc(fmtTimelineDur(dur)) + '</span>';
      }
    } else {
      if (dur != null && dur > 0) {
        durBadge = '<span class="ow-tl-dur">' + esc(fmtTimelineDur(dur)) + '</span>';
      } else if (dur === null) {
        durBadge = '<span class="ow-tl-dur ow-tl-dur-unknown">…</span>';
      }
    }
    var errMark = (!running && toolResult && statusClass === 'ow-fail') ? '<span class="ow-tl-err">✗</span>' : '';

    const item = `<div class="ow-tl-item ${tlClass}" data-action="toggle-ow-tl">
        <span class="ow-tl-name">${esc(name)}</span>
        ${argsPreview ? '<span class="ow-tl-args">' + argsPreview + '</span>' : ''}
        ${durBadge}${errMark}
        <span class="ow-tl-stat">${statusIcon}</span>
      </div>`;
    const panel = `<div class="ow-ep">
        <div class="ow-ep-h"><span style="color:${statusClass === 'ow-done' ? 'var(--accent2)' : statusClass === 'ow-fail' ? 'var(--danger)' : 'var(--text-weaker)'}">${running ? '⏳' : statusIcon}</span><span class="ow-ep-name">${esc(name)}</span>${argsPreview ? '<span class="ow-ep-meta">' + argsPreview + '</span>' : ''}${durBadge}</div>
        ${args ? '<div class="ow-pill-args-full">' + args + '</div>' : ''}
        ${panelBody}
      </div>`;

    return { item, panel };
  }

  function renderNoteItem(text) {
    if (!text || !text.trim()) return null;
    const trimmed = text.trim();
    const preview = trimmed.substring(0, 50) + (trimmed.length > 50 ? '…' : '');
    const item = `<div class="ow-tl-item ow-tl-note" data-action="toggle-ow-tl">
        <span class="ow-note-name">说明</span>
        <span class="ow-note-preview">${esc(preview)}</span>
      </div>`;
    const panel = `<div class="ow-ep">
        <div class="ow-ep-h"><span style="color:var(--text-weaker)">📝</span><span class="ow-ep-name" style="color:var(--text-weaker)">说明</span></div>
        <div class="ow-ep-b ow-ep-b-md">${window.Hermes.renderMarkdown(text)}</div>
      </div>`;
    return { item, panel };
  }

  function renderThinkingItem(reasoning, isActive, dur) {
    if (!reasoning || !reasoning.trim()) return null;
    const trimmed = reasoning.trim();
    const preview = trimmed.substring(0, 50) + (trimmed.length > 50 ? '…' : '');
    const tlClass = isActive ? 'ow-tl-think-running' : 'ow-tl-think';
    var durBadge = (!isActive && dur != null && dur > 0) ? '<span class="ow-tl-dur ow-tl-dur-think">' + esc(fmtTimelineDur(dur)) + '</span>' : '';
    const item = `<div class="ow-tl-item ${tlClass}" data-action="toggle-ow-tl">
        <span class="ow-think-name">思考</span>
        <span class="ow-think-preview">${esc(preview)}</span>
        ${durBadge}
        <span class="ow-think-stat">${isActive ? '<div class="ow-spinner"></div>' : ''}</span>
      </div>`;
    const panel = `<div class="ow-ep">
        <div class="ow-ep-h"><span style="color:#af52de">💭</span><span class="ow-ep-name" style="color:#af52de">思考过程</span></div>
        <div class="ow-ep-b ow-ep-b-md">${window.Hermes.renderMarkdown(reasoning)}</div>
      </div>`;
    return { item, panel };
  }

  // 思考气泡（Word 批注式右侧 margin）：只在"正在思考"时显示，作为实时预览窗。
  // 独立于 .turn-steps，不被每帧 innerHTML 重建，避免工具重排闪烁连累思考。
  // 思考结束/历史不显示气泡——思考留在时间线 item（原版折叠，点击展开）。
  function renderThinkingMarginBlock(reasoning) {
    if (!reasoning || !reasoning.trim()) return '';
    var trimmed = reasoning.trim();
    var header = '<div class="tm-header">' +
      '<span class="tm-icon">💭</span>' +
      '<span class="tm-label">思考中</span>' +
      '<span class="ow-spinner tm-spin"></span>' +
      '</div>';
    // 多行展开，流式 markdown（跳过 hljs 保性能），钉底由 renderCurrentChat 处理
    return '<div class="tm-block tm-active">' + header +
      '<div class="tm-body">' + window.Hermes.renderStreamingMarkdown(trimmed, 'tm') + '</div></div>';
  }

  // 只渲染"正在思考"的气泡。非流式/思考已结束 → 返回空串（不占布局，气泡消失）。
  function renderThinkingMargin(turn, isStreaming) {
    if (!isStreaming) return '';  // 历史/非流式：无气泡，思考在时间线 item
    var blocks = [];
    (turn.steps || []).forEach(function(step) {
      if (step.streaming) {
        var sm = step.streaming;
        if (sm.reasoning && sm.reasoning.trim()) {
          var hasContent = !!(sm.content && sm.content.trim());
          var hasTools = sm._toolSteps && sm._toolSteps.length > 0;
          // 正在思考 = 有 reasoning 但还没开始输出正文/工具
          if (!hasContent && !hasTools) blocks.push(sm.reasoning);
        }
      }
    });
    if (!blocks.length) return '';
    var inner = blocks.map(function(r) { return renderThinkingMarginBlock(r); }).join('');
    return '<div class="turn-margin">' + inner + '</div>';
  }

  function renderThinkingBlock(reasoning, isActive, noToggle) {
    if (!reasoning || !reasoning.trim()) return '';
    if (noToggle) {
      return `<div class="thinking-block"><div class="thinking-body">${window.Hermes.renderMarkdown(reasoning)}</div></div>`;
    }
    const initState = isActive ? '' : ' thinking-collapsed';
    return `
      <div class="thinking-block${initState}">
        <div class="thinking-header" data-action="toggle-thinking">
          <span class="thinking-icon">💭</span>
          <span class="thinking-label">思考过程</span>
          <span class="thinking-toggle"></span>
        </div>
        <div class="thinking-body">${window.Hermes.renderMarkdown(reasoning)}</div>
      </div>`;
  }

  // Turn 分组
  function groupIntoTurns(messages) {
    const turns = [];
    let i = 0;
    while (i < messages.length) {
      const m = messages[i];
      if (m.role === 'user') {
        const turn = { type: 'user', user: m, steps: [] };
        i++;
        while (i < messages.length && messages[i].role !== 'user') {
          const a = messages[i];
          if (a.role === 'assistant' && a._streaming) {
            turn.steps.push({ streaming: a });
            i++;
          } else if (a.role === 'assistant' && a._aborted) {
            turn.steps.push({ assistant: a, toolCalls: null, toolResults: [], hasMore: false });
            i++;
          } else if (a.role === 'assistant') {
            let toolCalls = null;
            if (a.tool_calls) {
              try { toolCalls = typeof a.tool_calls === 'string' ? JSON.parse(a.tool_calls) : a.tool_calls; } catch(e) { toolCalls = null; }
            }
            if (toolCalls && toolCalls.length > 0) {
              const step = { assistant: a, toolCalls: toolCalls, toolResults: [], hasMore: true };
              i++;
              while (i < messages.length && messages[i].role === 'tool') {
                step.toolResults.push(messages[i]);
                i++;
              }
              if (i < messages.length && messages[i].role === 'assistant') {
                const nextA = messages[i];
                let nextTC = null;
                if (nextA.tool_calls) {
                  try { nextTC = typeof nextA.tool_calls === 'string' ? JSON.parse(nextA.tool_calls) : nextA.tool_calls; } catch(e) { nextTC = null; }
                }
                if (nextTC && nextTC.length > 0) {
                  turn.steps.push(step);
                  continue;
                }
              }
              turn.steps.push(step);
            } else {
              turn.steps.push({ assistant: a, toolCalls: null, toolResults: [], hasMore: false });
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
      } else {
        turns.push({ type: 'other', message: m });
        i++;
      }
    }
    return turns;
  }

  // 流式渲染：转换为 turn 结构，统一走 renderTurnStepsHTML
  function renderStreamingStepsHTML(streamingMsg) {
    var turn = { steps: [{ streaming: streamingMsg }] };
    return renderTurnStepsHTML(turn);
  }

  // ---- 步骤耗时计算 ----
  // 耗时不渲染独立横轴，而是标到每个步骤卡片上（工具/思考/回答）。
  // 仅历史回放（非流式）时计算；流式中步骤还在增长，无意义。

  // 工具名 → emoji 映射
  function getToolEmoji(name) {
    if (!name) return '🛠';
    var n = String(name).toLowerCase();
    if (n.indexOf('read') >= 0 || n === 'cat' || n === 'ls' || n.indexOf('view') >= 0 || n.indexOf('type') >= 0) return '📁';
    if (n.indexOf('bash') >= 0 || n.indexOf('sh') >= 0 || n.indexOf('exec') >= 0 || n.indexOf('run') >= 0 || n.indexOf('command') >= 0) return '⚡';
    if (n.indexOf('edit') >= 0 || n.indexOf('write') >= 0 || n.indexOf('patch') >= 0 || n.indexOf('apply') >= 0 || n.indexOf('create') >= 0) return '✏️';
    if (n.indexOf('grep') >= 0 || n.indexOf('glob') >= 0 || n.indexOf('search') >= 0 || n.indexOf('find') >= 0) return '🔍';
    if (n.indexOf('todo') >= 0 || n.indexOf('task') >= 0) return '📋';
    if (n.indexOf('web') >= 0 || n.indexOf('fetch') >= 0 || n.indexOf('curl') >= 0) return '🌐';
    return '🛠';
  }

  // 秒级耗时格式化：3.2s / 1m20s / 瞬时(≤0)不显示
  function fmtTimelineDur(s) {
    if (s == null || s <= 0) return '';
    if (s < 60) return parseFloat(s.toFixed(1)) + 's';
    var m = Math.floor(s / 60);
    var sec = Math.round(s % 60);
    return m + 'm' + (sec > 0 ? sec + 's' : '');
  }

  // 计算一个 turn 内每个步骤的耗时，返回 { toolDurs, thinkDurs, answerDur, totalDur }
  // toolDurs: Map(callId → dur)，thinkDurs: Array(按出现顺序)，answerDur: number
  function computeStepDurations(turn) {
    var steps = turn.steps || [];
    var prevTs = turn.user ? turn.user.timestamp : null;
    var result = { toolDurs: {}, thinkDurs: [], answerDur: null, totalDur: null };

    // 分类（与 renderTurnStepsHTML 一致）
    var finalStep = null;
    var toolSteps = [];
    steps.forEach(function(step) {
      if (step.system || step.orphan || step.streaming) return;
      var hasTools = step.toolCalls && step.toolCalls.length > 0;
      var ac = step.assistant ? (step.assistant.content || '') : '';
      if (hasTools) toolSteps.push(step);
      else if (ac) finalStep = step;
      else if (step.assistant && step.assistant.reasoning) toolSteps.push(step);
    });

    var firstTs = null, lastTs = null;
    if (turn.user && turn.user.timestamp) firstTs = turn.user.timestamp;

    toolSteps.forEach(function(step) {
      var a = step.assistant;
      if (!a) return;
      if (a.reasoning && String(a.reasoning).trim()) {
        var thinkDur = (prevTs != null && a.timestamp) ? a.timestamp - prevTs : null;
        result.thinkDurs.push(thinkDur);
        if (a.timestamp) { prevTs = a.timestamp; lastTs = a.timestamp; }
      }
      if (step.toolCalls && step.toolCalls.length > 0) {
        var resultMap = {};
        if (step.toolResults) step.toolResults.forEach(function(r) {
          if (r.tool_call_id) resultMap[r.tool_call_id] = r;
        });
        step.toolCalls.forEach(function(tc, idx) {
          var callId = tc.id || tc.call_id;
          var res = resultMap[callId] || (step.toolResults ? step.toolResults[idx] : null) || null;
          var toolDur = (res && res.timestamp && a.timestamp) ? res.timestamp - a.timestamp : null;
          result.toolDurs[callId] = toolDur;
          if (res && res.timestamp) { prevTs = res.timestamp; lastTs = res.timestamp; }
          else if (a.timestamp) { prevTs = a.timestamp; lastTs = a.timestamp; }
        });
      }
    });

    if (finalStep && finalStep.assistant) {
      var a = finalStep.assistant;
      if (a.reasoning && String(a.reasoning).trim()) {
        var td = (prevTs != null && a.timestamp) ? a.timestamp - prevTs : null;
        result.thinkDurs.push(td);
        if (a.timestamp) { prevTs = a.timestamp; lastTs = a.timestamp; }
      }
      if (a.content && String(a.content).trim()) {
        result.answerDur = (prevTs != null && a.timestamp) ? a.timestamp - prevTs : null;
        if (a.timestamp) lastTs = a.timestamp;
      }
    }

    if (firstTs != null && lastTs != null && lastTs > firstTs) {
      result.totalDur = lastTs - firstTs;
    }
    return result;
  }

  // 渲染单个 turn 的 steps 内容（.turn-steps 内部）
  // 流式和历史消息统一走此函数
  function renderTurnStepsHTML(turn) {
    let html = '';
    const streamingStep = turn.steps.find(s => s.streaming);

    // ---- 流式消息转换为和历史消息相同的 step 结构 ----
    var steps;
    var isStreaming = false;
    var stFlags = {};  // streaming-specific flags

    if (streamingStep) {
      var sm = streamingStep.streaming;
      isStreaming = true;
      steps = [];
      stFlags.runningSet = {};
      stFlags.hasContent = !!(sm.content && sm.content.trim());
      stFlags.hasReasoning = !!(sm.reasoning && sm.reasoning.trim());
      stFlags.usage = sm._usage || null;
      stFlags.aborted = !!sm._aborted;

      // 有工具步骤 → 构建 toolStep（reasoning 跟着 toolStep，content 拆到 finalStep）
      if (sm._toolSteps && sm._toolSteps.length > 0) {
        var toolCalls = [];
        var toolResults = [];
        stFlags.toolTimes = {};  // tcId → { startTime, endTime, running }
        sm._toolSteps.forEach(function(ts, idx) {
          var tcId = ts.toolCallId || ('call_stream_' + idx);
          toolCalls.push({
            id: tcId, type: 'function',
            function: {
              name: ts.name || 'unknown',
              arguments: ts.args ? (typeof ts.args === 'string' ? ts.args : JSON.stringify(ts.args)) : '{}'
            }
          });
          if (ts.result !== undefined && ts.result !== null && ts.result !== '') {
            toolResults.push({ role: 'tool', tool_call_id: tcId, content: typeof ts.result === 'string' ? ts.result : JSON.stringify(ts.result) });
          }
          if (ts.running) stFlags.runningSet[tcId] = true;
          stFlags.toolTimes[tcId] = {
            startTime: ts.startTime || null,
            endTime: ts.endTime || null,
            running: !!ts.running
          };
        });
        steps.push({
          assistant: { reasoning: sm.reasoning || '', content: '', timestamp: sm.timestamp },
          toolCalls: toolCalls,
          toolResults: toolResults,
          hasMore: stFlags.hasContent
        });
      }

      // 有正文内容 → 构建 finalStep
      if (stFlags.hasContent) {
        var finalReasoning = (sm._toolSteps && sm._toolSteps.length > 0) ? '' : (sm.reasoning || '');
        steps.push({
          assistant: { content: sm.content, reasoning: finalReasoning, timestamp: sm.timestamp },
          toolCalls: null, toolResults: [], hasMore: false
        });
      } else if (!sm._toolSteps || sm._toolSteps.length === 0) {
        // 无工具、无正文，仅思考
        if (stFlags.hasReasoning) {
          steps.push({
            assistant: { reasoning: sm.reasoning, content: '', timestamp: sm.timestamp },
            toolCalls: null, toolResults: [], hasMore: false,
            _reasoningActive: true
          });
        }
      }

      // 流式专属：审批卡片
      if (sm._approval && !sm._approvalResolved) {
        var a = sm._approval;
        var runId = esc(a.run_id || '');
        var cmdPreview = esc((a.command || '').substring(0, 300));
        var desc = esc(a.description || '');
        var choices = a.choices || ['once', 'deny'];
        html += '<div class="approval-card" data-run-id="' + runId + '">';
        html += '<div class="approval-card-header">⚠️ 命令执行需要审批</div>';
        html += '<div class="approval-card-body">';
        html += '<div class="approval-card-desc">' + desc + '</div>';
        if (cmdPreview) html += '<pre class="approval-card-cmd">' + cmdPreview + '</pre>';
        html += '</div><div class="approval-card-actions">';
        if (choices.includes('once')) html += '<button class="approval-btn approval-btn-once" data-choice="once">✅ 允许本次</button>';
        if (choices.includes('session')) html += '<button class="approval-btn approval-btn-session" data-choice="session">✅ 本次会话</button>';
        if (choices.includes('always')) html += '<button class="approval-btn approval-btn-always" data-choice="always">🔒 永久允许</button>';
        if (choices.includes('deny')) html += '<button class="approval-btn approval-btn-deny" data-choice="deny">❌ 拒绝</button>';
        html += '</div></div>';
      }

      // 流式专属：子代理过程
      if (sm._subagents && sm._subagents.length > 0) {
        html += '<div class="streaming-subagents">';
        sm._subagents.forEach(function(sa) {
          var si = sa.status === 'running' ? '⏳' : (sa.status === 'failed' ? '✗' : '✓');
          var sc = sa.status === 'running' ? 'subagent-running' : (sa.status === 'failed' ? 'subagent-failed' : 'subagent-done');
          var gs = sa.goal.length > 120 ? sa.goal.substring(0, 120) + '…' : sa.goal;
          var dl = '';
          if (sa.startedAt) {
            var d = ((sa.completedAt || Date.now()) - sa.startedAt) / 1000;
            if (d >= 1) dl = ' · ' + (d < 60 ? d.toFixed(0) + 's' : Math.floor(d/60) + 'm' + Math.floor(d%60) + 's');
          }
          html += '<div class="subagent-step ' + sc + '"><div class="subagent-header">';
          html += '<span class="subagent-icon">🤖</span>';
          html += '<span class="subagent-goal">' + esc(gs) + '</span>';
          html += '<span class="subagent-status">' + si + '</span></div>';
          if (sa.summary) {
            var ss = sa.summary.length > 200 ? sa.summary.substring(0, 200) + '…' : sa.summary;
            html += '<div class="subagent-summary">' + esc(ss) + esc(dl) + '</div>';
          }
          html += '</div>';
        });
        html += '</div>';
      }

      // 流式专属：思考中占位（无任何内容）
      if (steps.length === 0 && sm._streaming) {
        html += '<div class="step step-final streaming-content">';
        html += '<div class="step-header"><span class="ow-spinner"></span><span class="step-label">思考中</span></div>';
        html += '</div>';
        return html;
      }
    } else {
      steps = turn.steps;
    }

    // ---- 统一渲染（流式转换后 + 历史消息走同一段代码）----

    // system / orphan 消息
    steps.forEach((step) => {
      if (step.system) {
        if (step.system._compactionHtml) {
          html += '<div class="step system-step compaction-step">' + step.system._compactionHtml + '</div>';
        } else {
          var _scls = step.system._isCompaction ? 'step system-step compaction-step' : 'step system-step';
          html += '<div class="' + _scls + '"><div class="step-content msg-system">' + esc(step.system.content || '') + '</div></div>';
        }
      }
      if (step.orphan) {
        html += '<div class="step"><div class="step-content msg-tool">' + esc(step.orphan.content || '') + '</div></div>';
      }
    });

    // 分类：toolSteps（含工具或仅思考）+ finalStep（有正文）
    let finalStep = null;
    const toolSteps = [];
    steps.forEach((step) => {
      if (step.system || step.orphan) return;
      const hasTools = step.toolCalls && step.toolCalls.length > 0;
      const assistantContent = step.assistant?.content || '';
      if (hasTools) {
        toolSteps.push(step);
      } else if (assistantContent) {
        finalStep = step;
      } else if (step.assistant?.reasoning) {
        // 仅思考、无工具无正文 → 放入时间线
        toolSteps.push(step);
      }
    });

    // 统一时间线：思考 + 旁白 + 工具
    const itemsArr = [];
    const panelsArr = [];

    // 流式/历史 统一计算各步骤耗时
    var stepDurs = isStreaming ? null : computeStepDurations(turn);
    if (isStreaming && stFlags.toolTimes) {
      // 从 toolTimes 构建 toolDurs 映射（callId → dur）
      stepDurs = { toolDurs: {}, thinkDurs: [], answerDur: null, totalDur: null };
      Object.keys(stFlags.toolTimes).forEach(function(cid) {
        var tt = stFlags.toolTimes[cid];
        if (tt.running) {
          stepDurs.toolDurs[cid] = (Date.now() - (tt.startTime || 0)) / 1000;
        } else if (tt.endTime && tt.startTime) {
          stepDurs.toolDurs[cid] = (tt.endTime - tt.startTime) / 1000;
        } else if (tt.startTime) {
          stepDurs.toolDurs[cid] = null; // 有开始但无结束：…
        }
      });
    }
    var thinkDurIdx = 0;

    toolSteps.forEach((step, ti) => {
      const assistantContent = step.assistant?.content || '';
      const hasTools = step.toolCalls && step.toolCalls.length > 0;
      const isJustTrigger = hasTools && (!assistantContent || assistantContent.length < 50);

      // 思考 → 时间线 thinking item
      if (step.assistant?.reasoning) {
        var rActive = isStreaming && !!step._reasoningActive;
        var thinkDur = stepDurs ? (stepDurs.thinkDurs[thinkDurIdx] || null) : null;
        thinkDurIdx++;
        const thinkItem = renderThinkingItem(step.assistant.reasoning, rActive, thinkDur);
        if (thinkItem) {
          itemsArr.push(thinkItem.item);
          panelsArr.push(thinkItem.panel);
        }
      }

      // 旁白（非触发文本）→ 时间线 note item
      if (!isJustTrigger && assistantContent) {
        const noteItem = renderNoteItem(assistantContent);
        if (noteItem) {
          itemsArr.push(noteItem.item);
          panelsArr.push(noteItem.panel);
        }
      }

      // 工具调用 → 时间线 tool item
      const callIdMap = {};
      if (step.toolResults) step.toolResults.forEach(r => { if (r.tool_call_id) callIdMap[r.tool_call_id] = r; });
      if (step.toolCalls) step.toolCalls.forEach(tc => {
        const callId = tc.id || tc.call_id;
        const result = callIdMap[callId] || null;
        const isRunning = isStreaming && stFlags.runningSet && stFlags.runningSet[callId];
        var toolDur = stepDurs ? (stepDurs.toolDurs[callId] != null ? stepDurs.toolDurs[callId] : null) : null;
        const card = renderToolCard(tc, result, ti + 1, !isRunning, false, isRunning, toolDur);
        itemsArr.push(card.item);
        panelsArr.push(card.panel);
      });
    });

    // finalStep 的思考也放入时间线
    if (finalStep && finalStep.assistant?.reasoning) {
      var thinkDur2 = stepDurs ? (stepDurs.thinkDurs[thinkDurIdx] || null) : null;
      const thinkItem = renderThinkingItem(finalStep.assistant.reasoning, false, thinkDur2);
      if (thinkItem) {
        itemsArr.push(thinkItem.item);
        panelsArr.push(thinkItem.panel);
      }
    }

    // 渲染时间线
    if (itemsArr.length > 0) {
      var tlClass = 'ow-tl';
      if (isStreaming) tlClass += ' ow-tl-streaming ow-tl-scroll';
      else if (itemsArr.length > 5) tlClass += ' ow-tl-scroll';
      html += '<div class="ow-tools">';
      html += '<div class="' + tlClass + '">' + itemsArr.join('') + '</div>';
      html += '<div class="ow-panels">' + panelsArr.join('') + '</div>';
      html += '</div>';
    }

    // 最终回复
    if (finalStep) {
      const assistantContent = finalStep.assistant?.content || '';
      if (isStreaming) {
        var stepClass = 'step step-final streaming-content';
        if (stFlags.aborted) stepClass += ' _aborted';
        html += '<div class="' + stepClass + '">';
        html += '<div class="step-header"><span class="step-num step-num-final">✦</span><span class="step-label">回复中</span></div>';
        // P#4: 拆分 md-stable/md-active 容器，让流式更新只 patch 活跃块 DOM
        var _sfSplit = window.Hermes.renderStreamingMarkdownSplit(assistantContent, 'sf');
        html += '<div class="step-answer-wrap"><div class="step-answer collapsible"><div class="md-stable">' + _sfSplit.stableHtml + '</div><div class="md-active">' + _sfSplit.activeHtml + '</div></div></div>';
        if (stFlags.usage && (stFlags.usage.total_tokens || stFlags.usage.prompt_tokens)) {
          var u = stFlags.usage;
          var tokInfo = '';
          if (u.prompt_tokens) tokInfo += fmtTokens(u.prompt_tokens) + ' in';
          if (u.completion_tokens) tokInfo += (tokInfo ? ' · ' : '') + fmtTokens(u.completion_tokens) + ' out';
          if (u.total_tokens) tokInfo += (tokInfo ? ' · ' : '') + fmtTokens(u.total_tokens) + ' total';
          html += '<div class="step-usage">📊 ' + esc(tokInfo) + '</div>';
        }
        html += '</div>';
      } else {
        const agentTime = finalStep.assistant?.timestamp_fmt || fmtTime(finalStep.assistant?.timestamp);
        var totalBadge = (stepDurs && stepDurs.totalDur != null && stepDurs.totalDur > 0)
          ? '<span class="step-total-dur">总计 ' + esc(fmtTimelineDur(stepDurs.totalDur)) + '</span>' : '';
        html += '<div class="step step-final">';
        html += '<div class="step-header"><span class="step-num step-num-final">✦</span><span class="step-label">回复</span><span class="step-time">' + esc(agentTime) + '</span>' + totalBadge + '</div>';
        html += window.Hermes.renderAnswerBlock(assistantContent);
        html += '</div>';
      }
    }

    return html;
  }

  // 渲染单个 turn 的完整 HTML
  function renderSingleTurnHTML(turn) {
    if (turn.type === 'other') {
      const m = turn.message;
      return `<div class="msg-bubble msg-${m.role}"><div class="msg-content">${esc(m.content || '')}</div></div>`;
    }

    const userId = turn.user.id || '';
    const userTime = turn.user.timestamp_fmt || fmtTime(turn.user.timestamp);
    const isStreamingTurn = turn.steps.some(s => s.streaming);

    let html = `<div class="turn" data-msg-id="${esc(String(userId))}"${isStreamingTurn ? ' data-streaming="true"' : ''}>
      <div class="turn-user">
        <div class="turn-user-content">${window.Hermes.renderMarkdown(turn.user.content || '')}</div>
        <div class="turn-avatar user-avatar">U</div>
      </div>
      <div class="turn-time turn-time-user">${esc(userTime)}<span class="turn-actions"><button class="turn-edit-btn" data-msg-id="${esc(String(userId))}" title="编辑重发">✎</button></span></div>`;

    if (turn.steps.length > 0) {
      html += `<div class="turn-agent">
        <div class="turn-avatar agent-avatar">H</div>
        <div class="turn-agent-body">
          <div class="turn-steps">
            ${renderTurnStepsHTML(turn)}
          </div>
        </div>
        ${renderThinkingMargin(turn, isStreamingTurn)}
      </div>`;
    }
    html += `</div>`;
    return html;
  }

  // 渲染消息列表
  function renderMessages(messages, container) {
    const turns = groupIntoTurns(messages);
    let html = '';
    turns.forEach((turn) => {
      html += renderSingleTurnHTML(turn);
    });

    // 保存当前展开/折叠状态
    const expandStates = {};
    container.querySelectorAll('.turn').forEach(turnEl => {
      const msgId = turnEl.dataset.msgId;
      if (!msgId) return;
      const answer = turnEl.querySelector('.step-answer');
      if (answer && !answer.classList.contains('collapsed')) {
        expandStates[msgId + ':answer'] = true;
      }
      const tc = turnEl.querySelector('.tools-collapse');
      if (tc && !tc.classList.contains('tools-collapsed')) {
        expandStates[msgId + ':tools'] = true;
      }
    });

    container.innerHTML = html;

    // P#3: 限定容器范围调用 initCollapsible
    window.Hermes.initCollapsible(container);

    // 恢复用户手动展开/折叠的状态
    Object.keys(expandStates).forEach(key => {
      const msgId = key.replace(/:(answer|tools)$/, '');
      const type = key.match(/:(answer|tools)$/)?.[1];
      const turnEl = container.querySelector(`.turn[data-msg-id="${msgId}"]`);
      if (!turnEl) return;
      if (type === 'answer') {
        const answer = turnEl.querySelector('.step-answer');
        if (answer) answer.classList.remove('collapsed');
        const btn = turnEl.querySelector('.collapse-btn');
        if (btn) { btn.classList.add('expanded'); const lbl = btn.querySelector('.label'); if (lbl) lbl.textContent = '收起'; }
      }
      if (type === 'tools') {
        const tc = turnEl.querySelector('.tools-collapse');
        if (tc) tc.classList.remove('tools-collapsed');
      }
    });
  }

  // ---- S#9: 异步确认对话框（替代 confirm()）----
  var _confirmDlg = null;
  function asyncConfirm(message, title) {
    return new Promise(function(resolve) {
      if (!_confirmDlg) {
        _confirmDlg = document.createElement('div');
        _confirmDlg.className = 'confirm-overlay';
        _confirmDlg.innerHTML =
          '<div class="confirm-dialog">' +
          '<div class="confirm-title"></div>' +
          '<div class="confirm-msg"></div>' +
          '<div class="confirm-actions">' +
          '<button class="confirm-btn confirm-cancel">取消</button>' +
          '<button class="confirm-btn confirm-ok">确认</button>' +
          '</div></div>';
        document.body.appendChild(_confirmDlg);
      }
      _confirmDlg.querySelector('.confirm-title').textContent = title || '确认操作';
      _confirmDlg.querySelector('.confirm-msg').textContent = message;
      _confirmDlg.classList.add('confirm-visible');

      var okBtn = _confirmDlg.querySelector('.confirm-ok');
      var cancelBtn = _confirmDlg.querySelector('.confirm-cancel');
      var resolved = false;

      function cleanup(result) {
        if (resolved) return;
        resolved = true;
        _confirmDlg.classList.remove('confirm-visible');
        okBtn.onclick = null;
        cancelBtn.onclick = null;
        _confirmDlg.onclick = null;
        resolve(result);
      }

      okBtn.onclick = function() { cleanup(true); };
      cancelBtn.onclick = function() { cleanup(false); };
      _confirmDlg.onclick = function(e) {
        if (e.target === _confirmDlg) cleanup(false);
      };
    });
  }

  // ---- 删除消息轮 ----
  async function deleteMessageRound(msgId) {
    const sessionId = window.Hermes.state.focusedSessionId;
    if (!sessionId || !msgId) return;

    if (!await asyncConfirm('确定删除此轮对话？将同时删除关联的助手回复和工具调用，不可恢复。')) return;

    try {
      // 先中止正在进行的流（但不退出会话）
      if (window.Hermes.hasActiveStream(sessionId)) {
        window.Hermes.abortStream(sessionId);
      }
      await api('/sessions/' + sessionId + '/messages/' + msgId, { method: 'DELETE' });
      // 标记缓存过期，重新加载
      window.Hermes.markStale(sessionId);
      await window.Hermes.loadMessagesFromAPI(sessionId);
      // 如果当前正在看这个会话，渲染更新
      if (window.Hermes.state.focusedSessionId === sessionId) {
        if (window.Hermes.state.viewMode === 'chat') {
          window.Hermes.renderCurrentChat();
        } else {
          const msgs = window.Hermes.getMsgs(sessionId);
          if (msgs) renderMessages(msgs, window.Hermes.dom.messageList);
        }
      }
    } catch (e) {
      window.Hermes.toast('删除失败: ' + e.message, true);
    }
  }

  // ---- 右键菜单 ----
  let _ctxMenu = null;

  function _createContextMenu() {
    if (_ctxMenu) return _ctxMenu;
    _ctxMenu = document.createElement('div');
    _ctxMenu.className = 'ctx-menu';
    _ctxMenu.innerHTML =
      '<div class="ctx-menu-item" data-ctx="copy-text">📋 复制文本</div>' +
      '<div class="ctx-menu-item" data-ctx="edit-resend">✎ 编辑重发</div>' +
      '<div class="ctx-menu-item" data-ctx="export-turn">📤 导出此轮</div>' +
      '<div class="ctx-menu-sep"></div>' +
      '<div class="ctx-menu-item ctx-menu-danger" data-ctx="delete-turn">🗑 删除此轮对话</div>';
    document.body.appendChild(_ctxMenu);

    _ctxMenu.addEventListener('click', function(e) {
      const item = e.target.closest('[data-ctx]');
      if (!item) return;
      const action = item.dataset.ctx;
      const msgId = _ctxMenu.dataset.msgId;
      const turnEl = _ctxMenu._turnEl;
      hideContextMenu();
      if (!msgId) return;
      if (action === 'delete-turn') {
        deleteMessageRound(msgId);
      } else if (action === 'copy-text') {
        _copyTurnText(turnEl);
      } else if (action === 'edit-resend') {
        _editResendTurn(turnEl, msgId);
      } else if (action === 'export-turn') {
        _exportSingleTurn(turnEl, msgId);
      }
    });

    return _ctxMenu;
  }

  function _copyTurnText(turnEl) {
    if (!turnEl) return;
    var text = '';
    var userEl = turnEl.querySelector('.turn-user-content');
    var agentEl = turnEl.querySelector('.turn-agent-body') || turnEl.querySelector('.step-answer');
    if (userEl) text += '👤 ' + (userEl.innerText || userEl.textContent) + '\n\n';
    if (agentEl) text += '🤖 ' + (agentEl.innerText || agentEl.textContent);
    navigator.clipboard.writeText(text).then(function() {
      window.Hermes.toast('已复制到剪贴板');
    }).catch(function() {
      window.Hermes.toast('复制失败', true);
    });
  }

  function _editResendTurn(turnEl, msgId) {
    if (!turnEl) return;
    var userEl = turnEl.querySelector('.turn-user-content');
    var text = userEl ? (userEl.innerText || userEl.textContent) : '';
    var dom = window.Hermes.dom;
    if (dom && dom.chatInput) {
      dom.chatInput.value = text;
      dom.chatInput.focus();
      dom.chatInput.style.height = 'auto';
      dom.chatInput.style.height = Math.min(dom.chatInput.scrollHeight, 200) + 'px';
    }
  }

  function _exportSingleTurn(turnEl, msgId) {
    if (!turnEl) return;
    var userEl = turnEl.querySelector('.turn-user-content');
    var agentEl = turnEl.querySelector('.turn-agent-body') || turnEl.querySelector('.step-answer');
    var text = '# 对话片段\n\n';
    if (userEl) text += '### 👤 用户\n\n' + (userEl.innerText || userEl.textContent) + '\n\n';
    if (agentEl) text += '### 🤖 助手\n\n' + (agentEl.innerText || agentEl.textContent) + '\n';
    var blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'turn-' + (msgId || '').substring(0, 12) + '.md';
    a.click();
    URL.revokeObjectURL(url);
    window.Hermes.toast('已导出');
  }

  function showContextMenu(x, y, msgId, turnEl) {
    const menu = _createContextMenu();
    menu.dataset.msgId = msgId;
    menu._turnEl = turnEl;
    menu.style.left = Math.min(x, window.innerWidth - 180) + 'px';
    menu.style.top = Math.min(y, window.innerHeight - 120) + 'px';
    menu.classList.add('ctx-menu-visible');
  }

  function hideContextMenu() {
    if (_ctxMenu) _ctxMenu.classList.remove('ctx-menu-visible');
  }

  function initMessageActions() {
    document.addEventListener('contextmenu', function(e) {
      const turn = e.target.closest('.turn');
      if (!turn || !turn.dataset.msgId) {
        hideContextMenu();
        return;
      }
      e.preventDefault();
      showContextMenu(e.pageX, e.pageY, turn.dataset.msgId, turn);
    });

    document.addEventListener('click', function(e) {
      if (_ctxMenu && !_ctxMenu.contains(e.target)) hideContextMenu();
    });
  }

  // ---- 会话列表 ----
  async function loadSessions() {
    try {
      const { data } = await api('/sessions?limit=200');
      let sessions = Array.isArray(data) ? data : [];
      window.Hermes.state.sessions = sessions;

      // 从后端获取 session→project 映射
      let sessionProjectMap = {};
      try {
        const mappingRes = await api('/projects/mapping');
        sessionProjectMap = mappingRes.data || {};
      } catch (e) {
        console.warn('获取项目映射失败，显示所有会话:', e);
      }

      // 项目 = 目录（pi 中每个 session 都有 cwd）
      // currentProjectId=null 表示“全部”（默认），选了具体项目则按 cwd 过滤
      const currentProjectId = window.Hermes.state.currentProjectId;
      if (currentProjectId) {
        // 选了具体项目：只显示该 cwd 的 session（项目 id 就是 cwd）
        sessions = sessions.filter(function(s) {
          return (s.cwd || '') === currentProjectId;
        });
      }
      // currentProjectId=null：不过滤，显示全部

      renderSessionList(sessions);
      // 更新项目列表中的会话计数
      if (window.Hermes.renderProjectList) {
        window.Hermes.renderProjectList();
      }
    } catch (e) {
      if (window.Hermes.dom && window.Hermes.dom.sessionList) {
        window.Hermes.dom.sessionList.innerHTML = '<div style="padding:16px;color:var(--danger)">加载失败: ' + esc(e.message) + '</div>';
      }
    }
  }

  // P#5/P#6: 列表优化 — 防抖渲染 + 虚拟滚动上限
  var _renderListTimer = null;
  var MAX_VISIBLE_SESSIONS = 100; // 超过此数量时只渲染最近 100 条

  function renderSessionList(sessions) {
    const dom = window.Hermes.dom;
    const state = window.Hermes.state;
    if (!dom || !dom.sessionList) return;
    // P#5: 如果列表过长，只渲染最近的会话（虚拟滚动简化版）
    var visible = sessions;
    var truncated = false;
    if (sessions.length > MAX_VISIBLE_SESSIONS) {
      visible = sessions.slice(0, MAX_VISIBLE_SESSIONS);
      truncated = true;
    }
    dom.sessionList.innerHTML = visible.map(s => {
      const title = s.title || 'Session ' + s.id.substring(0, 16);
      const active = s.id === state.focusedSessionId ? ' active' : '';
      const streaming = window.Hermes.hasActiveStream(s.id) ? ' streaming' : '';
      return `
        <div class="session-item${active}${streaming}" data-id="${esc(s.id)}">
          <div class="session-item-title" data-title="${esc(title)}">${esc(title)}</div>
          <div class="session-item-meta">
            <span>${fmtTime(s.started_at)}</span>
            <span>${s.message_count || 0} 条</span>
            <span>${fmtTokens(s.input_tokens)}</span>
          </div>
          <button class="session-delete" title="删除会话">✕</button>
        </div>`;
    }).join('');
    if (truncated) {
      dom.sessionList.innerHTML += '<div style="padding:0.5rem;text-align:center;color:var(--text-muted);font-size:0.75rem">仅显示最近 ' + MAX_VISIBLE_SESSIONS + ' 条，共 ' + sessions.length + ' 条</div>';
    }
  }

  var _loadSessionsTimer = null;
  function debouncedLoadSessions(delay) {
    if (_loadSessionsTimer) clearTimeout(_loadSessionsTimer);
    _loadSessionsTimer = setTimeout(function() {
      _loadSessionsTimer = null;
      loadSessions();
    }, delay || 1500);
  }

  function initSessionListEvents() {
    const dom = window.Hermes.dom;
    dom.sessionList.addEventListener('click', function(e) {
      if (e.target.classList.contains('rename-input')) return;
      if (e.target.classList.contains('session-delete')) {
        e.stopPropagation();
        const item = e.target.closest('.session-item');
        if (item) {
          window.Hermes.deleteSession(item.dataset.id);
        }
        return;
      }
      const item = e.target.closest('.session-item');
      if (item) {
        window.Hermes.selectSession(item.dataset.id);
      }
    });

    dom.sessionList.addEventListener('dblclick', function(e) {
      const titleEl = e.target.closest('.session-item-title');
      if (titleEl && !titleEl.querySelector('.rename-input')) {
        e.stopPropagation();
        window.Hermes.startRename(titleEl);
      }
    });
  }

  // ---- 重命名（使用 api() 封装）----
  function startRename(titleEl) {
    if (titleEl.querySelector('.rename-input')) return;
    const item = titleEl.closest('.session-item');
    const sessionId = item.dataset.id;
    const currentTitle = titleEl.dataset.title || titleEl.textContent;

    const input = document.createElement('input');
    input.className = 'rename-input';
    input.type = 'text';
    input.value = currentTitle;
    input.setAttribute('maxlength', '200');

    titleEl.textContent = '';
    titleEl.appendChild(input);
    input.focus();
    input.select();

    const finishRename = async (save) => {
      const newTitle = input.value.trim();
      if (save && newTitle && newTitle !== currentTitle) {
        try {
          await window.Hermes.api('/sessions/' + sessionId, {
            method: 'PATCH',
            body: { title: newTitle },
          });
          titleEl.dataset.title = newTitle;
          titleEl.textContent = newTitle;
          const s = window.Hermes.state.sessions.find(s => s.id === sessionId);
          if (s) s.title = newTitle;
        } catch (e) {
          titleEl.textContent = currentTitle;
          window.Hermes.toast('重命名失败: ' + e.message, true);
        }
      } else {
        titleEl.textContent = currentTitle;
      }
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); finishRename(true); }
      else if (e.key === 'Escape') { e.preventDefault(); finishRename(false); }
    });
    input.addEventListener('blur', () => {
      setTimeout(() => { if (titleEl.querySelector('.rename-input')) finishRename(true); }, 100);
    });
  }

  // ---- 搜索 ----
  async function searchSessions(keyword) {
    if (!keyword || keyword.length < 2) {
      window.Hermes.state._searchResults = null;
      renderSessionList(window.Hermes.state.sessions);
      return;
    }
    try {
      const { data } = await api('/search?q=' + encodeURIComponent(keyword));
      const results = Array.isArray(data) ? data : [];
      window.Hermes.state._searchResults = results;
      renderSessionList(results);
    } catch (e) {
      if (window.Hermes.dom && window.Hermes.dom.sessionList) {
        window.Hermes.dom.sessionList.innerHTML = '<div style="padding:16px;color:var(--danger)">搜索失败</div>';
      }
    }
  }

  // ---- 选择会话（委托给 SessionManager.enterSession）----
  let _loadSeq = 0;

  async function selectSession(sessionId) {
    const state = window.Hermes.state;

    // 如果已在 chat mode 看同一个会话，忽略
    if (state.viewMode === 'chat' && state.focusedSessionId === sessionId) return;

    // 检查是否有活跃流 → 直接进 chat mode
    if (window.Hermes.hasActiveStream(sessionId)) {
      window.Hermes.enterSession(sessionId, 'chat');
      return;
    }

    // 检查是否有缓存且未过期 → 快速切换
    const cache = state.sessionMessages[sessionId];
    const hasFreshCache = cache && !cache.isStale && cache.messages.length > 0;

    // 显示 loading（如果无缓存）
    const dom = window.Hermes.dom;
    // E#13: 会话切换不闪烁 — 保留旧内容，叠加半透明 loading 层
    if (!hasFreshCache) {
      if (dom.sessionTitle) dom.sessionTitle.textContent = '加载中...';
      if (dom.sessionInfo) dom.sessionInfo.textContent = '';
      // 不直接清空 messageList，而是叠加 loading 指示器
      if (dom.messageList && !dom.messageList.querySelector('.switch-loading')) {
        var loadingEl = document.createElement('div');
        loadingEl.className = 'switch-loading';
        loadingEl.textContent = '加载中...';
        // 插入到最前面
        dom.messageList.insertBefore(loadingEl, dom.messageList.firstChild);
        // 旧内容变暗
        dom.messageList.classList.add('switching');
      }
    }

    // 统一走 enterSession
    try {
      await window.Hermes.enterSession(sessionId, 'view');
    } catch(e) {
      console.error('[selectSession] enterSession failed:', e);
      if (dom.messageList) {
        dom.messageList.classList.remove('switching');
        var sl = dom.messageList.querySelector('.switch-loading');
        if (sl) sl.remove();
      }
    }
  }

  // ---- 删除会话 ----
  async function deleteSession(sessionId) {
    if (!sessionId) return;
    const title = window.Hermes.state.sessions.find(s => s.id === sessionId)?.title || sessionId.substring(0, 16);
    if (!await asyncConfirm('确定删除会话「' + title + '」及其所有分支会话？此操作不可恢复。', '删除会话')) return;

    try {
      await api('/sessions/' + sessionId + '?cascade=true', { method: 'DELETE' });
      // 清理项目的 session 映射（调用后端 API）
      try {
        await api('/projects/unassign', { method: 'POST', body: { session_id: sessionId } });
      } catch (e) {
        console.warn('清理 session 映射失败:', e);
      }
      window.Hermes.toast('会话已删除');
      // cleanupSession 只清了当前 session 的缓存，cascade 删除的子 session 缓存也要清
      // 在 loadSessions 后根据新列表清理
      window.Hermes.cleanupSession(sessionId);
      await loadSessions();
      // 清理已不存在的 session 的缓存
      window.Hermes.purgeStaleCaches();
      window.Hermes.renderQuickStats();
    } catch (e) {
      window.Hermes.toast('删除失败: ' + e.message, true);
    }
  }

  // ---- 导出会话 ----
  async function exportSession(sessionId) {
    if (!sessionId) return;
    try {
      const { data: session } = await api('/sessions/' + sessionId);
      const { data: messages } = await api('/sessions/' + sessionId + '/messages');
      const msgs = Array.isArray(messages) ? messages : [];

      let md = `# ${esc(session.title || 'Session ' + sessionId.substring(0, 16))}\n\n`;
      md += `> 模型: ${session.model || '-'} | 时间: ${fmtTime(session.started_at)} - ${fmtTime(session.ended_at)} | 消息: ${session.message_count || 0}\n\n---\n\n`;

      const turns = groupIntoTurns(msgs);
      turns.forEach(turn => {
        if (turn.type === 'other') return;
        md += `### 👤 用户\n\n${turn.user.content || ''}\n\n`;
        turn.steps.forEach(step => {
          if (step.assistant?.content) {
            md += `### 🤖 助手\n\n${step.assistant.content}\n\n`;
          }
          if (step.toolCalls) {
            step.toolCalls.forEach(tc => {
              md += `**🔧 ${tc.function?.name || tc.name || 'tool'}**\n\n`;
            });
          }
        });
        md += '---\n\n';
      });

      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hermes-${sessionId.substring(0, 12)}-${new Date().toISOString().slice(0, 10)}.md`;
      a.click();
      URL.revokeObjectURL(url);
      window.Hermes.toast('导出成功');
    } catch (e) {
      window.Hermes.toast('导出失败: ' + e.message, true);
    }
  }

  // ---- Exports ----
  window.Hermes.loadSessions = loadSessions;
  window.Hermes.debouncedLoadSessions = debouncedLoadSessions;
  window.Hermes.renderSessionList = renderSessionList;
  window.Hermes.searchSessions = searchSessions;
  window.Hermes.selectSession = selectSession;
  window.Hermes.renderMessages = renderMessages;
  window.Hermes.renderStreamingStepsHTML = renderStreamingStepsHTML;
  window.Hermes.groupIntoTurns = groupIntoTurns;
  window.Hermes.renderTurnStepsHTML = renderTurnStepsHTML;
  window.Hermes.renderSingleTurnHTML = renderSingleTurnHTML;
  window.Hermes.renderToolCard = renderToolCard;
  window.Hermes.renderThinkingBlock = renderThinkingBlock;
  window.Hermes.renderThinkingMargin = renderThinkingMargin;
  window.Hermes.initSessionListEvents = initSessionListEvents;
  window.Hermes.deleteSession = deleteSession;
  window.Hermes.exportSession = exportSession;
  window.Hermes.startRename = startRename;
  window.Hermes.initMessageActions = initMessageActions;
  window.Hermes.deleteMessageRound = deleteMessageRound;
  window.Hermes.asyncConfirm = asyncConfirm;
  window.Hermes.getToolEmoji = getToolEmoji;

})();