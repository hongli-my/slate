/* ============================================================
   Hermes WebUI - Chat Mode Module v3
   
   核心改动（对比 v2）：
   - 使用 SessionManager 统一管理焦点/流/缓存
   - 新对话先创建空会话（消除临时 key 迁移）
   - 流结束后标记 isStale 而非删除缓存
   - sendMessage 直接使用 sid 作为 streamKey
   - /clear 和 /compress 增加持久化提示
   - rename 使用 api() 封装
   ============================================================ */

window.Hermes = window.Hermes || {};

(function() {
  'use strict';

  const H = window.Hermes;
  const $ = window.Hermes.$;
  const $$ = window.Hermes.$$;
  const esc = window.Hermes.esc;
  const api = window.Hermes.api;

  // ---- 数据访问层（委托给 SessionManager）----
  const getMsgs = window.Hermes.getMsgs;
  const setMsgs = window.Hermes.setMsgs;

  function currentMsgs() {
    return getMsgs() || [];
  }

  // ---- 按钮状态切换 (发送 <-> 停止) ----
  function showSendButton() {
    const btnSend = document.getElementById('btn-send');
    const btnStop = document.getElementById('btn-stop');
    if (btnSend) btnSend.style.display = 'inline-flex';
    if (btnStop) btnStop.style.display = 'none';
  }

  function showStopButton() {
    const btnSend = document.getElementById('btn-send');
    const btnStop = document.getElementById('btn-stop');
    if (btnSend) btnSend.style.display = 'none';
    if (btnStop) btnStop.style.display = 'inline-flex';
  }

  // ---- 增量追加新 turn ----

  /** 追加 user bubble + streaming turn 到消息列表末尾（避免全量渲染跳动） */
  function appendNewTurn(container, userMsg, streamingMsg) {
    const fmtTime = window.Hermes.fmtTime;
    const userTime = userMsg.timestamp_fmt || fmtTime(userMsg.timestamp) || fmtTime(Date.now() / 1000);
    const userId = userMsg.id || '';

    // user bubble + streaming agent turn（一个 turn 包含 user + agent）
    const turnHtml = `
      <div class="turn" data-msg-id="${esc(String(userId))}" data-streaming="true">
        <div class="turn-user">
          <div class="turn-user-content">${window.Hermes.renderMarkdown(userMsg.content || '')}</div>
          <div class="turn-avatar user-avatar">U</div>
        </div>
        <div class="turn-time turn-time-user">${esc(userTime)}<span class="turn-actions"><button class="turn-edit-btn" data-msg-id="${esc(String(userId))}" title="编辑重发">✎</button></span></div>
        <div class="turn-agent">
          <div class="turn-avatar agent-avatar">H</div>
          <div class="turn-agent-body">
            <div class="turn-steps">
              ${window.Hermes.renderStreamingStepsHTML(streamingMsg)}
            </div>
          </div>
        </div>
      </div>`;

    container.insertAdjacentHTML('beforeend', turnHtml);
    // P#3: 限定容器范围
    window.Hermes.initCollapsible(container);

    // 滚到底部（用户刚发消息，一定在底部附近）
    container.scrollTop = container.scrollHeight;
  }

  // ---- 统一渲染 ----
  // 每个会话独立的 render debounce timer，避免跨会话切换时误触发渲染
  let _renderTimers = {};
  const RENDER_DEBOUNCE_MS = 80;

  // ---- 流式实时计时器 ----
  // 流式中有 running 的工具步骤时，每秒触发一次渲染让秒数跳动。
  // 无 running 步骤时自动暂停（不浪费 CPU）。
  var _liveTimer = null;
  function _startLiveTimer() {
    if (_liveTimer) return;
    _liveTimer = setInterval(function() {
      var state = window.Hermes.state;
      var sid = state.focusedSessionId;
      if (!sid || !window.Hermes.hasActiveStream(sid)) {
        _stopLiveTimer();
        return;
      }
      // 只在有 running 步骤时重渲染
      var msgs = getMsgs(sid);
      if (!msgs) { _stopLiveTimer(); return; }
      var hasRunning = false;
      for (var i = msgs.length - 1; i >= 0; i--) {
        var m = msgs[i];
        if (m._streaming && m._toolSteps) {
          if (m._toolSteps.some(function(ts) { return ts.running; })) { hasRunning = true; break; }
        }
      }
      if (hasRunning) scheduleRender(sid, false);
    }, 1000);
  }
  function _stopLiveTimer() {
    if (_liveTimer) { clearInterval(_liveTimer); _liveTimer = null; }
  }
  window.Hermes._startLiveTimer = _startLiveTimer;
  window.Hermes._stopLiveTimer = _stopLiveTimer;

  // ---- 从 SSE 事件中兜底提取工具「参数」----
  // 上游不同实现的字段名各异，按优先级尝试常见命名（label 也是常见参数载体）
  function extractToolArgs(evt) {
    if (!evt || typeof evt !== 'object') return null;
    var candidates = [evt.args, evt.arguments, evt.input, evt.params, evt.parameters, evt.label];
    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i];
      if (c == null || c === '') continue;
      if (typeof c === 'object') return c;
      if (typeof c === 'string') {
        var s = c.trim();
        if (s.startsWith('{') || s.startsWith('[')) {
          try { return JSON.parse(s); } catch (e) {}
        }
        return s;
      }
    }
    // 单字段兜底：把常见的单参数字段拼成对象
    var single = {};
    ['command', 'cmd', 'path', 'file', 'file_path', 'query', 'url', 'title', 'name', 'pattern'].forEach(function (k) {
      if (evt[k] != null && typeof evt[k] !== 'object') single[k] = evt[k];
    });
    return Object.keys(single).length > 0 ? single : null;
  }

  // ---- 从 SSE 事件中兜底提取工具「结果」----
  function extractToolResult(evt) {
    if (!evt || typeof evt !== 'object') return null;
    var candidates = [evt.result, evt.output, evt.content, evt.summary, evt.preview, evt.message, evt.text, evt.data];
    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i];
      if (c == null || c === '') continue;
      if (typeof c === 'object') {
        try { return JSON.stringify(c); } catch (e) { return String(c); }
      }
      return c;
    }
    return null;
  }

  // pi: 从 content blocks 提取纯文本
  function _extractText(content) {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) return content.filter(function(b){return b.type==='text';}).map(function(b){return b.text;}).join('');
    return String(content);
  }

  /** 清除指定会话的 render timer（不触发渲染） */
  function _clearRenderTimer(sid) {
    if (_renderTimers[sid]) {
      clearTimeout(_renderTimers[sid]);
      delete _renderTimers[sid];
    }
  }

  /** 清除所有会话的 render timer */
  function clearAllRenderTimers() {
    Object.keys(_renderTimers).forEach(function(k) {
      clearTimeout(_renderTimers[k]);
    });
    _renderTimers = {};
  }

  /** 判断用户是否在底部附近 */
  function isNearBottom(el) {
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  }

  // E#7: 滚动到底部按钮
  var _scrollBtn = null;
  function _getScrollBtn() {
    if (_scrollBtn) return _scrollBtn;
    _scrollBtn = document.createElement('button');
    _scrollBtn.className = 'scroll-bottom-btn';
    _scrollBtn.innerHTML = '↓';
    _scrollBtn.title = '回到底部';
    _scrollBtn.style.display = 'none';
    _scrollBtn.addEventListener('click', function() {
      var el = window.Hermes.dom.chatMessages;
      if (el) el.scrollTop = el.scrollHeight;
      _scrollBtn.style.display = 'none';
    });
    var chatView = document.getElementById('chat-view') || document.querySelector('.chat-main');
    if (chatView) {
      chatView.style.position = 'relative';
      chatView.appendChild(_scrollBtn);
    } else {
      document.body.appendChild(_scrollBtn);
    }
    return _scrollBtn;
  }

  function _updateScrollBtn() {
    var el = window.Hermes.dom.chatMessages;
    if (!el) return;
    var btn = _getScrollBtn();
    if (isNearBottom(el)) {
      btn.style.display = 'none';
    } else {
      btn.style.display = 'flex';
    }
  }

  /**
   * 流结束后：把 DOM 上的 streaming turn 转为最终状态（不全量渲染）
   * - 清除残留的 debounce render timer（关键！否则 timer 触发后会全量渲染+滚屏）
   * - 去掉 data-streaming 属性
   * - 用 renderTurnStepsHTML 重渲染 .turn-steps 内容
   * - 保持滚动位置不变
   */
  function finalizeStreamingTurn(sid) {
    if (!sid) return;

    // 1. 清除此会话残留的 debounce timer，防止其触发全量渲染+滚屏
    _clearRenderTimer(sid);
    // 流式结束，停止实时计时器
    _stopLiveTimer();

    const dom = window.Hermes.dom;
    // 防御：仅当当前焦点会话匹配时才操作 DOM
    if (window.Hermes.state.focusedSessionId !== sid) return;

    const turnEl = dom.chatMessages.querySelector('.turn[data-streaming="true"]');
    if (!turnEl) return;

    const msgs = getMsgs(sid);
    if (!msgs) return;

    // 记住滚动位置
    const prevScrollTop = dom.chatMessages.scrollTop;

    // 用完整渲染逻辑拿到最后一个 turn 的 HTML
    const turns = window.Hermes.groupIntoTurns(msgs);
    if (turns.length === 0) return;
    const lastTurn = turns[turns.length - 1];
    const lastStep = lastTurn.steps[lastTurn.steps.length - 1];
    const lastAssistant = lastStep && (lastStep.assistant || lastStep.streaming);

    // Step 1: 如果有 _toolSteps 但没有 tool_calls（SSE 只发了 progress 事件），
    // 把 _toolSteps 转成标准 tool_calls 格式
    if (lastAssistant && lastAssistant._toolSteps && lastAssistant._toolSteps.length > 0 && !lastAssistant.tool_calls) {
      lastAssistant.tool_calls = lastAssistant._toolSteps.map(function(ts) {
        return {
          id: ts.toolCallId || ('call_' + Math.random().toString(36).substr(2, 9)),
          type: 'function',
          function: { name: ts.name, arguments: ts.args ? JSON.stringify(ts.args) : '{}' }
        };
      });
      // 确保有对应的 tool result 消息（让 renderToolCard 能显示 ✓）
      // 只补缺失的
      var existingToolMsgs = msgs.filter(function(m) { return m.role === 'tool'; });
      lastAssistant._toolSteps.forEach(function(ts) {
        var tcId = ts.toolCallId || null;
        var exists = existingToolMsgs.some(function(m) { return m.tool_call_id === tcId; });
        if (!exists) {
          msgs.push({ role: 'tool', tool_call_id: tcId, content: JSON.stringify({ success: !ts.running, output: '' }) });
        }
      });
    }

    // Step 2: 流式消息同时有 tool_calls 和正文 content 时，把 content 拆分到
    // 单独的 final assistant 消息。否则 renderTurnStepsHTML 会把这条消息归为
    // toolStep（hasTools=true），正文只被当成"📝说明"或直接跳过，不显示为
    // 最终回复块。刷新后 DB 里是分开的两条消息所以正常——此修复让流式结束
    // 后的渲染与刷新后一致。
    if (lastAssistant && lastAssistant.tool_calls && lastAssistant.tool_calls.length > 0 &&
        lastAssistant.content && lastAssistant.content.trim().length > 0) {
      var finalMsg = {
        role: 'assistant',
        content: lastAssistant.content,
        reasoning: lastAssistant.reasoning || '',
        timestamp: lastAssistant.timestamp,
        timestamp_fmt: lastAssistant.timestamp_fmt
      };
      lastAssistant.content = '';
      lastAssistant.reasoning = '';
      // 在 streaming 消息及其后续 tool result 之后插入 final 消息
      var lastAssistantIdx = msgs.lastIndexOf(lastAssistant);
      var insertIdx = lastAssistantIdx + 1;
      while (insertIdx < msgs.length && msgs[insertIdx].role === 'tool') {
        insertIdx++;
      }
      msgs.splice(insertIdx, 0, finalMsg);
    }

    // Step 3: 重新分组并渲染
    const freshTurns = window.Hermes.groupIntoTurns(msgs);
    if (freshTurns.length > 0) {
      const freshTurn = freshTurns[freshTurns.length - 1];
      var stepsHtml = window.Hermes.renderTurnStepsHTML(freshTurn);
      var stepsEl = turnEl.querySelector('.turn-steps');
      if (stepsEl) stepsEl.innerHTML = stepsHtml;
    }

    // 去掉 data-streaming 标记
    turnEl.removeAttribute('data-streaming');

    // 重新绑定折叠/展开
    window.Hermes.initCollapsible(turnEl);

    // 恢复滚动位置（不做任何主动滚动）
    dom.chatMessages.scrollTop = prevScrollTop;

    // 清理流式渲染状态：签名标记 + markdown 稳定段缓存，防止跨 turn 残留。
    // 新对话的流式消息是新对象（_lastSig 自然 undefined），但缓存 'sf'/'tm'
    // 是按 key 复用的，需显式清理避免持有上一轮的大段 HTML 字符串。
    if (lastAssistant) delete lastAssistant._lastSig;
    if (window.Hermes.clearStreamingMdCache) window.Hermes.clearStreamingMdCache();
  }

  /**
   * backgroundReFetch 后：静默更新缓存数据，不触发 DOM 更新
   * DOM 已在 finalizeStreamingTurn 中更新过，不需要再替换
   */
  function refreshLastTurn(sid) {
    // 只更新缓存数据，不触碰 DOM——避免任何滚动
    // 下次用户切换会话再回来时会用新数据全量渲染
  }

  function renderCurrentChat() {
    const state = window.Hermes.state;
    const dom = window.Hermes.dom;
    if (state.viewMode !== 'chat') return;
    const sid = state.focusedSessionId;
    if (!sid) {
      dom.chatMessages.innerHTML = '';
      return;
    }
    const msgs = getMsgs(sid);
    if (!msgs) return;

    const streamingMsg = msgs.find(m => m._streaming);

    if (streamingMsg) {
      // ---- 流式中：尝试增量更新 ----
      const streamingTurnEl = dom.chatMessages.querySelector('.turn[data-streaming="true"]');
      if (streamingTurnEl) {
        const stepsEl = streamingTurnEl.querySelector('.turn-steps');
        if (stepsEl) {
          const atBottom = isNearBottom(dom.chatMessages);

          // ---- 结构签名对比：结构未变时走轻量增量（只更新正文/思考 body）----
          // 最高频的 text_delta / thinking_delta 不改变结构签名，从而避免整块
          // innerHTML 重建（重排闪烁、代码块滚动/选区丢失）。只有工具增减、
          // 思考出现/消失、正文出现等结构性变化才全量重建。
          var _ts = streamingMsg._toolSteps || [];
          var _toolSig = _ts.map(function(s) {
            return (s.running ? 'r' : (s.result !== undefined ? 'd' : 'p')) + '|' + (s.toolCallId || '') + '|' + (s.name || '') + '|' + (s.result != null ? String(s.result).length : 0);
          }).join(',');
          var _sig = [
            'tc=' + _ts.length,
            'ts=' + _toolSig,
            'hr=' + !!(streamingMsg.reasoning && streamingMsg.reasoning.trim()),
            'hc=' + !!(streamingMsg.content && streamingMsg.content.trim()),
            'ap=' + !!(streamingMsg._approval && !streamingMsg._approvalResolved),
            'sa=' + (streamingMsg._subagents ? streamingMsg._subagents.length : 0),
            'ab=' + !!streamingMsg._aborted,
            'er=' + !!streamingMsg._error,
            'us=' + !!(streamingMsg._usage && (streamingMsg._usage.total_tokens || streamingMsg._usage.prompt_tokens)),
            'qu=' + !!(streamingMsg._queue)
          ].join(';');

          if (streamingMsg._lastSig === _sig) {
            // ---- 轻量路径：结构未变，只更新正文 body + 思考 body ----
            var _finalBody = stepsEl.querySelector('.step-final .step-answer');
            if (_finalBody && streamingMsg.content != null) {
              _finalBody.innerHTML = window.Hermes.renderStreamingMarkdown(streamingMsg.content, 'sf');
            }
            var _tmBody = streamingTurnEl.querySelector('.tm-active .tm-body');
            if (_tmBody && streamingMsg.reasoning) {
              var _tmOff = _tmBody.scrollHeight - _tmBody.scrollTop - _tmBody.clientHeight;
              var _tmStick = _tmOff < 24;
              _tmBody.innerHTML = window.Hermes.renderStreamingMarkdown(streamingMsg.reasoning.trim(), 'tm');
              _tmBody.scrollTop = _tmStick ? _tmBody.scrollHeight : Math.max(0, _tmBody.scrollHeight - _tmBody.clientHeight - _tmOff);
            }
            if (atBottom) dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
            _updateScrollBtn();
            return;
          }
          streamingMsg._lastSig = _sig;

          // ---- 结构变化：全量重建 stepsEl ----
          // 保存用户已展开的面板索引（跨越 innerHTML 替换）
          var openPanelIdx = [];
          var oldPanels = stepsEl.querySelectorAll('.ow-panels .ow-ep');
          oldPanels.forEach(function(p, idx) {
            if (p.classList.contains('ow-show')) openPanelIdx.push(idx);
          });

          // 记录时间线相对底部的偏移：贴近底部则跟随，否则保持用户浏览位置
          // 必须在 innerHTML 重建前读取，重建后 scrollTop 会归零
          var oldTl = stepsEl.querySelector('.ow-tl');
          var tlStickToBottom = true;
          var tlBottomOffset = 0;
          if (oldTl) {
            tlBottomOffset = oldTl.scrollHeight - oldTl.scrollTop - oldTl.clientHeight;
            tlStickToBottom = tlBottomOffset < 24;
          }
          stepsEl.innerHTML = window.Hermes.renderStreamingStepsHTML(streamingMsg);

          // 恢复展开的面板
          var newPanels = stepsEl.querySelectorAll('.ow-panels .ow-ep');
          openPanelIdx.forEach(function(idx) {
            if (newPanels[idx]) newPanels[idx].classList.add('ow-show');
          });

          // 时间线跟随：贴近底部时钉到底展示最新 tool，否则保持用户的浏览位置
          var tl = stepsEl.querySelector('.ow-tl');
          if (tl) {
            if (tlStickToBottom) {
              tl.scrollTop = tl.scrollHeight;
            } else {
              tl.scrollTop = Math.max(0, tl.scrollHeight - tl.clientHeight - tlBottomOffset);
            }
          }

          // 思考气泡更新（独立于 .turn-steps 重建：隔离工具重排闪烁）
          // .turn-margin 在 .turn-agent-body 外侧，不会被上面的 innerHTML 重建碰到。
          // 增量策略：首次插入完整骨架，后续只替换 .tm-body 内容（不 outerHTML 重建），
          // 避免骨架重建导致滚动位置丢失/重排闪烁。
          var marginEl = streamingTurnEl.querySelector('.turn-margin');
          var tmOldBody = marginEl ? marginEl.querySelector('.tm-active .tm-body') : null;
          var tmStick = true, tmOff = 0;
          if (tmOldBody) {
            tmOff = tmOldBody.scrollHeight - tmOldBody.scrollTop - tmOldBody.clientHeight;
            tmStick = tmOff < 24;
          }
          var newMarginHtml = window.Hermes.renderThinkingMargin({ steps: [{ streaming: streamingMsg }] }, true);
          if (newMarginHtml) {
            if (!marginEl) {
              // 首次出现思考：插入完整骨架
              var agentBody = streamingTurnEl.querySelector('.turn-agent-body');
              if (agentBody) agentBody.insertAdjacentHTML('afterend', newMarginHtml);
            } else if (tmOldBody) {
              // 骨架已存在：只更新 body 内容
              tmOldBody.innerHTML = window.Hermes.renderStreamingMarkdown((streamingMsg.reasoning || '').trim(), 'tm');
            }
          } else if (marginEl) {
            // 思考结束 → 移除气泡
            marginEl.remove();
          }
          // 钉底：进行中的思考流贴近底部时跟随
          var tmNewBody = streamingTurnEl.querySelector('.tm-active .tm-body');
          if (tmNewBody) {
            tmNewBody.scrollTop = tmStick ? tmNewBody.scrollHeight : Math.max(0, tmNewBody.scrollHeight - tmNewBody.clientHeight - tmOff);
          }

          if (atBottom) dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
          _updateScrollBtn();
          return;
        }
      }
      // 无已有 streaming DOM（首次），做全量渲染
      const atBottom = isNearBottom(dom.chatMessages);
      window.Hermes.renderMessages(msgs, dom.chatMessages);
      if (atBottom) dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
      _updateScrollBtn();
      return;
    }

    // ---- 非流式：全量渲染 ----
    const atBottom = isNearBottom(dom.chatMessages);
    window.Hermes.renderMessages(msgs, dom.chatMessages);
    if (atBottom) dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
    _updateScrollBtn();
  }

  // sid = 事件所属会话（非当前焦点）。后台流事件传入自己的 sid，
  // 若与 focusedSessionId 不符则直接 return —— 后台流只写数据不渲染。
  function scheduleRender(sid, immediate) {
    if (!sid) return;
    // 焦点隔离：非焦点会话的流事件不触发 DOM 渲染
    if (window.Hermes.state.focusedSessionId !== sid) return;

    if (immediate) {
      _clearRenderTimer(sid);
      renderCurrentChat();
    } else {
      if (_renderTimers[sid]) return;
      _renderTimers[sid] = setTimeout(function() {
        delete _renderTimers[sid];
        renderCurrentChat();
      }, RENDER_DEBOUNCE_MS);
    }
  }

  // ---- 输入历史 (E#11) ----
  var _inputHistory = [];
  var _historyIdx = -1;
  var MAX_HISTORY = 50;

  function pushInputHistory(text) {
    if (!text || !text.trim()) return;
    // 去重：如果最近一条和当前相同，不重复添加
    if (_inputHistory.length > 0 && _inputHistory[_inputHistory.length - 1] === text) return;
    _inputHistory.push(text);
    if (_inputHistory.length > MAX_HISTORY) _inputHistory.shift();
  }

  function getPrevInputHistory() {
    if (_inputHistory.length === 0) return null;
    if (_historyIdx < 0) _historyIdx = _inputHistory.length;
    _historyIdx--;
    if (_historyIdx < 0) {
      _historyIdx = 0;
      return _inputHistory[0];
    }
    return _inputHistory[_historyIdx] || null;
  }

  function getNextInputHistory() {
    if (_inputHistory.length === 0 || _historyIdx < 0) return null;
    _historyIdx++;
    if (_historyIdx >= _inputHistory.length) {
      _historyIdx = -1;
      return '';
    }
    return _inputHistory[_historyIdx] || null;
  }

  // ---- 图片文件处理 (E#9/E#10) ----
  function handleImageFile(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var dataUrl = e.target.result;
      var fileName = file.name || 'pasted-image';
      var sizeKB = Math.round(file.size / 1024);
      var marker = '[图片: ' + fileName + ' (' + sizeKB + 'KB)]\n' + dataUrl.substring(0, 100) + '...';
      // 将图片引用插入输入框
      var input = window.Hermes.dom.chatInput;
      var cur = input.value;
      input.value = (cur ? cur + '\n' : '') + '请分析这张图片:\n' + marker;
      input.dispatchEvent(new Event('input'));
      window.Hermes.toast('图片已附加: ' + fileName);
    };
    reader.readAsDataURL(file);
  }

  // ---- 斜杠命令系统 ----
  const slashCommands = [
    { name: '/help',      icon: '❓', group: '基础', desc: '显示所有可用命令' },
    { name: '/clear',     icon: '🧹', group: '基础', desc: '清空当前对话消息（仅本地，刷新后恢复）' },
    { name: '/new',       icon: '✨', group: '基础', desc: '开始新对话' },
    { name: '/skills',    icon: '🎯', group: '基础', desc: '浏览 Skills 技能列表' },
    { name: '/model',     icon: '🤖', group: '基础', desc: '查看或切换模型', hasArg: true },
    { name: '/skill',     icon: '⚡', group: '技能', desc: '调用指定技能 (如 /skill ascii-art)', hasArg: true },
    { name: '/sessions',  icon: '📋', group: '会话', desc: '查看历史会话列表' },
    { name: '/history',   icon: '📜', group: '会话', desc: '查看当前会话完整历史' },
    { name: '/export',    icon: '💾', group: '会话', desc: '导出当前对话为 Markdown' },
    { name: '/compress',  icon: '🗜️', group: '会话', desc: '压缩上下文（调用模型生成摘要，持久化到 session）' },
  ];

  let slashState = { visible: false, items: [], activeIndex: -1 };

  function getSlashQuery() {
    const dom = window.Hermes.dom;
    const val = dom.chatInput.value;
    const pos = dom.chatInput.selectionStart;
    const before = val.substring(0, pos);
    const match = before.match(/(\/\S*)$/);
    return match ? { query: match[1], start: match.index } : null;
  }

  function filterSlashCommands(query) {
    const q = query.toLowerCase();
    if (!q || q === '/') return slashCommands;
    return slashCommands.filter(c => c.name.toLowerCase().startsWith(q));
  }

  let skillNamesCache = null;
  async function getSkillNames() {
    if (skillNamesCache) return skillNamesCache;
    try {
      const res = await api('/skills/builtin');
      if (res.ok && res.skills) {
        skillNamesCache = res.skills.map(s => s.dir_name);
      }
    } catch(e) {}
    return skillNamesCache || [];
  }

  function renderSlashMenu(items, query) {
    const dom = window.Hermes.dom;
    slashState.items = items;
    slashState.activeIndex = -1;
    if (items.length === 0) {
      dom.slashMenu.innerHTML = '<div class="slash-menu-empty">没有匹配的命令</div>';
      dom.slashMenu.style.display = 'block';
      slashState.visible = true;
      return;
    }
    const groups = {};
    items.forEach(item => {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    });
    let html = '';
    for (const [group, cmds] of Object.entries(groups)) {
      html += `<div class="slash-menu-group">${esc(group)}</div>`;
      cmds.forEach(cmd => {
        let nameHtml = esc(cmd.name);
        if (query && query.length > 1) {
          const q = esc(query);
          nameHtml = nameHtml.replace(q, `<span class="slash-highlight">${q}</span>`);
        }
        html += `<div class="slash-menu-item" data-cmd="${esc(cmd.name)}">
          <div class="slash-menu-item-icon">${cmd.icon}</div>
          <div class="slash-menu-item-body">
            <div class="slash-menu-item-name">${nameHtml}</div>
            <div class="slash-menu-item-desc">${esc(cmd.desc)}</div>
          </div>
        </div>`;
      });
    }
    dom.slashMenu.innerHTML = html;
    dom.slashMenu.style.display = 'block';
    slashState.visible = true;
    dom.slashMenu.querySelectorAll('.slash-menu-item').forEach(el => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        executeSlashCommand(el.dataset.cmd);
      });
    });
  }

  function hideSlashMenu() {
    window.Hermes.dom.slashMenu.style.display = 'none';
    slashState.visible = false;
    slashState.activeIndex = -1;
  }

  function slashNavigate(dir) {
    const dom = window.Hermes.dom;
    const items = dom.slashMenu.querySelectorAll('.slash-menu-item');
    if (items.length === 0) return;
    items.forEach(i => i.classList.remove('active'));
    slashState.activeIndex += dir;
    if (slashState.activeIndex < 0) slashState.activeIndex = items.length - 1;
    if (slashState.activeIndex >= items.length) slashState.activeIndex = 0;
    const active = items[slashState.activeIndex];
    active.classList.add('active');
    active.scrollIntoView({ block: 'nearest' });
  }

  function slashSelect() {
    const dom = window.Hermes.dom;
    const items = dom.slashMenu.querySelectorAll('.slash-menu-item');
    if (slashState.activeIndex >= 0 && slashState.activeIndex < items.length) {
      executeSlashCommand(items[slashState.activeIndex].dataset.cmd);
    }
  }

  async function executeSlashCommand(cmd) {
    const dom = window.Hermes.dom;
    const state = window.Hermes.state;
    hideSlashMenu();
    dom.chatInput.value = '';
    dom.chatInput.focus({ preventScroll: true });
    switch (cmd) {
      case '/help': showSlashHelp(); break;
      case '/clear': {
        const sid = state.focusedSessionId;
        if (sid) {
          setMsgs(sid, []);
          addSystemMessage('🧹 已清空本地消息（仅本地生效，刷新页面后恢复原始消息）');
        }
        renderCurrentChat();
        break;
      }
      case '/new': window.Hermes.createNewChat(); break;
      case '/skills': window.Hermes.openSkillsView(); break;
      case '/model': await showModelInfo(); break;
      case '/sessions': showSessionsList(); break;
      case '/history': showCurrentHistory(); break;
      case '/export': exportChat(); break;
      case '/compress': await compressChat(); break;
      case '/skill': addSystemMessage('用法: /skill <技能名>  例如: /skill ascii-art'); break;
    }
  }

  async function handleSkillArg(skillName) {
    const dom = window.Hermes.dom;
    hideSlashMenu();
    const msg = `[系统: 用户调用了技能 ${skillName}] 请使用 ${skillName} 技能来处理后续请求。`;
    dom.chatInput.value = msg;
    sendMessage();
  }

  function addSystemMessage(text, html) {
    const state = window.Hermes.state;
    const sid = state.focusedSessionId;
    const sysMsg = { role: 'system', content: html || text, _isSystemDisplay: true };
    const msgs = sid ? getMsgs(sid) : null;
    if (msgs) {
      msgs.push(sysMsg);
      scheduleRender(sid, true);
    }
  }

  function showSlashHelp() {
    let html = '<h3>⚡ 斜杠命令</h3>';
    const groups = {};
    slashCommands.forEach(c => { if (!groups[c.group]) groups[c.group] = []; groups[c.group].push(c); });
    for (const [group, cmds] of Object.entries(groups)) {
      html += `<p><strong>${esc(group)}</strong></p><ul>`;
      cmds.forEach(c => { html += `<li>${c.icon} <code>${esc(c.name)}</code> — ${esc(c.desc)}</li>`; });
      html += '</ul>';
    }
    html += '<p><em>输入 <code>/</code> 开始搜索命令，↑↓ 选择，Enter 执行</em></p>';
    addSystemMessage(null, html);
  }

  async function showModelInfo() {
    try {
      const res = await api('/gateway_status');
      if (res.ok && res.model) addSystemMessage(null, `<h3>🤖 当前模型</h3><p><code>${esc(res.model)}</code></p>`);
      else addSystemMessage('无法获取模型信息');
    } catch(e) { addSystemMessage('获取模型信息失败: ' + e.message); }
  }

  function showSessionsList() {
    const state = window.Hermes.state;
    const items = state.sessions;
    if (!items || items.length === 0) { addSystemMessage('暂无历史会话'); return; }
    let html = '<h3>📋 历史会话</h3><ol>';
    items.slice(0, 20).forEach((s, i) => {
      const title = s.title || 'Session ' + (s.id || '').substring(0, 16);
      html += `<li><a href="#/s/${esc(s.id)}/chat" class="sys-session-link" data-sid="${esc(s.id)}">${esc(title)}</a></li>`;
    });
    html += '</ol>';
    addSystemMessage(null, html);
  }

  function showCurrentHistory() {
    const state = window.Hermes.state;
    const sid = state.focusedSessionId;
    if (!sid) { addSystemMessage('当前没有活跃会话'); return; }
    const msgs = currentMsgs();
    const count = msgs.length;
    const userCount = msgs.filter(m => m.role === 'user').length;
    const asstCount = msgs.filter(m => m.role === 'assistant').length;
    addSystemMessage(null, `<h3>📜 当前会话</h3><ul><li>会话 ID: <code>${esc(sid.substring(0, 20))}</code></li><li>总消息: <strong>${count}</strong> (用户 ${userCount} / 助手 ${asstCount})</li></ul>`);
  }

  function exportChat() {
    const msgs = currentMsgs();
    if (msgs.length === 0) { addSystemMessage('当前对话为空，无法导出'); return; }
    let md = `# Hermes 对话导出\n\n`;
    msgs.forEach(m => {
      const role = m.role === 'user' ? '👤 用户' : '🤖 助手';
      md += `### ${role}\n\n${m.content}\n\n---\n\n`;
    });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `hermes-chat-${Date.now()}.md`;
    a.click(); URL.revokeObjectURL(url);
    addSystemMessage(null, `<h3>💾 导出成功</h3><p>已导出 <strong>${msgs.length}</strong> 条消息为 Markdown 文件</p>`);
  }

  // ---- 上下文压缩辅助 ----
  // token 数格式化：86200 → "86.2K"，1200000 → "1.2M"
  function _fmtK(n) {
    if (!n || n <= 0) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
  }

  // 往消息流插入一条压缩结果 system 消息（供 SSE compaction_end 和手动 /compact 共用）
  function _pushCompactionResult(msgs, reason, result, aborted, errorMessage) {
    if (aborted || errorMessage || !result) {
      msgs.push({ role: 'system', content: '✂️ 上下文压缩失败：' + (errorMessage || (aborted ? '已取消' : '未知原因')), _isCompaction: true });
      return;
    }
    var before = result.tokensBefore || 0;
    var after = result.estimatedTokensAfter || 0;
    var saved = before - after;
    var savedPct = before > 0 ? Math.round((saved / before) * 100) : 0;
    var head = '✂️ 上下文已压缩 ' + _fmtK(before) + ' → ' + _fmtK(after) + ' tokens（节省 ' + savedPct + '%' + (reason ? '，' + reason : '') + '）';
    var html = '<div class="compaction-result">'
      + '<div class="compaction-head">' + esc(head) + '</div>'
      + (result.summary ? '<details class="compaction-summary"><summary>查看压缩摘要</summary><div class="compaction-summary-body">' + esc(result.summary) + '</div></details>' : '')
      + '</div>';
    msgs.push({ role: 'system', content: head, _isCompaction: true, _compactionHtml: html });
  }

  // 手动触发上下文压缩（/compress 命令）
  // 调 POST /compact → pi-bridge 调 session.compact() → SDK 调 LLM 生成摘要
  // 手动压缩时 agent 空闲无 SSE 连接，事件不经 SSE，故用 HTTP 响应的 result 展示
  async function compressChat() {
    var state = window.Hermes.state;
    var sid = state.focusedSessionId;
    if (!sid) { addSystemMessage('当前没有活跃会话'); return; }
    if (window.Hermes.hasActiveStream && window.Hermes.hasActiveStream(sid)) {
      addSystemMessage('当前有正在进行的回复，请等待完成后再压缩');
      return;
    }
    addSystemMessage(null, '<h3>🗜️ 正在压缩上下文…</h3><p>正在调用模型生成摘要，请稍候</p>');
    try {
      var res = await api('/compact', { method: 'POST', body: { session_id: sid } });
      // 标记刚压缩过：阻止 backgroundReFetch 用后端精简版覆盖前端完整历史
      var _cCache = state.sessionMessages[sid];
      if (_cCache) _cCache._compactedAt = Date.now();
      // 成功：用返回的 result 插入压缩结果（与 SSE compaction_end 统一格式）
      var msgs = getMsgs(sid);
      if (msgs && res.result) {
        _pushCompactionResult(msgs, 'manual', res.result, false, null);
        scheduleRender(sid, true);
      }
      // 压缩后 token 骤降，强制刷新用量条
      if (window.Hermes.loadContextInfo) {
        setTimeout(function() { window.Hermes.loadContextInfo(sid, true); }, 300);
      }
    } catch (e) {
      addSystemMessage('压缩失败：' + e.message);
    }
  }

  // ---- 对话模式 ----

  function updateChatUIState() {
    const state = window.Hermes.state;
    const dom = window.Hermes.dom;
    if (state.viewMode !== 'chat') return;
    const sid = state.focusedSessionId;
    const hasActiveStream = sid ? window.Hermes.hasActiveStream(sid) : false;
    if (hasActiveStream) {
      dom.chatInput.disabled = true;
      showStopButton();
    } else {
      dom.chatInput.disabled = false;
      showSendButton();
    }
  }

  // ---- 进入/退出聊天模式 ----

  function enterChatMode(sessionId) {
    // 委托给 SessionManager.enterSession
    window.Hermes.enterSession(sessionId, 'chat');
  }

  function exitChatMode() {
    const state = window.Hermes.state;
    const sid = state.focusedSessionId;

    // 清除当前会话的 render timer，防止延迟触发误渲染到新会话
    if (sid) _clearRenderTimer(sid);

    if (sid) {
      // 退回 session view
      window.Hermes.enterSession(sid, 'view');
    } else {
      state.viewMode = 'list';
      state.focusedSessionId = null;
      window.Hermes.showView('welcome');
      $$('.session-item').forEach(el => el.classList.remove('active'));
      window.Hermes.updateStreamingHints();
    }
  }

  // ---- 中止流 ----
  function abortCurrentStream(sessionId) {
    const state = window.Hermes.state;
    const sid = sessionId || state.focusedSessionId;
    if (!sid) return;
    window.Hermes.abortStream(sid);

    // 如果当前正在看这个会话，更新 UI
    if (state.focusedSessionId === sid) {
      if (state.viewMode === 'chat') {
        renderCurrentChat();
      }
      updateChatUIState();
    }
  }

  // ---- 发送消息 ----
  async function sendMessage() {
    const state = window.Hermes.state;
    const dom = window.Hermes.dom;
    const sid = state.focusedSessionId;

    // 必须有 sid（新对话已经通过 createNewChat 创建）
    if (!sid) {
      window.Hermes.createNewChat();
      return;
    }

    // 检查是否已有活跃流
    if (window.Hermes.hasActiveStream(sid)) return;

    const input = dom.chatInput.value.trim();
    if (!input) return;

    // 处理斜杠命令
    if (input.startsWith('/')) {
      const parts = input.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const arg = parts.slice(1).join(' ');
      if (cmd === '/skill' && arg) { await handleSkillArg(arg); return; }
      const matched = slashCommands.find(c => c.name === cmd);
      if (matched) { await executeSlashCommand(cmd); return; }
      if (cmd.startsWith('/') && !cmd.startsWith('//')) {
        addSystemMessage(`未知命令: ${cmd}，输入 /help 查看可用命令`);
        dom.chatInput.value = '';
        return;
      }
    }

    dom.chatInput.value = '';
    dom.chatInput.style.height = 'auto';
    dom.chatInput.disabled = true;
    showStopButton();

    // 清除上一轮失败可能残留的重连按钮，避免"新请求已成功却仍显示重连"的误导
    document.querySelectorAll('.reconnect-btn').forEach(function(b) { b.remove(); });

    // E#11: 记录输入历史
    pushInputHistory(input);

    const abortController = new AbortController();

    // 1. user 消息写入 sessionMessages
    const userMsg = { role: 'user', content: input };
    const msgs = getMsgs(sid);
    if (msgs) msgs.push(userMsg);

    // 2. 创建 _streaming assistant 消息
    const streamAssistantMsg = {
      role: 'assistant',
      content: '',
      reasoning: '',
      _streaming: true,
      _toolSteps: [],
      _toolCallCount: 0,
      _stepNum: 0,
    };
    if (msgs) msgs.push(streamAssistantMsg);

    // 3. 构建 streamState（key 直接用 sid，不再用临时 key）
    const streamState = {
      abortController,
      assistantMsg: streamAssistantMsg,
      finished: false,
      sessionId: sid,
      userInput: input,
    };
    state.activeStreams[sid] = streamState;

    // 4. 增量追加新 turn（避免全量 renderMessages 导致跳动）
    appendNewTurn(dom.chatMessages, userMsg, streamAssistantMsg);
    window.Hermes.updateStreamingHints();

    // 有 session_id 时，只发当前消息
    const messagesToSend = [{ role: 'user', content: input }];

    try {
      const res = await fetch(window.Hermes.API_BASE + '/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, session_id: sid }),
        signal: abortController.signal,
      });
      console.log('[sendMessage] SSE fetch →', res.status);

      if (!res.ok) {
        const errText = await res.text();
        // 409 busy：后端仍在跑上一轮（常见于刷新页面后前端丢失流状态）。
        // 自动中止后端那一轮并重发一次（此时新消息尚未被处理，重发不会产生重复 turn）。
        if (res.status === 409 && !streamState._retriedAfterBusy) {
          streamState._retriedAfterBusy = true;
          try {
            await fetch(window.Hermes.API_BASE + '/abort', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session_id: sid }),
            });
          } catch {}
          await new Promise(function(r) { setTimeout(r, 400); });
          // 清理占位 assistant 消息与流状态，恢复输入后重发
          var _msgs = getMsgs(sid);
          if (_msgs) {
            var _i = _msgs.indexOf(streamAssistantMsg);
            if (_i >= 0) _msgs.splice(_i, 1);
          }
          delete state.activeStreams[sid];
          dom.chatInput.value = streamState.userInput;
          dom.chatInput.disabled = false;
          H.sendMessage();
          return;
        }
        const currentMsgs = getMsgs(sid);
        if (currentMsgs) {
          const idx = currentMsgs.indexOf(streamAssistantMsg);
          if (idx >= 0) currentMsgs.splice(idx, 1);
          currentMsgs.push({ role: 'system', content: 'API 错误: ' + errText, _isSystemDisplay: true });
        }
        delete state.activeStreams[sid];
        if (state.focusedSessionId === sid && state.viewMode === 'chat') {
          renderCurrentChat();
          updateChatUIState();
          dom.chatInput.focus({ preventScroll: true });
        }
        return;
      }

      // 使用 eventsource-parser 解析 SSE 流
      const parser = EventSourceParser.createParser({
        onEvent(event) {
          const eventType = event.event || '';
          const jsonStr = event.data;
          if (jsonStr === '[DONE]') return;
          try {
            const evt = JSON.parse(jsonStr);
            const _t = evt.type;
            // P3: abort 后 in-flight 事件防御——不往已中止的消息继续写数据
            if (streamAssistantMsg._aborted) return;
            // ---- pi AgentSession 事件处理（透传协议）----
            if (_t === 'tool_execution_start') {
              streamAssistantMsg._stepNum++;
              streamAssistantMsg._toolCallCount = (streamAssistantMsg._toolCallCount || 0) + 1;
              streamAssistantMsg._toolSteps.push({
                name: evt.toolName || 'unknown',
                emoji: '⚡',
                running: true,
                toolCallId: evt.toolCallId || null,
                args: evt.args || null,
                startTime: Date.now(),
              });
              _startLiveTimer();
              scheduleRender(sid, false);
              return;
            }
            if (_t === 'tool_execution_update') {
              var _step = (streamAssistantMsg._toolSteps || []).find(function(s) { return s.toolCallId === evt.toolCallId; });
              if (_step && evt.partialResult) _step.result = _extractText(evt.partialResult.content);
              scheduleRender(sid, false);
              return;
            }
            if (_t === 'tool_execution_end') {
              var _step2 = (streamAssistantMsg._toolSteps || []).find(function(s) { return s.toolCallId === evt.toolCallId; });
              if (_step2) {
                _step2.running = false;
                _step2.endTime = Date.now();
                if (evt.result) _step2.result = _extractText(evt.result.content);
                if (evt.isError) _step2.error = true;
              }
              var _curMsgs = getMsgs(sid);
              if (_curMsgs && evt.result) {
                _curMsgs.push({ role: 'tool', tool_call_id: evt.toolCallId, content: _extractText(evt.result.content) });
              }
              scheduleRender(sid, false);
              return;
            }
            if (_t === 'message_update') {
              var _ae = evt.assistantMessageEvent;
              if (!_ae) return;
              if (_ae.type === 'text_delta') {
                (streamAssistantMsg._toolSteps || []).forEach(function(s) { s.running = false; });
                streamAssistantMsg.content += (_ae.delta || '');
                scheduleRender(sid, false);
              } else if (_ae.type === 'thinking_delta') {
                streamAssistantMsg.reasoning += (_ae.delta || '');
                scheduleRender(sid, false);
              } else if (_ae.type === 'toolcall_end' && _ae.toolCall) {
                streamAssistantMsg.tool_calls = streamAssistantMsg.tool_calls || [];
                streamAssistantMsg.tool_calls.push({
                  id: _ae.toolCall.id,
                  type: 'function',
                  function: { name: _ae.toolCall.name, arguments: typeof _ae.toolCall.arguments === 'string' ? _ae.toolCall.arguments : JSON.stringify(_ae.toolCall.arguments || {}) }
                });
              }
              return;
            }
            if (_t === 'message_end' && evt.message && evt.message.role === 'assistant') {
              if (evt.message.content) streamAssistantMsg.content = evt.message.content;
              if (evt.message.reasoning) streamAssistantMsg.reasoning = evt.message.reasoning;
              if (evt.message.tool_calls && evt.message.tool_calls.length) streamAssistantMsg.tool_calls = evt.message.tool_calls;
              if (evt.message._usage) streamAssistantMsg._usage = evt.message._usage;
              return;
            }
            if (_t === 'extension_ui_request') {
              streamAssistantMsg._approval = evt;
              scheduleRender(sid, true);
              return;
            }
            if (_t === 'queue_update') {
              streamAssistantMsg._queue = evt;
              scheduleRender(sid, false);
              return;
            }
            if (_t === 'error') {
              streamAssistantMsg._error = evt.error || 'unknown error';
              scheduleRender(sid, false);
              return;
            }
            if (_t === 'agent_settled') {
              // 标记 agent 已正常完成。即便后续 chunked 流被异常截断
              // （ERR_INCOMPLETE_CHUNKED_ENCODING / network error），内容也是完整的，
              // catch 时走正常收尾而非误报"重连"
              streamState._settledReceived = true;
            }
            // ---- 上下文压缩事件（自动压缩 threshold/overflow 经 SSE 透传）----
            if (_t === 'compaction_start') {
              var _cmsgs = getMsgs(sid);
              if (_cmsgs) {
                _cmsgs.push({ role: 'system', content: '✂️ 正在压缩上下文…（' + (evt.reason || '') + '）', _isCompaction: true, _compactionPending: true });
                scheduleRender(sid, true);
              }
              return;
            }
            if (_t === 'compaction_end') {
              var _cmsgs2 = getMsgs(sid);
              if (_cmsgs2) {
                // 移除 compaction_start 插入的 pending 占位
                for (var _j = _cmsgs2.length - 1; _j >= 0; _j--) {
                  if (_cmsgs2[_j]._compactionPending) { _cmsgs2.splice(_j, 1); break; }
                }
                _pushCompactionResult(_cmsgs2, evt.reason, evt.result, evt.aborted, evt.errorMessage);
                scheduleRender(sid, true);
              }
              // 标记刚压缩过：阻止 backgroundReFetch 用后端精简版 messages 覆盖前端完整历史
              // （压缩后 session.messages 被替换为 [system]+[summary]+[保留消息]，比前端少）
              var _cache = state.sessionMessages[sid];
              if (_cache) _cache._compactedAt = Date.now();
              // 压缩后 token 骤降，强制刷新用量条（绕过 5s 防抖）
              if (window.Hermes.loadContextInfo) {
                setTimeout(function() { window.Hermes.loadContextInfo(sid, true); }, 300);
              }
              return;
            }
            // agent_start / turn_* / agent_end 等无需特殊处理
            // ---- 以下为旧 Hermes/OpenAI 兼容逻辑（pi 事件已 return，基本不会走到）----
            if (eventType === 'hermes.tool.progress') {
              if (evt.status === 'completed') {
                // Mark the matching running step as done
                const steps = streamAssistantMsg._toolSteps || [];
                let matched = null;
                if (evt.toolCallId) {
                  for (let i = steps.length - 1; i >= 0; i--) {
                    if (steps[i].running && steps[i].toolCallId === evt.toolCallId) { matched = steps[i]; break; }
                  }
                }
                // Fallback: if no id match, use last running step
                if (!matched) {
                  for (let i = steps.length - 1; i >= 0; i--) {
                    if (steps[i].running) { matched = steps[i]; break; }
                  }
                }
                if (matched) {
                  matched.running = false;
                  matched.endTime = Date.now();
                  // 兜底从 completed 事件提取结果
                  var r = extractToolResult(evt);
                  if (r != null && matched.result === undefined) matched.result = r;
                  // 兜底补参数（部分上游把参数放在 completed 事件里）
                  if (matched.args === undefined) {
                    var ca = extractToolArgs(evt);
                    if (ca != null) matched.args = ca;
                  }
                }
              } else {
                // New tool starting
                const toolName = evt.tool || evt.label || 'unknown';
                const emoji = evt.emoji || '⚡';
                streamAssistantMsg._stepNum++;
                streamAssistantMsg._toolCallCount = (streamAssistantMsg._toolCallCount || 0) + 1;
                var newStep = { name: toolName, emoji: emoji, running: true, toolCallId: evt.toolCallId || null, startTime: Date.now() };
                // 兜底从 progress 事件提取参数
                var sa = extractToolArgs(evt);
                if (sa != null) newStep.args = sa;
                streamAssistantMsg._toolSteps.push(newStep);
                _startLiveTimer();
              }
              scheduleRender(sid, false);
              return;
            }
            // Hermes 扩展事件：完整的 tool call 结构
            if (eventType === 'hermes.tool.call') {
              streamAssistantMsg.tool_calls = streamAssistantMsg.tool_calls || [];
              streamAssistantMsg.tool_calls.push(evt);
              // E#17: 同步更新对应 _toolSteps 的参数信息（优先按 id 匹配，回退到最后一个 running）
              if (streamAssistantMsg._toolSteps && streamAssistantMsg._toolSteps.length > 0) {
                var cid = evt.id || evt.call_id || evt.toolCallId || null;
                var targetStep = null;
                if (cid) {
                  for (var ci = streamAssistantMsg._toolSteps.length - 1; ci >= 0; ci--) {
                    if (streamAssistantMsg._toolSteps[ci].toolCallId === cid) { targetStep = streamAssistantMsg._toolSteps[ci]; break; }
                  }
                }
                if (!targetStep) {
                  for (var cj = streamAssistantMsg._toolSteps.length - 1; cj >= 0; cj--) {
                    if (streamAssistantMsg._toolSteps[cj].running) { targetStep = streamAssistantMsg._toolSteps[cj]; break; }
                  }
                }
                if (targetStep) {
                  var fnName = evt.function && evt.function.name;
                  var fnArgs = evt.function && evt.function.arguments;
                  if (fnName && (!targetStep.name || targetStep.name === 'unknown')) targetStep.name = fnName;
                  if (!targetStep.toolCallId && cid) targetStep.toolCallId = cid;
                  if (fnArgs) {
                    try { targetStep.args = JSON.parse(fnArgs); } catch(e) { targetStep.args = fnArgs; }
                  } else if (targetStep.args === undefined) {
                    var fa = extractToolArgs(evt);
                    if (fa != null) targetStep.args = fa;
                  }
                }
              }
              scheduleRender(sid, false);
              return;
            }
            // Hermes 扩展事件：tool result
            if (eventType === 'hermes.tool.result') {
              const currentMsgs = getMsgs(sid);
              if (currentMsgs) {
                currentMsgs.push({ role: 'tool', ...evt });
              }
              // 将结果关联到对应的 _toolStep，用于流式时间线内联展示（无需展开）
              if (streamAssistantMsg._toolSteps && streamAssistantMsg._toolSteps.length > 0) {
                var rid = evt.tool_call_id || evt.toolCallId || null;
                var tstep = null;
                if (rid) {
                  tstep = streamAssistantMsg._toolSteps.find(function(s) { return s.toolCallId === rid; });
                }
                if (!tstep) {
                  // fallback：最后一个尚无结果的步骤
                  for (var ri = streamAssistantMsg._toolSteps.length - 1; ri >= 0; ri--) {
                    if (streamAssistantMsg._toolSteps[ri].result === undefined) { tstep = streamAssistantMsg._toolSteps[ri]; break; }
                  }
                }
                if (tstep) {
                  var res = extractToolResult(evt);
                  tstep.result = res != null ? res : (evt.content !== undefined ? evt.content : evt);
                  tstep.running = false;
                  tstep.endTime = Date.now();
                }
              }
              scheduleRender(sid, false);
              return;
            }
            // Hermes 扩展事件：usage
            if (eventType === 'hermes.usage') {
              streamAssistantMsg._usage = evt;
              return;
            }
            // Hermes 扩展事件：审批请求（危险命令需要用户确认）
            if (eventType === 'approval.request') {
              streamAssistantMsg._approval = evt;
              scheduleRender(sid, true);
              return;
            }
            // E#21: subagent 过程可见
            if (eventType === 'hermes.subagent.start') {
              streamAssistantMsg._subagents = streamAssistantMsg._subagents || [];
              streamAssistantMsg._subagents.push({
                id: evt.id || evt.task_id || ('sub-' + Date.now()),
                goal: evt.goal || evt.task || '',
                status: 'running',
                startedAt: Date.now(),
                summary: ''
              });
              scheduleRender(sid, false);
              return;
            }
            if (eventType === 'hermes.subagent.progress') {
              var subs = streamAssistantMsg._subagents || [];
              var sub = subs.find(function(s) { return s.id === (evt.id || evt.task_id); });
              if (sub) {
                if (evt.message) sub.summary = evt.message;
                if (evt.status) sub.status = evt.status;
              }
              scheduleRender(sid, false);
              return;
            }
            if (eventType === 'hermes.subagent.complete') {
              var subs2 = streamAssistantMsg._subagents || [];
              var sub2 = subs2.find(function(s) { return s.id === (evt.id || evt.task_id); });
              if (sub2) {
                sub2.status = evt.success === false ? 'failed' : 'done';
                sub2.summary = evt.summary || evt.result || sub2.summary;
                sub2.completedAt = Date.now();
              }
              scheduleRender(sid, false);
              return;
            }
            // 标准 OpenAI 事件
            const choice = evt.choices?.[0];
            
            // 标准 OpenAI tool_calls delta（工具名/参数增量流）
            if (choice?.delta?.tool_calls) {
              streamAssistantMsg.tool_calls = streamAssistantMsg.tool_calls || [];
              choice.delta.tool_calls.forEach(function(tc) {
                // 增量累积：index 匹配已有的，否则新建
                var existing = streamAssistantMsg.tool_calls[tc.index];
                if (!existing) {
                  streamAssistantMsg.tool_calls[tc.index] = { id: tc.id, type: tc.type, function: { name: '', arguments: '' } };
                  existing = streamAssistantMsg.tool_calls[tc.index];
                }
                if (tc.id) existing.id = tc.id;
                if (tc.type) existing.type = tc.type;
                if (tc.function?.name) existing.function.name = (existing.function.name || '') + tc.function.name;
                if (tc.function?.arguments) existing.function.arguments = (existing.function.arguments || '') + tc.function.arguments;
                
                // 同步到 _toolSteps：按 index 或最后一个 running 步骤
                if (streamAssistantMsg._toolSteps && streamAssistantMsg._toolSteps.length > 0) {
                  var tstep = streamAssistantMsg._toolSteps[tc.index];
                  if (!tstep) {
                    // fallback: 最后一个尚无 args 的 running 步骤
                    for (var ti = streamAssistantMsg._toolSteps.length - 1; ti >= 0; ti--) {
                      if (!streamAssistantMsg._toolSteps[ti].args && streamAssistantMsg._toolSteps[ti].running) {
                        tstep = streamAssistantMsg._toolSteps[ti]; break;
                      }
                    }
                    if (!tstep) tstep = streamAssistantMsg._toolSteps[streamAssistantMsg._toolSteps.length - 1];
                  }
                  if (tstep) {
                    if (tc.function?.name && (!tstep.name || tstep.name === 'unknown')) tstep.name = tc.function.name;
                    if (!tstep.toolCallId && existing.id) tstep.toolCallId = existing.id;
                    if (existing.function?.arguments) {
                      try {
                        var parsed = JSON.parse(existing.function.arguments);
                        tstep.args = parsed;
                      } catch(e) {
                        tstep.args = existing.function.arguments;
                      }
                    }
                  }
                }
              });
              scheduleRender(sid, false);
            }
            if (choice?.delta?.reasoning_content) {
              streamAssistantMsg.reasoning += choice.delta.reasoning_content;
              scheduleRender(sid, false);
            }
            if (choice?.delta?.content) {
              streamAssistantMsg._toolSteps.forEach(s => { s.running = false; });
              var dc = choice.delta.content;
              if (typeof dc !== 'string') dc = JSON.stringify(dc);
              streamAssistantMsg.content += dc;
              scheduleRender(sid, false);
            }
          } catch(e) {
            // S#4: SSE 解析错误不再静默吞掉，记录到 console 帮助排查
            if (window.console && console.warn) {
              console.warn('[SSE] parse error:', e.message, 'data:', jsonStr ? jsonStr.substring(0, 200) : '(empty)');
            }
          }
        }
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      // 读超时看门狗：后端心跳（: ping）每 15s 一次，正常时 lastByteAt 持续更新。
      // 若 60s 内连心跳都没有，说明连接已死（进程卡死/网络黑洞），主动 abort 触发重连。
      var lastByteAt = Date.now();
      var _watchdog = setInterval(function() {
        if (Date.now() - lastByteAt > 60000) {
          console.warn('[sendMessage] no data for 60s, stream considered dead');
          streamState._watchdogAborted = true;
          try { abortController.abort(); } catch {}
        }
      }, 10000);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        lastByteAt = Date.now();
        parser.feed(decoder.decode(value, { stream: true }));
      }

      // 流正常结束：清理看门狗，统一收尾
      clearInterval(_watchdog);
      console.log('[sendMessage] stream done (server closed)');
      // 流正常完成，清除可能残留的重连按钮（上一轮失败遗留）
      document.querySelectorAll('.reconnect-btn').forEach(function(b) { b.remove(); });
      window.Hermes.onStreamComplete(sid);

    } catch (e) {
      // 清理读超时看门狗
      if (typeof _watchdog !== 'undefined') clearInterval(_watchdog);

      // 看门狗判死：当作网络错误处理（保留部分内容 + 重连按钮）
      // 用户主动 abort（非看门狗）：abortStream 已处理，静默返回
      var isWatchdog = !!streamState._watchdogAborted;
      console.error('[sendMessage] SSE catch:', e.name || 'Error', e.message || e, '| isWatchdog=', isWatchdog);
      if (e.name === 'AbortError' && !isWatchdog) {
        return;
      }

      // 兜底：chunked 流被异常截断（ERR_INCOMPLETE_CHUNKED_ENCODING / TypeError network error）
      // 时，若 agent_settled 已到达，说明 agent 正常完成、内容完整，只是流终止符缺失。
      // 此时按正常完成处理（onStreamComplete 会 backgroundReFetch 拉取服务端最终消息覆盖），
      // 不再保留中断标记、不弹"重连"按钮，避免对用户造成误导性重连提示。
      if (streamState._settledReceived) {
        console.log('[sendMessage] network error after agent_settled, treat as complete:', e.message || e);
        try { window.Hermes.onStreamComplete(sid); } catch (ce) { console.warn('[sendMessage] onStreamComplete fallback failed', ce); }
        // 与正常完成路径对齐：解锁输入框 + 停止按钮归位，防止收尾异常导致 UI 卡在"响应中"
        try { updateChatUIState(); } catch (ue) { console.warn('[sendMessage] updateChatUIState fallback failed', ue); }
        return;
      }

      // S#5: 网络错误（或看门狗判死）时保留已接收的部分内容，而非删除整个 streaming msg
      const currentMsgs = getMsgs(sid);
      if (currentMsgs) {
        const idx = currentMsgs.indexOf(streamAssistantMsg);
        if (idx >= 0) {
          // 如果已有部分内容，保留并标记中断
          if (streamAssistantMsg.content || streamAssistantMsg.reasoning) {
            streamAssistantMsg._streaming = false;
            streamAssistantMsg._aborted = true;
            streamAssistantMsg._error = isWatchdog ? '响应超时（60s 无数据）' : e.message;
          } else {
            // 没有内容，直接删除
            currentMsgs.splice(idx, 1);
          }
        }
        delete state.activeStreams[sid];
        if (state.focusedSessionId === sid && state.viewMode === 'chat') {
          if (streamAssistantMsg.content || streamAssistantMsg.reasoning) {
            window.Hermes.finalizeStreamingTurn(sid);
          } else {
            var failMsg = isWatchdog
              ? '响应超时：60 秒内未收到数据，连接可能已断开。'
              : '连接失败: ' + e.message;
            addSystemMessage(failMsg + '\n\n请确认 pi-bridge 已启动: cd piweb-bridge && ./start.sh');
            renderCurrentChat();
          }
          updateChatUIState();
          dom.chatInput.focus({ preventScroll: true });
        }
        // S#7: 显示重连按钮
        if (state.focusedSessionId === sid && state.viewMode === 'chat') {
          var reconBtn = document.createElement('button');
          reconBtn.className = 'reconnect-btn';
          reconBtn.textContent = isWatchdog ? '🔄 重连(响应超时)' : '🔄 重连(连接断开)';
          reconBtn.onclick = function() {
            reconBtn.remove();
            dom.chatInput.value = input;
            H.sendMessage();
          };
          var inputArea = document.querySelector('.chat-input-area');
          if (inputArea) inputArea.appendChild(reconBtn);
        }
      }
      return;
    }

    // ---- 流结束后的收尾 ----
    // onStreamComplete 已负责 re-fetch + 渲染，这里只做额外清理

    // 刷新左侧会话列表（走 loadSessions 以保持项目过滤逻辑一致）
    try {
      await window.Hermes.loadSessions();
      window.Hermes.renderQuickStats();
    } catch(e) { console.warn('[sendMessage] 刷新会话列表失败', e); }

    const effectiveSid = streamState.sessionId;

    // 如果当前正在看这个 session，补充 UI 更新
    if (state.focusedSessionId === effectiveSid && state.viewMode === 'chat') {
      // finalizeStreamingTurn 已处理 initCollapsible，这里不再重复
      updateChatUIState();
      // focus 不用 scrollTo，防止触发滚动
      if (dom.chatInput) {
        dom.chatInput.focus({ preventScroll: true });
      }
      window.Hermes.loadContextInfo(effectiveSid);
    }

    window.Hermes.updateStreamingHints();
  }

  // ---- 审批结果回调 ----
  async function resolveApproval(runId, choice) {
    try {
      const res = await fetch(window.Hermes.API_BASE + '/ui-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: window.Hermes.state.focusedSessionId, id: runId, choice: choice }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || 'HTTP ' + res.status);
      }
      const data = await res.json();
      window.Hermes.toast('审批已提交: ' + choice);
      // 标记已处理，防止重复渲染
      const sid = window.Hermes.state.focusedSessionId;
      if (sid) {
        const msgs = window.Hermes.getMsgs(sid);
        if (msgs) {
          const streamingMsg = msgs.find(m => m._streaming && m._approval);
          if (streamingMsg) {
            streamingMsg._approvalResolved = true;
            streamingMsg._approvalChoice = choice;
            window.Hermes.renderCurrentChat();
          }
        }
      }
    } catch(e) {
      window.Hermes.toast('审批提交失败: ' + e.message, true);
    }
  }

  // 审批按钮事件委托
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.approval-btn');
    if (!btn || btn.classList.contains('resolved')) return;
    const card = btn.closest('.approval-card');
    if (!card) return;
    const runId = card.dataset.runId;
    const choice = btn.dataset.choice;
    if (!runId || !choice) return;
    // 禁用所有按钮防重复点击
    card.querySelectorAll('.approval-btn').forEach(b => b.classList.add('resolved'));
    resolveApproval(runId, choice);
  });

  // ---- Exports ----
  window.Hermes.enterChatMode = enterChatMode;
  window.Hermes.exitChatMode = exitChatMode;
  window.Hermes.sendMessage = sendMessage;
  window.Hermes.getSlashQuery = getSlashQuery;
  window.Hermes.filterSlashCommands = filterSlashCommands;
  window.Hermes.renderSlashMenu = renderSlashMenu;
  window.Hermes.hideSlashMenu = hideSlashMenu;
  window.Hermes.slashNavigate = slashNavigate;
  window.Hermes.slashSelect = slashSelect;
  window.Hermes.slashState = function() { return slashState; };
  window.Hermes.abortCurrentStream = abortCurrentStream;
  window.Hermes.renderCurrentChat = renderCurrentChat;
  window.Hermes.currentMsgs = currentMsgs;
  window.Hermes.updateChatUIState = updateChatUIState;
  window.Hermes.finalizeStreamingTurn = finalizeStreamingTurn;
  window.Hermes.refreshLastTurn = refreshLastTurn;
  window.Hermes.clearAllRenderTimers = clearAllRenderTimers;
  window.Hermes._clearRenderTimer = _clearRenderTimer;
  window.Hermes._updateScrollBtn = _updateScrollBtn;
  window.Hermes.getPrevInputHistory = getPrevInputHistory;
  window.Hermes.getNextInputHistory = getNextInputHistory;
  window.Hermes.handleImageFile = handleImageFile;

})();
