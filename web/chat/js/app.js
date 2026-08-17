/* ============================================================
   Hermes WebUI - Entry Point v3
   Initializes the application, binds events, bootstraps modules.
   
   改动：
   - 使用 focusedSessionId 替代三元 ID
   - 新对话使用 createNewChat（先创建空会话）
   - URL 路由恢复（hash-based deep linking）
   ============================================================ */

window.Hermes = window.Hermes || {};

(function() {
  'use strict';

  const $ = window.Hermes.$;
  const state = window.Hermes.state;
  const dom = window.Hermes.dom;

  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }

  // ---- Global Event Delegation ----
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const parent = btn.parentElement;
    if (!parent) return;

    if (action === 'toggle-ow-tl') {
      const tlContainer = btn.parentElement;
      if (tlContainer && tlContainer.classList.contains('ow-tl')) {
        const items = Array.from(tlContainer.querySelectorAll('.ow-tl-item'));
        const idx = items.indexOf(btn);
        const owTools = tlContainer.parentElement;
        if (owTools) {
          const panels = owTools.querySelectorAll('.ow-panels .ow-ep');
          if (panels[idx]) {
            // Close all other panels, toggle the clicked one
            const wasShown = panels[idx].classList.contains('ow-show');
            panels.forEach(p => p.classList.remove('ow-show'));
            if (!wasShown) panels[idx].classList.add('ow-show');
          }
        }
      }
    } else if (action === 'toggle-tool-result') {
      if (parent.classList.contains('tool-result-expanded')) {
        parent.classList.remove('tool-result-expanded');
        parent.classList.add('tool-result-collapsed');
      } else if (parent.classList.contains('tool-result-collapsed')) {
        parent.classList.remove('tool-result-collapsed');
      } else {
        parent.classList.add('tool-result-expanded');
      }
    } else if (action === 'toggle-thinking') {
      const block = parent;
      if (block.classList.contains('thinking-expanded')) {
        block.classList.remove('thinking-expanded');
        block.classList.add('thinking-collapsed');
      } else if (block.classList.contains('thinking-collapsed')) {
        block.classList.remove('thinking-collapsed');
      } else {
        block.classList.add('thinking-expanded');
      }
    } else if (action === 'toggle-tools-collapsed') {
      parent.classList.toggle('tools-collapsed');
    }
  });

  // ---- Event Bindings ----
  function bindEvents() {
    const H = window.Hermes;

    // Search sessions
    let searchTimer;
    dom.searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => H.searchSessions(e.target.value.trim()), 300);
    });

    // E#7: scroll-to-bottom button visibility
    if (dom.chatMessages) {
      dom.chatMessages.addEventListener('scroll', function() {
        if (H._updateScrollBtn) H._updateScrollBtn();
      }, { passive: true });
    }

    // E#15: 编辑重发 — 点击用户消息的编辑按钮
    dom.chatMessages.addEventListener('click', function(e) {
      var btn = e.target.closest('.turn-edit-btn');
      if (!btn) return;
      var msgId = btn.dataset.msgId;
      if (!msgId) return;
      // 找到对应的 user 消息内容
      var sid = state.focusedSessionId;
      if (!sid) return;
      var msgs = H.getMsgs(sid);
      if (!msgs) return;
      for (var i = 0; i < msgs.length; i++) {
        if (String(msgs[i].id || '') === msgId && msgs[i].role === 'user') {
          dom.chatInput.value = msgs[i].content || '';
          dom.chatInput.focus();
          autoResize(dom.chatInput);
          H.toast('已载入消息，修改后发送');
          return;
        }
      }
    });

    // New chat — 使用 createNewChat（先创建空会话）
    $('#btn-new-chat').addEventListener('click', () => H.createNewChat());

    // Resume chat
    $('#btn-resume').addEventListener('click', () => {
      if (state.focusedSessionId) H.enterSession(state.focusedSessionId, 'chat');
    });

    // Exit chat
    $('#btn-exit-chat').addEventListener('click', H.exitChatMode);

    // View streaming content (session view banner)
    $('#btn-view-stream').addEventListener('click', () => {
      if (state.focusedSessionId) H.enterSession(state.focusedSessionId, 'chat');
    });

    // Resume new chat stream (welcome screen hint)
    $('#btn-resume-new-stream').addEventListener('click', () => {
      // 找到任意活跃流
      const streams = state.activeStreams;
      for (const sid of Object.keys(streams)) {
        if (!streams[sid].finished) {
          H.enterSession(sid, 'chat');
          return;
        }
      }
    });

    // Toggle tools display
    $('#btn-toggle-tools').addEventListener('click', function() {
      state.showTools = !state.showTools;
      this.classList.toggle('active', state.showTools);
      if (state.focusedSessionId && state.viewMode !== 'chat') {
        const msgs = H.getMsgs(state.focusedSessionId);
        if (msgs) H.renderMessages(msgs, dom.messageList);
      }
    });

    // Export session
    $('#btn-export-session').addEventListener('click', () => {
      if (state.focusedSessionId) H.exportSession(state.focusedSessionId);
    });

    // Fork session
    $('#btn-fork-session').addEventListener('click', async () => {
      if (!state.focusedSessionId) return;
      const btn = $('#btn-fork-session');
      btn.disabled = true;
      btn.textContent = '⏳ Forking...';
      try {
        const data = await H.api('/sessions/' + state.focusedSessionId + '/fork', { method: 'POST' });
        await H.loadSessions();
        H.enterSession(data.session_id, 'chat');
      } catch (e) {
        alert('Fork 失败: ' + e.message);
      } finally {
        btn.disabled = false;
        btn.textContent = '🔀 开新会话';
      }
    });

    // Delete session
    $('#btn-delete-session').addEventListener('click', () => {
      if (state.focusedSessionId) H.deleteSession(state.focusedSessionId);
    });

    // Send message
    $('#btn-send').addEventListener('click', H.sendMessage);

    // Stop generation
    $('#btn-stop').addEventListener('click', () => {
      H.abortCurrentStream();
      dom.chatInput.disabled = false;
      dom.chatInput.focus();
    });
    dom.chatInput.addEventListener('keydown', (e) => {
      if (H.slashState && H.slashState().visible) {
        const ss = H.slashState();
        if (e.key === 'ArrowDown') { e.preventDefault(); H.slashNavigate(1); return; }
        if (e.key === 'ArrowUp') { e.preventDefault(); H.slashNavigate(-1); return; }
        if (e.key === 'Enter' || e.key === 'Tab') {
          if (ss.activeIndex >= 0) { e.preventDefault(); H.slashSelect(); return; }
        }
        if (e.key === 'Escape') { H.hideSlashMenu(); return; }
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        H.sendMessage();
      }
      // E#11: 上/下箭头浏览输入历史（仅在非斜杠菜单模式且光标在首/末时）
      if (!H.slashState || !H.slashState().visible) {
        if (e.key === 'ArrowUp' && dom.chatInput.selectionStart === 0) {
          var prev = H.getPrevInputHistory();
          if (prev !== null) { e.preventDefault(); dom.chatInput.value = prev; dom.chatInput.setSelectionRange(0, 0); }
        }
        if (e.key === 'ArrowDown' && dom.chatInput.selectionStart === dom.chatInput.value.length) {
          var next = H.getNextInputHistory();
          if (next !== null) { e.preventDefault(); dom.chatInput.value = next; }
        }
      }
    });

    // E#9: 粘贴图片
    dom.chatInput.addEventListener('paste', function(e) {
      var items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      for (var i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.indexOf('image/') === 0) {
          e.preventDefault();
          var file = items[i].getAsFile();
          if (file) H.handleImageFile(file);
          return;
        }
      }
    });

    // E#10: 拖拽文件
    var _dragCounter = 0;
    dom.chatMessages.addEventListener('dragenter', function(e) {
      e.preventDefault();
      _dragCounter++;
      document.body.classList.add('drag-active');
    });
    dom.chatMessages.addEventListener('dragleave', function(e) {
      _dragCounter--;
      if (_dragCounter <= 0) { _dragCounter = 0; document.body.classList.remove('drag-active'); }
    });
    dom.chatMessages.addEventListener('dragover', function(e) { e.preventDefault(); });
    dom.chatMessages.addEventListener('drop', function(e) {
      e.preventDefault();
      _dragCounter = 0;
      document.body.classList.remove('drag-active');
      var files = e.dataTransfer && e.dataTransfer.files;
      if (!files || files.length === 0) return;
      for (var i = 0; i < files.length; i++) {
        if (files[i].type && files[i].type.indexOf('image/') === 0) {
          H.handleImageFile(files[i]);
        }
      }
    });

    dom.chatInput.addEventListener('input', function() {
      autoResize(this);
      const sq = H.getSlashQuery();
      if (sq && sq.query.startsWith('/')) {
        const filtered = H.filterSlashCommands(sq.query);
        H.renderSlashMenu(filtered, sq.query);
      } else {
        H.hideSlashMenu();
      }
    });

    // Click outside to close slash menu
    document.addEventListener('click', (e) => {
      const ss = H.slashState ? H.slashState() : null;
      if (ss && ss.visible && !dom.slashMenu.contains(e.target) && e.target !== dom.chatInput) {
        H.hideSlashMenu();
      }
    });

    // Theme toggle
    const btnTheme = document.getElementById('btn-theme');
    if (btnTheme) btnTheme.addEventListener('click', toggleTheme);

    // URL hash change listener (deep linking)
    window.addEventListener('hashchange', handleHashChange);
  }

  // ---- URL hash routing ----
  function handleHashChange() {
    // 解析项目参数 #/p/<projectId>
    const projMatch = location.hash.match(/#\/p\/([^/]+)/);
    if (projMatch && window.Hermes.switchProject) {
      window.Hermes.switchProject(decodeURIComponent(projMatch[1]));
    }

    // 解析会话参数 #/s/<sessionId>
    const route = window.Hermes.restoreFromURL();
    if (route) {
      window.Hermes.enterSession(route.sid, route.mode);
    }
  }

  // ---- Theme ----
  function initTheme() {
    const saved = localStorage.getItem('hermes-theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
    updateThemeIcon();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('hermes-theme')) {
        document.documentElement.classList.toggle('dark', e.matches);
        updateThemeIcon();
      }
    });
  }

  function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('hermes-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    updateThemeIcon();
  }

  function updateThemeIcon() {
    const btn = document.getElementById('btn-theme');
    if (btn) btn.textContent = document.documentElement.classList.contains('dark') ? '☀️' : '🌙';
  }

  // ---- Initialization ----
  async function init() {
    window.Hermes.initDom();

    initTheme();
    bindEvents();
    window.Hermes.initSessionListEvents();
    window.Hermes.initMessageActions();
    window.Hermes.initShortcuts();

    // 初始化项目管理器（异步加载项目列表）
    if (window.Hermes.initProjects) {
      await window.Hermes.initProjects();
    }
    // 绑定项目选择器事件
    if (window.Hermes.bindProjectEvents) window.Hermes.bindProjectEvents();

    await window.Hermes.loadSessions();
    window.Hermes.renderQuickStats();
    window.Hermes.checkGateway();
    window.Hermes.loadContextInfo();
    window.Hermes.loadProviders();

    // P#9: 存储 interval ID，支持清理和可见性优化
    var _gatewayTimer = setInterval(window.Hermes.checkGateway, 30000);
    var _ctxTimer = setInterval(function() {
      // 传入当前焦点会话 ID，而非 undefined
      window.Hermes.loadContextInfo(state.focusedSessionId);
    }, 15000);

    // P#9: 页面不可见时暂停轮询，可见时立即检查
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) {
        clearInterval(_gatewayTimer);
        clearInterval(_ctxTimer);
      } else {
        window.Hermes.checkGateway();
        window.Hermes.loadContextInfo(state.focusedSessionId, true);
        _gatewayTimer = setInterval(window.Hermes.checkGateway, 30000);
        _ctxTimer = setInterval(function() {
          window.Hermes.loadContextInfo(state.focusedSessionId);
        }, 15000);
      }
    });

    // 配置中心入口（侧边栏四个导航项）
    document.querySelectorAll('.sidebar-nav .nav-btn[data-admin]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.Hermes.openAdmin(btn.dataset.admin);
      });
    });

    // Provider trigger — 打开模型选择弹框
    const providerTrigger = document.getElementById('provider-trigger');
    if (providerTrigger) {
      providerTrigger.addEventListener('click', function(e) {
        e.stopPropagation();
        window.Hermes.openModelModal();
      });
    }

    // Restore from URL hash (deep linking)
    // 项目已经在 initProjects 中恢复了，这里只需要恢复会话
    const route = window.Hermes.restoreFromURL();
    if (route) {
      window.Hermes.enterSession(route.sid, route.mode);
    }

    // S#11: 离线检测
    var _offlineBar = null;
    function _getOfflineBar() {
      if (_offlineBar) return _offlineBar;
      _offlineBar = document.createElement('div');
      _offlineBar.className = 'offline-bar';
      _offlineBar.textContent = '⚠ 网络已断开';
      _offlineBar.style.display = 'none';
      document.body.insertBefore(_offlineBar, document.body.firstChild);
      return _offlineBar;
    }
    window.addEventListener('offline', function() {
      var bar = _getOfflineBar();
      bar.style.display = 'block';
    });
    window.addEventListener('online', function() {
      var bar = _getOfflineBar();
      bar.style.display = 'none';
      // 恢复后立即检查 gateway 状态
      H.checkGateway();
      H.loadContextInfo(state.focusedSessionId, true);
    });

    // E#14: 消息搜索 (Ctrl+F)
    var _searchBar = null;
    var _searchMatches = [];
    var _searchIdx = -1;

    function _getSearchBar() {
      if (_searchBar) return _searchBar;
      _searchBar = document.createElement('div');
      _searchBar.className = 'chat-search-bar';
      _searchBar.style.display = 'none';
      _searchBar.innerHTML = '<input type="text" class="chat-search-input" placeholder="搜索消息..." /><span class="chat-search-count"></span><button class="chat-search-close">✕</button>';
      var chatView = document.getElementById('chat-view') || document.querySelector('.chat-main');
      if (chatView) {
        chatView.style.position = 'relative';
        chatView.insertBefore(_searchBar, chatView.firstChild);
      }
      var input = _searchBar.querySelector('.chat-search-input');
      var countEl = _searchBar.querySelector('.chat-search-count');
      var closeBtn = _searchBar.querySelector('.chat-search-close');

      input.addEventListener('input', function() {
        _doSearch(input.value);
      });
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); _navSearch(e.shiftKey ? -1 : 1); }
        if (e.key === 'Escape') { _closeSearch(); }
      });
      closeBtn.addEventListener('click', _closeSearch);
      return _searchBar;
    }

    function _doSearch(query) {
      _searchMatches = [];
      _searchIdx = -1;
      var countEl = _searchBar.querySelector('.chat-search-count');
      if (!query || query.length < 2) { countEl.textContent = ''; _clearHighlight(); return; }
      var container = dom.chatMessages;
      if (!container) return;
      var turns = container.querySelectorAll('.turn');
      var lowerQ = query.toLowerCase();
      turns.forEach(function(turn) {
        var text = turn.textContent.toLowerCase();
        if (text.indexOf(lowerQ) >= 0) {
          _searchMatches.push(turn);
        }
      });
      countEl.textContent = _searchMatches.length > 0 ? '1/' + _searchMatches.length : '无结果';
      if (_searchMatches.length > 0) {
        _searchIdx = 0;
        _scrollToMatch();
      }
    }

    function _navSearch(dir) {
      if (_searchMatches.length === 0) return;
      _searchIdx = (_searchIdx + dir + _searchMatches.length) % _searchMatches.length;
      _scrollToMatch();
      var countEl = _searchBar.querySelector('.chat-search-count');
      countEl.textContent = (_searchIdx + 1) + '/' + _searchMatches.length;
    }

    function _scrollToMatch() {
      if (_searchIdx < 0 || _searchIdx >= _searchMatches.length) return;
      var el = _searchMatches[_searchIdx];
      _clearHighlight();
      el.classList.add('search-highlight');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function _clearHighlight() {
      var container = dom.chatMessages;
      if (!container) return;
      container.querySelectorAll('.search-highlight').forEach(function(el) {
        el.classList.remove('search-highlight');
      });
    }

    function _openSearch() {
      var bar = _getSearchBar();
      bar.style.display = 'flex';
      var input = bar.querySelector('.chat-search-input');
      input.value = '';
      input.focus();
    }

    function _closeSearch() {
      if (!_searchBar) return;
      _searchBar.style.display = 'none';
      _clearHighlight();
      _searchMatches = [];
    }

    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        if (state.viewMode === 'chat') {
          e.preventDefault();
          _openSearch();
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
