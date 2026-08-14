/* ============================================================
   Hermes WebUI - Shared State Module v2
   统一焦点会话模型，消除三元 ID 混乱
   - focusedSessionId 替代 currentSessionId / activeSessionId / chatSessionId
   - viewMode: 'list' | 'view' | 'chat'
   - sessionMessages[sid] 升级为 MessageCache 结构
   ============================================================ */

window.Hermes = window.Hermes || {};

(function() {
  'use strict';

  var H = window.Hermes;

  // ---- Configuration ----
  H.API_BASE = 'http://127.0.0.1:8643';
  H.HERMES_API = 'http://127.0.0.1:8643';

  // ---- MessageCache 工厂 ----
  // sessionMessages[sid] 不再是裸数组，而是缓存对象
  function createCache(messages) {
    return {
      messages: messages || [],
      loadedAt: Date.now(),
      version: 1,
      isStale: false,
    };
  }

  // ---- Application State ----
  H.state = {
    sessions: [],
    focusedSessionId: null,   // 唯一焦点：当前用户正在看的会话
    viewMode: 'list',          // 'list' | 'view' | 'chat'
    sessionMessages: {},        // { sid -> MessageCache }
    activeStreams: {},          // { sid -> StreamState }
    showTools: true,
    providers: [],
    currentProvider: '',
    // ---- Project support ----
    projects: [],               // [{ id, name, path, created_at, session_count }]
    currentProjectId: null,     // 当前选中项目 ID (null = 默认项目)
  };

  // 兼容旧引用的 getter（只读）
  Object.defineProperty(H.state, 'currentSessionId', {
    get: function() { return this.focusedSessionId; },
    set: function(v) { this.focusedSessionId = v; },
    enumerable: true,
  });
  Object.defineProperty(H.state, 'activeSessionId', {
    get: function() { return this.focusedSessionId; },
    set: function(v) { this.focusedSessionId = v; },
    enumerable: true,
  });
  Object.defineProperty(H.state, 'chatSessionId', {
    get: function() { return this.focusedSessionId; },
    set: function(v) { this.focusedSessionId = v; },
    enumerable: true,
  });
  Object.defineProperty(H.state, 'chatMode', {
    get: function() { return this.viewMode === 'chat'; },
    set: function(v) { this.viewMode = v ? 'chat' : 'list'; },
    enumerable: true,
  });
  // 兼容旧引用 state.messages (session view 的消息)
  Object.defineProperty(H.state, 'messages', {
    get: function() {
      var sid = this.focusedSessionId;
      if (!sid) return [];
      var cache = this.sessionMessages[sid];
      return cache ? cache.messages : [];
    },
    set: function(v) {
      var sid = this.focusedSessionId;
      if (sid) {
        // 使用 setMsgs 语义：更新版本号、清除 isStale
        var cache = this.sessionMessages[sid];
        if (cache) {
          cache.messages = v;
          cache.version++;
          cache.isStale = false;
          cache.loadedAt = Date.now();
        } else {
          this.sessionMessages[sid] = createCache(v);
        }
      }
    },
    enumerable: true,
  });

  // ---- DOM Helpers ----
  H.$ = function(sel) { return document.querySelector(sel); };
  H.$$ = function(sel) { return document.querySelectorAll(sel); };

  // ---- DOM References (lazy-init) ----
  H.dom = {};

  H.initDom = function() {
    var $ = H.$;
    var dom = H.dom;

    // Sidebar
    dom.sessionList         = $('#session-list');
    dom.searchInput         = $('#search-input');
    dom.gatewayStatus       = $('#gateway-status');
    dom.globalStreamInd     = $('#global-stream-indicator');
    dom.globalStreamText    = $('#global-stream-text');
    dom.quickStats          = $('#quick-stats');

    // Project selector
    dom.projectSelector     = $('#project-selector');
    dom.projectTrigger      = $('#project-trigger');
    dom.projectDropdown     = $('#project-dropdown');
    dom.projectList         = $('#project-list');
    dom.currentProjectName  = $('#current-project-name');
    dom.currentProjectPath  = $('#current-project-path');

    // Context bar
    dom.ctxModel            = $('#ctx-model');
    dom.ctxTokens           = $('#ctx-tokens');
    dom.ctxProgress         = $('#ctx-progress');
    dom.ctxPercent          = $('#ctx-percent');
    dom.ctxDuration         = $('#ctx-duration');

    // Welcome screen
    dom.welcomeScreen       = $('#welcome-screen');
    dom.newChatStreamingHint = $('#new-chat-streaming-hint');

    // Session view
    dom.sessionView         = $('#session-view');
    dom.sessionTitle        = $('#session-title');
    dom.sessionInfo         = $('#session-info');
    dom.streamingBanner     = $('#streaming-banner');
    dom.messageList         = $('#message-list');

    // Chat mode
    dom.chatMode            = $('#chat-mode');
    dom.chatSessionLabel    = $('#chat-session-label');
    dom.chatMessages        = $('#chat-messages');
    dom.chatInput           = $('#chat-input');
    dom.slashMenu           = $('#slash-menu');
    dom.providerSelect      = $('#provider-select');

    // Admin view (配置中心)
    dom.adminView           = $('#admin-view');
  };

  // ---- Utility Functions ----

  /** HTML-escape — 字符串替换法，避免每次创建 DOM 元素 */
  var ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  H.esc = function esc(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function(c) { return ESC_MAP[c]; });
  };

  H.fmtTime = function fmtTime(ts) {
    if (!ts) return '-';
    var d = new Date(ts * 1000);
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  H.fmtTokens = function fmtTokens(n) {
    if (!n) return '-';
    n = Math.abs(n);
    if (n >= 1e9) { var s = n / 1e9; return (s < 10 ? s.toFixed(2) : s < 100 ? s.toFixed(1) : s.toFixed(0)).replace(/\.0+$|(\.\d*[1-9])0+$/, '$1') + 'B'; }
    if (n >= 1e6) { var s = n / 1e6; return (s < 10 ? s.toFixed(2) : s < 100 ? s.toFixed(1) : s.toFixed(0)).replace(/\.0+$|(\.\d*[1-9])0+$/, '$1') + 'M'; }
    if (n >= 1e3) { var s = n / 1e3; return (s < 10 ? s.toFixed(2) : s < 100 ? s.toFixed(1) : s.toFixed(0)).replace(/\.0+$|(\.\d*[1-9])0+$/, '$1') + 'K'; }
    return String(n);
  };

  H.fmtDuration = function fmtDuration(start, end) {
    if (!start) return '-';
    var e = end || Date.now() / 1000;
    var diff = Math.floor(e - start);
    if (diff < 60) return diff + 's';
    if (diff < 3600) return Math.floor(diff / 60) + 'm';
    return Math.floor(diff / 3600) + 'h' + Math.floor((diff % 3600) / 60) + 'm';
  };

  H.truncate = function truncate(str, max) {
    if (!str || str.length <= max) return str;
    return str.substring(0, max) + '...';
  };

  // ---- Stream Management ----

  /** 定时清理过期流，替代事件驱动方式 */
  var _cleanupTimer = null;
  function startCleanupTimer() {
    if (_cleanupTimer) return;
    _cleanupTimer = setInterval(function() {
      var now = Date.now();
      var MAX_KEEP_MS = 5 * 60 * 1000;
      var activeStreams = H.state.activeStreams;
      Object.keys(activeStreams).forEach(function(key) {
        var s = activeStreams[key];
        if (s.finished && s.finishedAt && (now - s.finishedAt > MAX_KEEP_MS)) {
          delete activeStreams[key];
        }
      });
    }, 60000);
  }

  /** 更新 streaming hints: session view banner、welcome screen hint、全局指示器 */
  H.updateStreamingHints = function updateStreamingHints() {
    var state = H.state;
    var dom = H.dom;
    if (!dom.streamingBanner) return;

    // 统计活跃流数量
    var activeCount = 0;
    Object.values(state.activeStreams).forEach(function(s) {
      if (!s.finished) activeCount++;
    });

    // 全局活跃流指示器（跨项目可见）
    if (dom.globalStreamInd) {
      if (activeCount > 0) {
        dom.globalStreamInd.style.display = 'inline-flex';
        if (dom.globalStreamText) {
          dom.globalStreamText.textContent = activeCount + ' 个会话运行中';
        }
      } else {
        dom.globalStreamInd.style.display = 'none';
      }
    }

    // Session view banner: 活跃流在当前查看的会话
    var focusedStream = state.focusedSessionId ? state.activeStreams[state.focusedSessionId] : null;
    if (focusedStream && !focusedStream.finished && state.viewMode !== 'chat') {
      dom.streamingBanner.style.display = 'flex';
    } else {
      dom.streamingBanner.style.display = 'none';
    }

    // Welcome screen hint: 有任何活跃的新对话流
    var hasActiveStream = activeCount > 0;
    if (hasActiveStream && state.viewMode === 'list') {
      dom.newChatStreamingHint.style.display = 'block';
    } else {
      dom.newChatStreamingHint.style.display = 'none';
    }
  };

  // 启动清理定时器
  startCleanupTimer();

  // ---- Answer Block Counter ----
  H.answerBlockCounter = 0;

  // ---- Toast Notification ----
  H.toast = function toast(msg, isError) {
    var el = document.createElement('div');
    el.className = 'memory-toast' + (isError ? ' error' : '');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function() {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 3000);
  };

  // ---- Export MessageCache factory ----
  H.createCache = createCache;

})();
