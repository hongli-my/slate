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

  // ---- 统一渲染 ----
  // 每个会话独立的 render debounce timer，避免跨会话切换时误触发渲染
  let _renderTimers = {};
  const RENDER_DEBOUNCE_MS = 50;

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
      // 只在有 running 工具时重渲染（秒数跳动；renderer L3.5 只 patch 耗时徽标）
      var stream = state.activeStreams[sid];
      if (stream && stream.runningTools && Object.keys(stream.runningTools).length > 0) {
        scheduleRender(sid, false);
      }
    }, 1000);
  }
  function _stopLiveTimer() {
    if (_liveTimer) { clearInterval(_liveTimer); _liveTimer = null; }
  }
  window.Hermes._startLiveTimer = _startLiveTimer;
  window.Hermes._stopLiveTimer = _stopLiveTimer;

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
    _scrollBtn.style.pointerEvents = 'none';
    _scrollBtn.addEventListener('click', function() {
      var el = window.Hermes.dom.chatMessages;
      // 回底按钮：单次触发平滑滚动（css 已移除全局 smooth，这里显式指定）
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      _scrollBtn.style.display = 'none';
      _scrollBtn.style.pointerEvents = 'none';
      _scrollBtnShown = false;
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

  // rAF 去重：scroll 事件高频触发 + 流式每帧调用，合并到一帧执行避免 forced reflow 风暴
  var _scrollBtnRaf = 0;
  // 滞回：显示阈值 80px / 隐藏阈值 20px。避免在 isNearBottom 阈值附近抖动时
  // 按钮反复 display:none↔flex → 该按钮 cursor:pointer 且定位(bottom:80px)压在输入区上沿，
  // 反复显隐会让鼠标在 textarea(text 光标)与按钮(pointer)间来回切换 → 1-2Hz 闪烁。
  var _scrollBtnShown = false;
  function _updateScrollBtn() {
    if (_scrollBtnRaf) return;
    _scrollBtnRaf = requestAnimationFrame(function() {
      _scrollBtnRaf = 0;
      var el = window.Hermes.dom.chatMessages;
      if (!el) return;
      var btn = _getScrollBtn();
      var dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      // 滞回判定：未显示且距底>80px → 显示；已显示且距底<20px → 隐藏；中间态保持现状
      var shouldShow = _scrollBtnShown ? (dist >= 20) : (dist >= 80);
      if (shouldShow === _scrollBtnShown) return;
      _scrollBtnShown = shouldShow;
      if (shouldShow) {
        btn.style.display = 'flex';
        btn.style.pointerEvents = 'auto';
      } else {
        btn.style.display = 'none';
        btn.style.pointerEvents = 'none'; // 双保险：隐藏后绝不参与 hit-test
      }
    });
  }

  // 钉底：在渲染 rAF 内同步执行（renderDiff 写完 DOM 立即 scrollTop=scrollHeight）。
  // 旧实现用独立的嵌套 rAF 把 scrollTop 推迟到下一帧 → DOM 先 paint 到错误滚动位置，
  // 下一帧才 snap，流式期每帧 ~16ms 微抖。同步执行接受一次 forced layout（~1ms），
  // 换取零视觉跳变：scrollHeight 反映刚写入的 DOM，同帧 paint 即正确位置。
  function _pinToBottom() {
    var el = window.Hermes.dom.chatMessages;
    if (el) el.scrollTop = el.scrollHeight;
  }

  // ----------------------------------------------------------
  // 流结束/中止/错误的终态转换（原 finalizeStreamingTurn 已删除）
  //
  // 根治 R1：不再在流结束后 splice/拆分 msgs 数组，也不再 out-of-band 改 DOM。
  // 终态转换完全由 renderer 承担（形态统一）：
  //   1. 数据侧（session-manager onStreamComplete / abort / 错误路径）经
  //      finalizeLiveStream 把 live 累积器物化为 pi 原生 blocks 消息（或删除空 partial）；
  //   2. renderCurrentChat → renderDiff 检测到 turn 从 live 变 static →
  //      render.js _applyStatic 整 turn 重渲为终态（走 renderMarkdown 净化兜底，B4）。
  // 效果：无数组结构突变、无 DOM 旁路写入、无“找不到对象”类的定位脆弱性。
  // ----------------------------------------------------------

  /**
   * 渲染当前焦点会话（chat 模式唯一渲染入口）。
   * 委托 renderer：会话切换/首次 → renderDiff 内部自动 renderFull；
   * 增量帧 → 逐 turn 签名比对（L2/L3），未变 turn 零 DOM 操作。
   * 滚动策略与旧实现一致：渲染前探底，变更且贴底才钉底。
   */
  function renderCurrentChat() {
    const state = window.Hermes.state;
    const dom = window.Hermes.dom;
    if (state.viewMode !== 'chat') return;
    const sid = state.focusedSessionId;
    const container = dom.chatMessages;
    if (!sid) {
      // 无焦点会话：清空容器并重置 renderer 状态，防残留上一会话的 element-map
      window.Hermes.rendererReset(container);
      container.innerHTML = '';
      return;
    }
    const msgs = getMsgs(sid);
    if (!msgs) return;

    const atBottom = isNearBottom(container);
    var changed = false;
    try {
      changed = window.Hermes.renderDiff(container, msgs, sid);
    } catch (e) {
      // renderer 异常兜底：全量重建（宁可慢不破）
      console.warn('[renderCurrentChat] renderDiff failed, fallback full render', e);
      window.Hermes.rendererReset(container);
      changed = window.Hermes.renderFull(container, msgs, sid);
    }
    if (changed && atBottom) _pinToBottom();
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
        // P#4: rAF 对齐帧边界，让重活在帧起点开始，最大化可用预算
        requestAnimationFrame(renderCurrentChat);
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
    const sysMsg = { role: 'system', content: html || text, _isSystemDisplay: true, _localId: window.Hermes.uid() };
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
      if (m.role === 'user') {
        md += `### 👤 用户\n\n${H.msgText(m.content)}\n\n---\n\n`;
      } else if (m.role === 'assistant') {
        // pi 原生 blocks：text/thinking/toolCall 经 extractAssistantParts 归一
        const p = H.extractAssistantParts(m);
        if (p.reasoning) md += `> 💭 思考\n> ${p.reasoning.replace(/\n/g, '\n> ')}\n\n`;
        p.toolCalls.forEach(tc => { md += `**🔧 ${tc.name}**\n\n`; });
        if (p.text) md += `### 🤖 助手\n\n${p.text}\n\n---\n\n`;
      } else if (m.role === 'toolResult') {
        const r = H.msgText(m.content);
        md += `> 🔧 工具结果${m.isError ? '（出错）' : ''}: ${r.length > 500 ? r.slice(0, 500) + '…' : r}\n\n`;
      }
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
      msgs.push({ role: 'system', content: '✂️ 上下文压缩失败：' + (errorMessage || (aborted ? '已取消' : '未知原因')), _isCompaction: true, _localId: window.Hermes.uid() });
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
    msgs.push({ role: 'system', content: head, _isCompaction: true, _compactionHtml: html, _localId: window.Hermes.uid() });
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
    // 不再 disabled 输入框：流式期间仍可打字。Enter 发送时若仍有活跃流，先 auto-abort 再发。
    // 仅用 stop 按钮提示"忙碌"状态；输入框轻微 dim 作为视觉提示但不阻断输入。
    dom.chatInput.disabled = false;
    if (hasActiveStream) {
      showStopButton();
      dom.chatInput.style.opacity = '0.7';
    } else {
      showSendButton();
      dom.chatInput.style.opacity = '';
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

  // ============================================================
  // 流式事件处理（pi AgentSession SSE 事件 → live 累积器 / pi 原生消息）
  // 正常事件顺序：message_update(delta…/toolcall_end) → message_end →
  // tool_execution_start/update/end → （多轮工具则下一条消息重复）→ agent_settled。
  // toolcall_end 与 tool_execution_start 到达顺序不保证 → 两侧均幂等。
  // ============================================================

  /** 确保当前进行中的 partial assistant 消息存在（每条 assistant 消息一个 partial） */
  function _beginPartial(stream, sid) {
    if (stream.partial) return stream.partial;
    var m = { role: 'assistant', content: [], timestamp: Math.floor(Date.now() / 1000), _localId: window.Hermes.uid() };
    var msgs = getMsgs(sid);
    if (msgs) msgs.push(m);
    stream.partial = m;
    stream.text = '';
    stream.reasoning = '';
    stream.toolCalls = [];
    return m;
  }

  /**
   * message_end：用事件携带的权威 AssistantMessage（pi 原生 blocks）原地替换 partial。
   * 嫁接 _localId 保持 turn key 稳定 → live→static 平滑 morph（不重建 DOM）。
   */
  function _finalizePartialWithMessage(stream, sid, message) {
    var msgs = getMsgs(sid);
    var partial = stream.partial;
    if (msgs) {
      if (partial) {
        message._localId = partial._localId;
        var idx = msgs.indexOf(partial);
        if (idx >= 0) msgs[idx] = message;
        else msgs.push(message);
      } else {
        message._localId = window.Hermes.uid();
        msgs.push(message);
      }
    }
    stream.partial = null;
    stream.text = '';
    stream.reasoning = '';
    stream.toolCalls = [];
  }

  /** SSE 事件统一入口（onEvent 调用；流已结束/中止后的 in-flight 事件直接丢弃） */
  function handleStreamEvent(stream, sid, evt) {
    if (stream.finished) return;
    const _t = evt.type;

    if (_t === 'message_update') {
      const _ae = evt.assistantMessageEvent;
      if (!_ae) return;
      if (_ae.type === 'text_delta') {
        _beginPartial(stream, sid);
        stream.text += (_ae.delta || '');
        scheduleRender(sid, false);
      } else if (_ae.type === 'thinking_delta') {
        _beginPartial(stream, sid);
        stream.reasoning += (_ae.delta || '');
        scheduleRender(sid, false);
      } else if (_ae.type === 'start') {
        _beginPartial(stream, sid);
      } else if (_ae.type === 'toolcall_end' && _ae.toolCall) {
        // pi 原生 ToolCall block（tool_execution_start 可能尚未到达 → 幂等入表）
        _beginPartial(stream, sid);
        stream.toolCalls.push(_ae.toolCall);
      }
      return;
    }

    if (_t === 'message_end' && evt.message && evt.message.role === 'assistant') {
      _finalizePartialWithMessage(stream, sid, evt.message);
      scheduleRender(sid, false);
      return;
    }

    if (_t === 'tool_execution_start') {
      stream.runningTools[evt.toolCallId] = {
        name: evt.toolName || 'unknown',
        args: evt.args || null,
        startTime: Date.now(),
        preview: '',
      };
      _startLiveTimer();
      scheduleRender(sid, false);
      return;
    }

    if (_t === 'tool_execution_update') {
      var rt = stream.runningTools[evt.toolCallId];
      if (rt && evt.partialResult) {
        var pv = window.Hermes.msgText(evt.partialResult.content);
        if (pv) rt.preview = pv;
        scheduleRender(sid, false);
      }
      return;
    }

    if (_t === 'tool_execution_end') {
      delete stream.runningTools[evt.toolCallId];
      // pi 原生 ToolResultMessage（与 DB / REST /messages 同构，reFetch 后无差异）
      var msgs = getMsgs(sid);
      if (msgs) {
        msgs.push({
          role: 'toolResult',
          toolCallId: evt.toolCallId,
          toolName: evt.toolName || 'unknown',
          content: (evt.result && evt.result.content !== undefined) ? evt.result.content : (evt.result != null ? evt.result : []),
          isError: !!evt.isError,
          timestamp: Math.floor(Date.now() / 1000),
          _localId: window.Hermes.uid(),
        });
      }
      scheduleRender(sid, false);
      return;
    }

    if (_t === 'extension_ui_request') {
      stream.approval = evt;
      stream.approvalResolved = false;
      scheduleRender(sid, true);
      return;
    }

    if (_t === 'error') {
      // SSE error 事件视为终态：置错误态 + 标记终止 + 调度渲染，由读取循环
      // 检测 _errorReceived 后 break 走 onStreamComplete 收尾（否则会空转到 60s 看门狗）。
      stream.error = evt.error || 'unknown error';
      stream._errorReceived = true;
      scheduleRender(sid, false);
      return;
    }

    if (_t === 'agent_settled') {
      // 标记 agent 已正常完成。即便后续 chunked 流被异常截断
      // （ERR_INCOMPLETE_CHUNKED_ENCODING / network error），内容也是完整的，
      // catch 时走正常收尾而非误报“重连”
      stream._settledReceived = true;
      return;
    }

    // ---- 上下文压缩事件（自动压缩 threshold/overflow 经 SSE 透传）----
    if (_t === 'compaction_start') {
      var _cmsgs = getMsgs(sid);
      if (_cmsgs) {
        _cmsgs.push({ role: 'system', content: '✂️ 正在压缩上下文…（' + (evt.reason || '') + '）', _isCompaction: true, _compactionPending: true, _localId: window.Hermes.uid() });
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
      var _cache = window.Hermes.state.sessionMessages[sid];
      if (_cache) _cache._compactedAt = Date.now();
      // 压缩后 token 骤降，强制刷新用量条（绕过 5s 防抖）
      if (window.Hermes.loadContextInfo) {
        setTimeout(function() { window.Hermes.loadContextInfo(sid, true); }, 300);
      }
      return;
    }
    // agent_start / turn_* / agent_end 等无需特殊处理
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

    // 检查是否已有活跃流：auto-abort+send（而非阻断）。用户流式期按 Enter 发新消息，
    // 先中止当前流（让后端释放），再发新消息。比队列化简单且符合"打断即发"直觉。
    if (window.Hermes.hasActiveStream(sid)) {
      try { window.Hermes.abortStream(sid); } catch (e) { console.warn('[sendMessage] auto-abort failed', e); }
    }

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
    showStopButton();

    // 清除上一轮失败可能残留的重连按钮，避免"新请求已成功却仍显示重连"的误导
    document.querySelectorAll('.reconnect-btn').forEach(function(b) { b.remove(); });

    // E#11: 记录输入历史
    pushInputHistory(input);

    const abortController = new AbortController();

    // 1. user 消息写入 sessionMessages（记录流式前的消息数，供 backgroundReFetch 增量拉取）
    //    _localId：本地新建消息的稳定身份（DB 消息无 id 字段，renderer 依赖它做 turn key）
    const userMsg = { role: 'user', content: input, _localId: window.Hermes.uid() };
    const msgs = getMsgs(sid);
    const preStreamCount = msgs ? msgs.length : 0;
    if (msgs) msgs.push(userMsg);

    // 2. 创建 live 流状态（累积器 + 瞬态；不进消息主数据——msgs 只存 pi 原生形态）。
    //    eager 创建 partial（空 blocks assistant 消息）：立即渲染“思考中”占位，
    //    且首个事件丢失时后续内容仍能落 msgs。
    const stream = {
      abortController,
      sessionId: sid,
      userInput: input,
      preStreamCount: preStreamCount,
      finished: false,
      // ---- live 累积器（当前进行中的 assistant 消息）----
      partial: null,        // msgs 中的占位 assistant 消息（content:[]），message_end 时被权威消息原地替换
      text: '', reasoning: '',  // text_delta / thinking_delta 累积
      toolCalls: [],        // 当前 partial 的 ToolCall blocks（toolcall_end 事件）
      runningTools: {},     // callId → { name, args, startTime, preview }（实时耗时/预览）
      approval: null, approvalResolved: false,
      error: null, aborted: false,
      _settledReceived: false, _errorReceived: false,
      _watchdogAborted: false, _retriedAfterBusy: false,
    };
    state.activeStreams[sid] = stream;
    _beginPartial(stream, sid);

    // 4. 渲染新 turn（renderer 按稳定 key 尾部追加，等价旧 appendNewTurn 但走单一渲染路径）
    //    清流式 markdown 稳定段缓存，防 'sf'/'tm' 跨轮串内容
    if (window.Hermes.clearStreamingMdCache) window.Hermes.clearStreamingMdCache();
    scheduleRender(sid, true);
    window.Hermes.updateStreamingHints();
    // 发送后直接钉到底（与旧 appendNewTurn 语义一致：用户刚发送，聚焦新 turn）
    if (dom.chatMessages) dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;

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
        if (res.status === 409 && !stream._retriedAfterBusy) {
          stream._retriedAfterBusy = true;
          try {
            await fetch(window.Hermes.API_BASE + '/abort', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session_id: sid }),
            });
          } catch {}
          await new Promise(function(r) { setTimeout(r, 400); });
          // 清理占位 assistant 消息与本次刚 push 的 userMsg + 流状态，恢复输入后重发。
          // 否则 H.sendMessage() 会再 push 一个 userMsg，与残留的旧 userMsg 重复。
          var _msgs = getMsgs(sid);
          if (_msgs) {
            if (stream.partial) { var _i = _msgs.indexOf(stream.partial); if (_i >= 0) _msgs.splice(_i, 1); }
            var _ui = _msgs.indexOf(userMsg);
            if (_ui >= 0) _msgs.splice(_ui, 1);
          }
          delete state.activeStreams[sid];
          dom.chatInput.value = stream.userInput;
          dom.chatInput.disabled = false;
          H.sendMessage();
          return;
        }
        const currentMsgs = getMsgs(sid);
        if (currentMsgs) {
          if (stream.partial) { const idx = currentMsgs.indexOf(stream.partial); if (idx >= 0) currentMsgs.splice(idx, 1); }
          currentMsgs.push({ role: 'system', content: 'API 错误: ' + errText, _isSystemDisplay: true, _localId: window.Hermes.uid() });
        }
        delete state.activeStreams[sid];
        if (state.focusedSessionId === sid && state.viewMode === 'chat') {
          renderCurrentChat();
          updateChatUIState();
          dom.chatInput.focus({ preventScroll: true });
        }
        return;
      }

      // 使用 eventsource-parser 解析 SSE 流（事件处理统一走 handleStreamEvent）
      const parser = EventSourceParser.createParser({
        onEvent(event) {
          const jsonStr = event.data;
          if (jsonStr === '[DONE]') return;
          try {
            handleStreamEvent(stream, sid, JSON.parse(jsonStr));
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
          stream._watchdogAborted = true;
          try { abortController.abort(); } catch {}
        }
      }, 10000);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        lastByteAt = Date.now();
        // 分片喂入 parser：WKWebView 可能把多个 SSE 帧合并成一个大 chunk，
        // 一次同步解析 N 帧会长时间阻塞主线程（N 次 JSON.parse + 渲染队列堆积）。
        // 按 4KB 子块喂入 + 每次让出事件循环，把解析摊到多个 macrotask。
        // （pi-bridge 已做 40ms 帧合并，此分支仅在收到超大合并 chunk 时兜底）
        const text = decoder.decode(value, { stream: true });
        const SUB = 4096;
        if (text.length > SUB) {
          for (let i = 0; i < text.length; i += SUB) {
            parser.feed(text.slice(i, i + SUB));
            // SSE error 事件已处理 → 中止剩余子块，直接走收尾
            if (stream._errorReceived) break;
            await new Promise(function(resolve) { setTimeout(resolve, 0); });
          }
        } else {
          parser.feed(text);
        }
        // error 事件视为终态：跳出读取循环，走与正常完成一致的收尾（onStreamComplete）
        if (stream._errorReceived) break;
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
      var isWatchdog = !!stream._watchdogAborted;
      console.error('[sendMessage] SSE catch:', e.name || 'Error', e.message || e, '| isWatchdog=', isWatchdog);
      if (e.name === 'AbortError' && !isWatchdog) {
        return;
      }

      // 兜底：chunked 流被异常截断（ERR_INCOMPLETE_CHUNKED_ENCODING / TypeError network error）
      // 时，若 agent_settled 已到达，说明 agent 正常完成、内容完整，只是流终止符缺失。
      // 此时按正常完成处理（onStreamComplete 会 backgroundReFetch 拉取服务端最终消息覆盖），
      // 不再保留中断标记、不弹"重连"按钮，避免对用户造成误导性重连提示。
      if (stream._settledReceived) {
        console.log('[sendMessage] network error after agent_settled, treat as complete:', e.message || e);
        try { window.Hermes.onStreamComplete(sid); } catch (ce) { console.warn('[sendMessage] onStreamComplete fallback failed', ce); }
        // 与正常完成路径对齐：解锁输入框 + 停止按钮归位，防止收尾异常导致 UI 卡在"响应中"
        try { updateChatUIState(); } catch (ue) { console.warn('[sendMessage] updateChatUIState fallback failed', ue); }
        return;
      }

      // S#5: 网络错误（或看门狗判死）时保留已接收的部分内容，而非删除整个流式消息。
      // 有内容 → finalizeLiveStream 物化为 pi 原生 blocks（附 _error/_aborted 标记）；
      // 无内容 → 删除空 partial + 流状态。
      const hasContent = !!(stream.text || stream.reasoning || (stream.toolCalls && stream.toolCalls.length));
      if (hasContent) {
        window.Hermes.finalizeLiveStream(sid, { error: isWatchdog ? '响应超时（60s 无数据）' : e.message });
      } else {
        const currentMsgs = getMsgs(sid);
        if (currentMsgs && stream.partial) {
          const idx = currentMsgs.indexOf(stream.partial);
          if (idx >= 0) currentMsgs.splice(idx, 1);
        }
        delete state.activeStreams[sid];
      }
      if (state.focusedSessionId === sid && state.viewMode === 'chat') {
        if (hasContent) {
          // 残留消息 → renderer 静态终态渲染（B4：终态路径走 renderMarkdown 净化，
          // 流式窗口期未净化的 HTML 不滞留）
          if (window.Hermes.clearStreamingMdCache) window.Hermes.clearStreamingMdCache();
          if (window.Hermes._stopLiveTimer) window.Hermes._stopLiveTimer();
          renderCurrentChat();
        } else {
          var failMsg = isWatchdog
            ? '响应超时：60 秒内未收到数据，连接可能已断开。'
            : '连接失败: ' + e.message;
          addSystemMessage(failMsg + '\n\n请确认 pi-bridge 已启动: cd piweb-bridge && ./start.sh');
          renderCurrentChat();
        }
        updateChatUIState();
        dom.chatInput.focus({ preventScroll: true });
        // S#7: 显示重连按钮
        var reconBtn = document.createElement('button');
        reconBtn.className = 'reconnect-btn';
        reconBtn.textContent = isWatchdog ? '🔄 重连(响应超时)' : '🔄 重连(连接断开)';
        reconBtn.onclick = function() {
          reconBtn.remove();
          // 移除上一轮失败残留的 _aborted/_error assistant（保留了部分内容但已中断）。
          // 否则 sendMessage 的新 preStreamCount 会把它算进 slice(0, offset)，
          // backgroundReFetch 保留前缀 → 中断的半截回复永远卡在新回复上方不被替换。
          // 注意：不动 user 消息（重发/已存在取决于流程，留给 sendMessage 处理）。
          var _reconMsgs = getMsgs(sid);
          if (_reconMsgs) {
            for (var _r = _reconMsgs.length - 1; _r >= 0; _r--) {
              var _rm = _reconMsgs[_r];
              if (_rm && _rm.role === 'assistant' && (_rm._aborted || _rm._error)) _reconMsgs.splice(_r, 1);
            }
          }
          dom.chatInput.value = input;
          H.sendMessage();
        };
        var inputArea = document.querySelector('.chat-input-area');
        if (inputArea) inputArea.appendChild(reconBtn);
      }
      return;
    }

    // ---- 流结束后的收尾 ----
    // onStreamComplete 已负责 re-fetch + 渲染，这里只做额外清理

    // 刷新左侧会话列表（防抖合并，避免多流并发结束时重复刷新）
    window.Hermes.debouncedLoadSessions();
    try { window.Hermes.renderQuickStats(); } catch(e) { console.warn('[sendMessage] 刷新统计失败', e); }

    const effectiveSid = sid;

    // 如果当前正在看这个 session，补充 UI 更新
    if (state.focusedSessionId === effectiveSid && state.viewMode === 'chat') {
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
      if (sid && window.Hermes.getStream) {
        const stream = window.Hermes.getStream(sid);
        if (stream && stream.approval) {
          stream.approvalResolved = true;
          stream.approvalChoice = choice;
          window.Hermes.renderCurrentChat();
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
  window.Hermes.handleStreamEvent = handleStreamEvent;
  window.Hermes.renderCurrentChat = renderCurrentChat;
  window.Hermes.currentMsgs = currentMsgs;
  window.Hermes.updateChatUIState = updateChatUIState;
  window.Hermes.clearAllRenderTimers = clearAllRenderTimers;
  window.Hermes._clearRenderTimer = _clearRenderTimer;
  window.Hermes._updateScrollBtn = _updateScrollBtn;
  window.Hermes.getPrevInputHistory = getPrevInputHistory;
  window.Hermes.getNextInputHistory = getNextInputHistory;
  window.Hermes.handleImageFile = handleImageFile;

})();

// ---- 窗口缩放防御 ----
// 消息区大量使用 content-visibility:auto（长对话滚动性能优化）。
// WebKit 在视口尺寸变化（窗口缩放/子 webview autoresize）后，部分 content-visibility
// 区域的可见性判定可能不刷新 → 出现空白/不重绘。这里在 resize 后短暂强制所有 turn
// 可见再恢复，触发 WebKit 重新评估可见性与重绘（150ms 防抖，仅缩放时触发，不影响流式）。
(function () {
  var _cvTimer = 0;
  window.addEventListener('resize', function () {
    if (_cvTimer) clearTimeout(_cvTimer);
    _cvTimer = setTimeout(function () {
      _cvTimer = 0;
      var turns = document.querySelectorAll('.turn');
      if (!turns.length) return;
      turns.forEach(function (t) { t.style.contentVisibility = 'visible'; });
      requestAnimationFrame(function () {
        turns.forEach(function (t) { t.style.contentVisibility = ''; });
      });
    }, 150);
  });
})();
