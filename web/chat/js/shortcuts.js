/* ============================================================
   Hermes WebUI - Global Shortcuts & Search Module
   Ctrl+K: 全局搜索  Ctrl+N: 新对话  ? : 快捷键帮助
   ============================================================ */

window.Hermes = window.Hermes || {};

(function() {
  'use strict';

  const $ = window.Hermes.$;
  const esc = window.Hermes.esc;
  const api = window.Hermes.api;
  const fmtTime = window.Hermes.fmtTime;

  // ---- State ----
  let searchOpen = false;
  let helpOpen = false;
  let searchResults = [];
  let searchTimer = null;

  // ---- DOM: 搜索弹窗 ----
  function ensureSearchDOM() {
    if ($('#global-search-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'global-search-overlay';
    overlay.className = 'gs-overlay';
    overlay.innerHTML = `
      <div class="gs-dialog">
        <div class="gs-input-wrap">
          <span class="gs-icon">🔍</span>
          <input type="text" id="gs-input" class="gs-input" placeholder="搜索会话..." autocomplete="off" />
          <kbd class="gs-kbd">Esc</kbd>
        </div>
        <div id="gs-results" class="gs-results"></div>
        <div class="gs-footer">
          <span>↑↓ 导航</span><span>Enter 打开</span><span>Esc 关闭</span>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    // 点击遮罩关闭
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeSearch();
    });

    // 输入事件
    const input = $('#gs-input');
    input.addEventListener('input', function() {
      clearTimeout(searchTimer);
      const q = this.value.trim();
      if (q.length < 2) {
        searchResults = [];
        renderSearchResults([]);
        return;
      }
      searchTimer = setTimeout(() => doSearch(q), 250);
    });

    // 键盘导航
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') { e.preventDefault(); closeSearch(); return; }
      if (e.key === 'Enter') { e.preventDefault(); selectActiveResult(); return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        navigateResults(e.key === 'ArrowDown' ? 1 : -1);
      }
    });
  }

  // ---- DOM: 快捷键帮助 ----
  function ensureHelpDOM() {
    if ($('#shortcuts-help-overlay')) return;

    const shortcuts = [
      { keys: 'Ctrl + K', desc: '全局搜索会话' },
      { keys: 'Ctrl + N', desc: '新对话' },
      { keys: 'Shift + ?', desc: '显示快捷键帮助' },
      { keys: 'Escape', desc: '关闭弹窗/退出对话' },
      { keys: 'Enter', desc: '发送消息' },
      { keys: 'Shift + Enter', desc: '换行' },
      { keys: '/', desc: '斜杠命令 (对话中)' },
    ];

    const overlay = document.createElement('div');
    overlay.id = 'shortcuts-help-overlay';
    overlay.className = 'gs-overlay';
    overlay.innerHTML = `
      <div class="gs-dialog gs-help-dialog">
        <div class="gs-help-header">
          <span>⌨️ 快捷键</span>
          <kbd class="gs-kbd" onclick="document.getElementById('shortcuts-help-overlay').style.display='none'">Esc</kbd>
        </div>
        <div class="gs-help-list">
          ${shortcuts.map(s => `
            <div class="gs-help-row">
              <span class="gs-help-desc">${esc(s.desc)}</span>
              <kbd class="gs-help-key">${esc(s.keys)}</kbd>
            </div>`).join('')}
        </div>
      </div>`;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) { overlay.style.display = 'none'; helpOpen = false; }
    });
  }

  // ---- Search Logic ----
  async function doSearch(q) {
    try {
      const { data } = await api('/search?q=' + encodeURIComponent(q));
      searchResults = Array.isArray(data) ? data : [];
    } catch (e) {
      searchResults = [];
    }
    renderSearchResults(searchResults);
  }

  function renderSearchResults(results) {
    const container = $('#gs-results');
    if (!container) return;

    if (results.length === 0) {
      const input = $('#gs-input');
      if (input && input.value.trim().length >= 2) {
        container.innerHTML = '<div class="gs-empty">没有匹配的会话</div>';
      } else {
        container.innerHTML = '<div class="gs-empty">输入关键词搜索会话 (至少 2 字符)</div>';
      }
      return;
    }

    container.innerHTML = results.map((s, i) => {
      const title = s.title || 'Session ' + (s.id || '').substring(0, 16);
      const active = i === 0 ? ' gs-active' : '';
      return `
        <div class="gs-result${active}" data-sid="${esc(s.id)}" data-idx="${i}">
          <div class="gs-result-title">${esc(title)}</div>
          <div class="gs-result-meta">
            <span>${fmtTime(s.started_at)}</span>
            <span>${s.message_count || 0} 条消息</span>
          </div>
        </div>`;
    }).join('');

    // 绑定点击
    container.querySelectorAll('.gs-result').forEach(el => {
      el.addEventListener('click', function() {
        closeSearch();
        window.Hermes.selectSession(this.dataset.sid);
      });
    });
  }

  function navigateResults(dir) {
    const items = document.querySelectorAll('.gs-result');
    if (items.length === 0) return;
    let activeIdx = -1;
    items.forEach((el, i) => { if (el.classList.contains('gs-active')) activeIdx = i; });
    items.forEach(el => el.classList.remove('gs-active'));

    activeIdx += dir;
    if (activeIdx < 0) activeIdx = items.length - 1;
    if (activeIdx >= items.length) activeIdx = 0;
    items[activeIdx].classList.add('gs-active');
    items[activeIdx].scrollIntoView({ block: 'nearest' });
  }

  function selectActiveResult() {
    const active = document.querySelector('.gs-result.gs-active');
    if (active) {
      closeSearch();
      window.Hermes.selectSession(active.dataset.sid);
    }
  }

  // ---- Open / Close ----
  function openSearch() {
    ensureSearchDOM();
    searchOpen = true;
    const overlay = $('#global-search-overlay');
    overlay.style.display = 'flex';
    const input = $('#gs-input');
    input.value = '';
    searchResults = [];
    renderSearchResults([]);
    setTimeout(() => input.focus(), 50);
  }

  function closeSearch() {
    searchOpen = false;
    const overlay = $('#global-search-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  function toggleHelp() {
    ensureHelpDOM();
    helpOpen = !helpOpen;
    const overlay = $('#shortcuts-help-overlay');
    overlay.style.display = helpOpen ? 'flex' : 'none';
  }

  // ---- Global Key Handler ----
  function initShortcuts() {
    document.addEventListener('keydown', function(e) {
      // Ctrl+K / Cmd+K: 全局搜索
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (searchOpen) closeSearch(); else openSearch();
        return;
      }

      // Ctrl+N / Cmd+N: 新对话
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        window.Hermes.createNewChat();
        return;
      }

      // Shift+?: 快捷键帮助 (不在输入框中时)
      if (e.key === '?' && e.shiftKey && !isInInput(e)) {
        e.preventDefault();
        toggleHelp();
        return;
      }

      // Escape: 关闭弹窗
      if (e.key === 'Escape') {
        if (searchOpen) { e.preventDefault(); closeSearch(); return; }
        if (helpOpen) { e.preventDefault(); helpOpen = false; const o = $('#shortcuts-help-overlay'); if (o) o.style.display = 'none'; return; }
      }
    });
  }

  function isInInput(e) {
    const t = e.target;
    return t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable;
  }

  // ---- Export ----
  window.Hermes.openSearch = openSearch;
  window.Hermes.closeSearch = closeSearch;
  window.Hermes.initShortcuts = initShortcuts;

})();
