/* ============================================================
   Hermes WebUI - Session Manager Module v2
   统一管理：焦点会话、消息缓存、流状态、会话生命周期
   
   核心原则：
   1. focusedSessionId 是唯一焦点，没有三元 ID 混乱
   2. sessionMessages[sid] 是 MessageCache，带 isStale 标记
   3. 流结束后不删缓存，标记 isStale → 下次进入时刷新
   4. 新对话先创建空会话再发消息，消除临时 key 迁移
   5. onStreamComplete 不依赖当前焦点判断
   ============================================================ */

window.Hermes = window.Hermes || {};

(function() {
  'use strict';

  var H = window.Hermes;
  var state = H.state;

  // ============================================================
  // 消息缓存管理
  // ============================================================

  /** 获取指定会话的 MessageCache（不存在则创建空缓存） */
  // P#4: LRU 缓存管理 — 最多保留 MAX_CACHED_SESSIONS 个会话缓存
  var MAX_CACHED_SESSIONS = 20;
  var _lruOrder = []; // 最近访问的 sid 列表，末尾是最近访问

  function _touchLRU(sid) {
    var idx = _lruOrder.indexOf(sid);
    if (idx >= 0) _lruOrder.splice(idx, 1);
    _lruOrder.push(sid);
    _evictIfNeeded();
  }

  function _evictIfNeeded() {
    while (_lruOrder.length > MAX_CACHED_SESSIONS) {
      var oldSid = _lruOrder.shift();
      if (oldSid === state.focusedSessionId) {
        // 当前焦点会话不淘汰，放回末尾
        _lruOrder.push(oldSid);
        continue;
      }
      if (state.activeStreams[oldSid]) {
        // 有活跃流的会话不淘汰
        _lruOrder.push(oldSid);
        continue;
      }
      delete state.sessionMessages[oldSid];
    }
  }

  function getCache(sid) {
    if (!sid) return null;
    if (!state.sessionMessages[sid]) {
      state.sessionMessages[sid] = H.createCache([]);
    }
    _touchLRU(sid);
    return state.sessionMessages[sid];
  }

  /** 获取指定会话的消息数组引用 */
  function getMsgs(sid) {
    var cache = getCache(sid || state.focusedSessionId);
    return cache ? cache.messages : null;
  }

  /** 设置指定会话的消息数组（版本递增，清除 isStale） */
  function setMsgs(sid, msgs) {
    if (!sid) return;
    var cache = state.sessionMessages[sid];
    if (cache) {
      cache.messages = msgs;
      cache.version++;
      cache.isStale = false;
      cache.loadedAt = Date.now();
    } else {
      state.sessionMessages[sid] = H.createCache(msgs);
    }
  }

  /** 标记指定会话缓存为过期 */
  function markStale(sid) {
    var cache = state.sessionMessages[sid];
    if (cache) cache.isStale = true;
  }

  /** 确保缓存是最新的，如果不是则从 API 刷新 */
  async function ensureFresh(sid) {
    if (!sid) return;
    var cache = getCache(sid);
    if (!cache) {
      await loadMessagesFromAPI(sid);
      return;
    }
    // 如果有活跃流正在写入，不刷新（流会负责更新）
    var stream = state.activeStreams[sid];
    if (stream && !stream.finished) return;
    // 缓存过期或从未加载
    if (cache.isStale || cache.messages.length === 0) {
      await loadMessagesFromAPI(sid);
    }
  }

  /** 从 API 加载指定会话的消息 */
  async function loadMessagesFromAPI(sid) {
    try {
      var result = await H.api('/sessions/' + sid + '/messages');
      var msgs = Array.isArray(result.data) ? result.data : [];
      setMsgs(sid, msgs);
      return msgs;
    } catch(e) {
      console.warn('[SessionManager] loadMessagesFromAPI failed for', sid, e);
      throw e;
    }
  }

  // ============================================================
  // 流状态管理
  // ============================================================

  /** 获取指定会话的活跃流 */
  function getStream(sid) {
    return state.activeStreams[sid] || null;
  }

  /** 指定会话是否有活跃流 */
  function hasActiveStream(sid) {
    var s = state.activeStreams[sid];
    return s && !s.finished;
  }

  /** 任何会话是否有活跃流 */
  function anyActiveStream() {
    return Object.values(state.activeStreams).some(function(s) { return !s.finished; });
  }

  /** 中止指定会话的流（不再删缓存！） */
  function abortStream(sid) {
    var stream = state.activeStreams[sid];
    if (!stream) return false;
    if (stream.abortController) stream.abortController.abort();

    // 标记 _streaming 消息为已中止
    var cache = state.sessionMessages[sid];
    if (cache) {
      var msgs = cache.messages;
      for (var i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i]._streaming) {
          msgs[i]._streaming = false;
          msgs[i]._aborted = true;
          break;
        }
      }
      cache.isStale = true;  // 标记过期，下次进入时 re-fetch
    }

    delete state.activeStreams[sid];
    return true;
  }

  /** 流结束回调（不依赖当前焦点判断） */
  function onStreamComplete(sid) {
    var stream = state.activeStreams[sid];
    if (!stream) return;

    // 标记流已完成
    stream.finished = true;
    stream.finishedAt = Date.now();

    // 标记 streaming 消息完成（保留流式数据用于渲染）
    var cache = state.sessionMessages[sid];
    if (cache) {
      var msgs = cache.messages;
      for (var i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i]._streaming) {
          msgs[i]._streaming = false;
          msgs[i]._toolSteps && msgs[i]._toolSteps.forEach(function(s) { s.running = false; });
          break;
        }
      }
      cache.isStale = true;
    }

    // 如果用户正在看这个会话，增量更新 streaming turn → 最终状态
    if (state.focusedSessionId === sid && state.viewMode === 'chat') {
      H.finalizeStreamingTurn(sid);
    }

    // 后台静默 re-fetch，让缓存与 DB 同步
    backgroundReFetch(sid);
  }

  /** 后台静默 re-fetch：合并新数据，用增量替换最后一个 turn */
  // S#2: 使用 reFetchSeq 防止多个并发 re-fetch 互相覆盖
  var _reFetchSeq = {};

  async function backgroundReFetch(sid) {
    try {
      // 等待 DB 写入完成
      await new Promise(function(r) { setTimeout(r, 800); });
      var mySeq = (_reFetchSeq[sid] = (_reFetchSeq[sid] || 0) + 1);

      var cache = state.sessionMessages[sid];
      if (!cache) return;

      // 压缩后后端 session.messages 被替换为精简版（[system]+[summary]+[保留消息]），
      // 此时 re-fetch 会用精简版覆盖前端完整历史，导致 assistant 回复被 summary 替代。
      // 若近期刚压缩过，跳过本次 re-fetch，保留前端完整历史 + 压缩标记。
      if (cache._compactedAt && (Date.now() - cache._compactedAt < 10000)) {
        console.log('[backgroundReFetch] skipped: session recently compacted');
        cache._compactedAt = 0;
        return;
      }

      var result = await H.api('/sessions/' + sid + '/messages');
      var freshMsgs = Array.isArray(result.data) ? result.data : [];

      // S#2: 如果在 await 期间又有新的 re-fetch 发起，放弃本次（旧数据可能覆盖新数据）
      if (mySeq !== _reFetchSeq[sid]) return;

      // 只有 re-fetch 数据比缓存更多时才替换（防止 DB 延迟导致数据丢失）
      if (freshMsgs.length >= cache.messages.length) {
        cache.messages = freshMsgs;
        cache.version++;
        cache.isStale = false;
        cache.loadedAt = Date.now();

        // 如果用户仍在此会话的 chat 模式，增量更新最后一个 turn
        if (state.focusedSessionId === sid && state.viewMode === 'chat') {
          H.refreshLastTurn(sid);
        }
      }
    } catch(e) {
      console.warn('[SessionManager] backgroundReFetch failed for', sid, e);
    }
  }

  /** 渲染当前焦点会话 */
  function renderFocusedView() {
    var sid = state.focusedSessionId;
    if (!sid) return;

    if (state.viewMode === 'chat') {
      H.renderCurrentChat();
    } else if (state.viewMode === 'view') {
      var msgs = getMsgs(sid);
      if (msgs) {
        H.renderMessages(msgs, H.dom.messageList);
      }
    }
  }

  // ============================================================
  // 会话焦点管理
  // ============================================================

  /**
   * 切换到指定会话（核心方法）
   * S#3: 使用 enterSeq 序列号防止快速切换时旧请求覆盖新会话
   * @param {string} sid - 会话 ID (null 表示无焦点)
   * @param {string} mode - 'view' | 'chat'
   */
  var _enterSeq = 0;

  async function enterSession(sid, mode) {
    var prev = state.focusedSessionId;
    var mySeq = ++_enterSeq;

    // 清除旧会话残存的 render debounce timer，防止误触发新会话的渲染
    if (prev && prev !== sid && H._clearRenderTimer) {
      H._clearRenderTimer(prev);
    }

    state.focusedSessionId = sid;
    state.viewMode = mode;

    if (!sid) {
      H.showView('welcome');
      H.updateStreamingHints();
      updateSidebar();
      updateURL();
      return;
    }

    // 检查是否有活跃流 → 直接进 chat
    if (hasActiveStream(sid) && mode === 'view') {
      mode = 'chat';
      state.viewMode = 'chat';
    }

    // 确保缓存最新
    try {
      await ensureFresh(sid);

      // S#3: 如果在 await 期间用户又切换了会话，放弃本次渲染
      if (mySeq !== _enterSeq || state.focusedSessionId !== sid) return;

      // 切换视图
      if (mode === 'chat') {
        H.showView('chat');
        var dom = H.dom;
        if (dom.chatSessionLabel) {
          dom.chatSessionLabel.textContent = '对话: ' + sid.substring(0, 16);
        }
        H.renderCurrentChat();
        // 根据当前焦点会话的流状态，正确设置输入框启用/禁用
        if (H.updateChatUIState) H.updateChatUIState();
        // P2: 切回有 running 工具步骤的会话时重启实时计时器（秒数跳动）
        if (H._startLiveTimer && hasActiveStream(sid)) {
          var _msgs = getMsgs(sid);
          if (_msgs) {
            var _hasRunning = _msgs.some(function(m) {
              return m._streaming && m._toolSteps && m._toolSteps.some(function(ts) { return ts.running; });
            });
            if (_hasRunning) H._startLiveTimer();
          }
        }
        H.loadContextInfo(sid, true);
      } else {
        H.showView('session');
        // 先用缓存渲染消息
        var msgs = getMsgs(sid);
        if (msgs) {
          H.renderMessages(msgs, H.dom.messageList);
        }
        H.loadContextInfo(sid, true);
        // 加载 session 详情填充 header（异步，不阻塞渲染）
        loadSessionHeader(sid);
      }

      H.updateStreamingHints();
      updateSidebar();
      updateURL();
    } finally {
      if (H.dom && H.dom.messageList) {
        H.dom.messageList.classList.remove('switching');
        var sl = H.dom.messageList.querySelector('.switch-loading');
        if (sl) sl.remove();
      }
    }
  }

  /** 加载 session 详情填充 session view header */
  async function loadSessionHeader(sid) {
    var dom = H.dom;
    if (!dom.sessionTitle || !dom.sessionInfo) return;
    try {
      var result = await H.api('/sessions/' + sid);
      var session = result.data;
      if (!session || state.focusedSessionId !== sid || state.viewMode === 'chat') return;
      dom.sessionTitle.textContent = session.title || 'Session';
      var fmtT = H.fmtTime;
      var fmtTok = H.fmtTokens;
      var fmtDur = H.fmtDuration;
      dom.sessionInfo.textContent =
        (session.model || '-') + ' | ' + fmtDur(session.started_at, session.ended_at) +
        ' | ' + (session.message_count || 0) + ' 条 | ' +
        fmtTok(session.input_tokens) + ' in / ' + fmtTok(session.output_tokens) + ' out';
    } catch(e) {
      if (state.focusedSessionId === sid && state.viewMode !== 'chat') {
        dom.sessionTitle.textContent = 'Session';
        dom.sessionInfo.textContent = e.message;
      }
    }
  }

  /** 更新侧栏高亮 */
  function updateSidebar() {
    var sid = state.focusedSessionId;
    H.$$('.session-item').forEach(function(el) {
      el.classList.toggle('active', el.dataset.id === sid);
    });
  }

  /** 更新 URL（深链接支持） */
  function updateURL() {
    var sid = state.focusedSessionId;
    var mode = state.viewMode;

    // 获取当前项目 ID
    var projId = (window.Hermes && window.Hermes.currentProjectId) || '';

    // 构建 hash
    var hash = '';
    if (projId && sid) {
      // 格式：#/p/<projectId>/s/<sessionId>/chat
      hash = '#/p/' + projId + '/s/' + sid + (mode === 'chat' ? '/chat' : '');
    } else if (projId) {
      // 格式：#/p/<projectId>
      hash = '#/p/' + projId;
    } else if (sid) {
      // 格式：#/s/<sessionId> 或 #/s/<sessionId>/chat
      hash = '#/s/' + sid + (mode === 'chat' ? '/chat' : '');
    }

    // S#10: 使用 replaceState 而非 location.hash 避免 hashchange 事件循环
    if (hash) {
      history.replaceState(null, '', hash);
    } else {
      history.replaceState(null, '', location.pathname);
    }
  }

  /** 从 URL hash 恢复会话焦点 */
  function restoreFromURL() {
    var hash = location.hash;
    if (!hash) return null;

    // 新格式：#/p/<projectId>/s/<sessionId>/chat
    // 先尝试匹配带项目的格式
    var match = hash.match(/#\/p\/[^/]+\/s\/([^/]+)(?:\/(chat))?/);
    if (match) {
      return { sid: match[1], mode: match[2] || 'view' };
    }

    // 旧格式或只有会话：#/s/<sessionId>/chat 或 #/s/<sessionId>
    match = hash.match(/#\/s\/([^/]+)(?:\/(chat))?/);
    if (match) {
      return { sid: match[1], mode: match[2] || 'view' };
    }

    return null;
  }

  // ============================================================
  // 新对话管理
  // ============================================================

  /**
   * 创建新会话
   */
  async function createNewChat() {
    try {
      // 当前项目的 workdir 传给 gateway
      var body = {};
      var proj = (H.projects || []).find(function(p) { return p.id === H.currentProjectId; });
      if (proj && proj.path) body.working_dir = proj.path;

      var result = await H.api('/sessions', { method: 'POST', body: body });
      var sid = (result.session && result.session.id) || result.session_id;
      if (!sid) throw new Error('创建会话失败: 未返回 session_id');

      // 初始化空缓存
      setMsgs(sid, []);

      // 乐观插入侧栏条目，防止后端列表 API 延迟导致新会话不可见
      var _title = (result.session && result.session.title) || '新对话';
      insertSessionToList(sid, _title);

      // 刷新完整会话列表
      await H.loadSessions();

      // 兜底：若 loadSessions 后后端列表仍无此会话（创建延迟未落库），
      // 补插一次——renderSessionList 的 innerHTML 全量重建会覆盖上面的乐观条目
      var _inList = (state.sessions || []).some(function(s) { return s.id === sid; });
      if (!_inList) insertSessionToList(sid, _title);

      // 切换到新会话的 chat mode
      await enterSession(sid, 'chat');

      return sid;
    } catch(e) {
      H.toast('创建会话失败: ' + e.message, true);
      return null;
    }
  }

  /** 在侧栏顶部插入新会话条目 */
  function insertSessionToList(sid, title) {
    var dom = H.dom;
    if (!dom.sessionList) return;
    // 避免重复
    if (dom.sessionList.querySelector('.session-item[data-id="' + sid + '"]')) return;
    var esc = H.esc;
    var html = '<div class="session-item active" data-id="' + esc(sid) + '">' +
      '<div class="session-item-title" data-title="' + esc(title) + '">' + esc(title) + '</div>' +
      '<div class="session-item-meta"><span>刚刚</span><span>0 条</span><span>-</span></div>' +
      '<button class="session-delete" title="删除会话">✕</button>' +
      '</div>';
    dom.sessionList.insertAdjacentHTML('afterbegin', html);
    updateSidebar();
  }

  // ============================================================
  // 会话清理
  // ============================================================

  /** 删除会话（清理缓存 + 流 + 侧栏） */
  function cleanupSession(sid) {
    // 中止活跃流
    abortStream(sid);
    // 删除缓存
    delete state.sessionMessages[sid];
    // 如果是当前焦点，回到列表
    if (state.focusedSessionId === sid) {
      state.focusedSessionId = null;
      state.viewMode = 'list';
      H.showView('welcome');
    }
  }

  // ============================================================
  // Exports
  // ============================================================

  H.getMsgs = getMsgs;
  H.setMsgs = setMsgs;
  H.markStale = markStale;
  H.ensureFresh = ensureFresh;
  H.loadMessagesFromAPI = loadMessagesFromAPI;
  H.getStream = getStream;
  H.hasActiveStream = hasActiveStream;
  H.anyActiveStream = anyActiveStream;
  H.abortStream = abortStream;
  H.onStreamComplete = onStreamComplete;
  H.renderFocusedView = renderFocusedView;
  H.enterSession = enterSession;
  H.updateSidebar = updateSidebar;
  H.updateURL = updateURL;
  H.restoreFromURL = restoreFromURL;
  H.createNewChat = createNewChat;
  H.insertSessionToList = insertSessionToList;
  /** 清理已不存在的 session 的缓存（cascade 删除后子 session 缓存可能残留） */
  function purgeStaleCaches() {
    var validIds = {};
    (state.sessions || []).forEach(function(s) { validIds[s.id] = true; });
    var removed = [];
    Object.keys(state.sessionMessages).forEach(function(sid) {
      if (!validIds[sid]) {
        delete state.sessionMessages[sid];
        removed.push(sid);
      }
    });
    // 同时清理 activeStreams 中已不存在的 session
    Object.keys(state.activeStreams).forEach(function(sid) {
      if (!validIds[sid]) {
        abortStream(sid);
      }
    });
    if (removed.length > 0) {
      console.log('[SessionManager] purged stale caches for:', removed);
    }
  }

  H.cleanupSession = cleanupSession;
  H.purgeStaleCaches = purgeStaleCaches;

})();
