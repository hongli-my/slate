// app.js — Session 列表页逻辑
// 依赖：utils.js（apiFetch / formatXxx / escapeHtml 等）

(function () {
  'use strict';

  // 刷新间隔候选（秒）。0 表示关闭
  const DEFAULT_REFRESH_SEC = 30;
  const REFRESH_TICK_MS = 1000; // 倒计时刷新频率

  let allSessions = [];          // 原始 session 列表
  let searchTerm = '';
  let timeRange = '7d';         // today / 7d / 30d / all（默认 7d，可被 localStorage 覆盖）
  let typeFilter = 'all';       // all / opencode / pi（Agent 类型过滤）
  let refreshSec = DEFAULT_REFRESH_SEC;
  let tabActive = true;                   // 父 dashboard 中本 iframe 是否激活（独立页恒 true）
  let browserVisible = !document.hidden;  // 浏览器 tab 是否在前台
  let refreshRunning = false;             // 自动刷新定时器是否在运行

  // 分页状态
  let currentPage = 1;           // 当前页（从 1 开始）
  let pageSize = 20;             // 每页条数

  let refreshTimer = null;
  let countdownTimer = null;
  let nextRefreshAt = 0;

  const el = {
    statsChips:      document.getElementById('stats-chips'),
    searchInput:     document.getElementById('search-input'),
    timeRange:       document.getElementById('time-range'),
    typeFilter:      document.getElementById('type-filter'),
    refreshInterval: document.getElementById('refresh-interval'),
    refreshText:     document.getElementById('refresh-text'),
    refreshIndicator:document.getElementById('refresh-indicator'),
    tableState:      document.getElementById('table-state'),
    table:           document.getElementById('sessions-table'),
    body:            document.getElementById('sessions-body'),
    pagination:      document.getElementById('pagination'),
    paginationInfo:  document.getElementById('pagination-info'),
    pageNumbers:     document.getElementById('page-numbers'),
    pageSizeSelect:  document.getElementById('page-size-select'),
    prevBtn:         document.getElementById('page-prev'),
    nextBtn:         document.getElementById('page-next'),
    tableWrap:       document.querySelector('.table-wrap'),
  };

  /* ============================================================
   * 统计 chip 渲染
   * ========================================================== */
  function renderStats(stats) {
    if (!stats) return;
    el.statsChips.innerHTML =
      '<span class="chip chip-accent">'
      + '<span class="chip-label">today</span>'
      + '<span class="chip-val">' + (stats.today_sessions ?? 0) + '</span>'
      + '<span class="chip-label">sessions</span>'
      + '</span>'
      + '<span class="chip chip-green">'
      + '<span class="chip-label">today cost</span>'
      + '<span class="chip-val">' + formatCost(stats.today_cost) + '</span>'
      + '</span>'
      + '<span class="chip">'
      + '<span class="chip-label">total spans</span>'
      + '<span class="chip-val">' + formatNumber(stats.total_spans ?? 0) + '</span>'
      + '</span>';
  }

  /* ============================================================
   * 表格行渲染
   * ========================================================== */
  function titleText(s) {
    if (s.title) return truncate(s.title, 60);
    return (s.session_id || '').slice(0, 12);
  }

  // 字符串 → HSL 色相，用于主子分组色条：同组主子同色，不同组明显区分。
  function hashColor(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return 'hsl(' + (Math.abs(h) % 360) + ', 65%, 55%)';
  }

  // depth: 0=主 session，1=子 session；isLast=是否父的末子（控制 └ vs ├ 树枝形态）
  function renderRow(s, idx, depth, isLast) {
    depth = depth || 0;
    const isChild = depth > 0;
    const tr = document.createElement('tr');
    // 错峰载入动画，限制最大延迟避免长列表过慢
    tr.style.animationDelay = Math.min(idx * 18, 380) + 'ms';
    tr.dataset.id = s.session_id;
    if (isChild) tr.className = isLast ? 'row-child row-last' : 'row-child';

    // 左侧色条：同组主子同色。主行用 session_id，子行用 parent_session_id
    // （= 父 session_id），保证同组同色；孤儿子 session 在 buildTree 中作为
    // 顶层行（depth=0），自然用自身 session_id 算色。
    const barId = isChild ? (s.parent_session_id || s.session_id) : s.session_id;
    tr.style.setProperty('--bar', hashColor(barId));

    const titleFull = s.title || s.session_id || '';

    // #4 状态 chip：有 ERROR span 则 ERROR，否则 OK
    const statusCell = statusBadge(getSessionStatus(s));

    // Agent chip
    const agentCell = s.agent
      ? '<span class="tag tag-accent">' + escapeHtml(s.agent) + '</span>'
      : '<span class="dash">-</span>';

    // Model: provider / model（model 名截断）
    const modelCell = (s.model_provider || s.model_id)
      ? '<span class="cell-mono">' + escapeHtml(s.model_provider || '?')
        + ' / ' + escapeHtml(truncate(s.model_id || '', 22)) + '</span>'
      : '<span class="dash">-</span>';

    // Profile chip
    const profileCell = s.profile
      ? '<span class="tag tag-llm">' + escapeHtml(s.profile) + '</span>'
      : '<span class="dash">-</span>';

    const costC = costColor(s.total_cost);

    // Title 列：主子行统一渲染，不缩进、不连线，Title 完全对齐
    tr.innerHTML =
      '<td>' + statusCell + '</td>'
      + '<td>'
      + '<div class="cell-title" title="' + escapeHtml(titleFull) + '">' + escapeHtml(titleText(s)) + '</div>'
      + '<div class="cell-id">' + escapeHtml((s.session_id || '').slice(0, 20)) + '</div>'
      + '</td>'
      + '<td>' + agentCell + '</td>'
      + '<td>' + modelCell + '</td>'
      + '<td>' + profileCell + '</td>'
      + '<td class="cell-mono">' + formatTokens(s.total_input_tokens, s.total_output_tokens) + '</td>'
      + '<td class="cell-cost" style="color:' + costC + '">' + formatCost(s.total_cost) + '</td>'
      + '<td class="cell-mono">' + (s.span_count ?? 0) + '</td>'
      + '<td class="cell-mono">' + (s.llm_call_count ?? 0) + '</td>'
      + '<td class="cell-mono">' + (s.tool_call_count ?? 0) + '</td>'
      + '<td class="cell-time" title="' + escapeHtml(formatISO(s.last_seen_ms)) + '">'
      + formatRelativeTime(s.last_seen_ms) + '</td>';

    tr.addEventListener('click', () => {
      location.href = '/otel/session.html?id=' + encodeURIComponent(s.session_id);
    });

    return tr;
  }

  function filterSessions(list, term, range, type) {
    let out = list;
    // 类型过滤
    if (type && type !== 'all') {
      out = out.filter(s => s.agent_type === type);
    }
    // 时间范围过滤（客户端，基于 last_seen_ms）
    if (range && range !== 'all') {
      const now = Date.now();
      let fromMs = 0;
      if (range === 'today') {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        fromMs = d.getTime();
      } else if (range === '7d')  fromMs = now - 7  * 24 * 3600 * 1000;
      else if (range === '30d') fromMs = now - 30 * 24 * 3600 * 1000;
      out = out.filter(s => (s.last_seen_ms || 0) >= fromMs);
    }
    // 关键字过滤（树感知）：
    //  - 匹配自身的 session 保留
    //  - 父 session 匹配 → 其所有子 session 一并保留（树形过滤标准行为：
    //    父命中即展开整棵子树，即使子不匹配搜索词）
    //  - 仅子 session 匹配而父未匹配 → 子保留，父不保留；
    //    buildTree 中因其父不在列表，会作为孤儿顶层行（不缩进）显示
    if (term) {
      const t = term.toLowerCase();
      const matchFn = s =>
        (s.title || '').toLowerCase().includes(t) ||
        (s.agent || '').toLowerCase().includes(t) ||
        (s.model_id || '').toLowerCase().includes(t) ||
        (s.model_provider || '').toLowerCase().includes(t) ||
        (s.session_id || '').toLowerCase().includes(t);
      const matched = out.filter(matchFn);
      const matchedIds = new Set(matched.map(s => s.session_id));
      out = out.filter(s =>
        matchedIds.has(s.session_id) ||
        (s.parent_session_id && matchedIds.has(s.parent_session_id))
      );
    }
    return out;
  }

  /* ============================================================
   * 扁平列表 → 主/子树形分组
   * 主 session：parent_session_id 为 null，或指向的父不在当前列表（孤儿子 session）
   * 子 session：parent_session_id 指向的父在当前列表
   * ========================================================== */
  function buildTree(list) {
    const idSet = new Set(list.map(s => s.session_id));
    const childrenMap = {};          // parentId -> [child sessions]
    const roots = [];
    for (const s of list) {
      if (s.parent_session_id && idSet.has(s.parent_session_id)) {
        (childrenMap[s.parent_session_id] = childrenMap[s.parent_session_id] || []).push(s);
      } else {
        roots.push(s);
      }
    }
    // 子 session 按 first_seen_ms ASC（缺失则 last_seen_ms），先创建的在前
    for (const k in childrenMap) {
      childrenMap[k].sort((a, b) =>
        (a.first_seen_ms || a.last_seen_ms || 0) - (b.first_seen_ms || b.last_seen_ms || 0));
    }
    // 主 session 按 last_seen_ms DESC（保持原有排序）
    roots.sort((a, b) => (b.last_seen_ms || 0) - (a.last_seen_ms || 0));
    return roots.map(r => ({ session: r, children: childrenMap[r.session_id] || [] }));
  }

  function renderTable() {
    const filtered = filterSessions(allSessions, searchTerm, timeRange, typeFilter);

    if (filtered.length === 0) {
      el.table.style.display = 'none';
      el.pagination.style.display = 'none';
      if (allSessions.length === 0) {
        el.tableState.innerHTML =
          '<div class="empty">'
          + '<div class="empty-icon">'
          + '<svg width="26" height="26" viewBox="0 0 26 26" fill="none">'
          + '<path d="M2 13h4l2.5-8 4 16 2.5-8H24" stroke="currentColor" '
          + 'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
          + '</svg></div>'
          + '<div class="empty-title">No traces yet</div>'
          + '<div class="empty-desc">Make sure your OpenCode plugin is configured '
          + 'and exporting to this OTel endpoint.</div>'
          + '</div>';
      } else {
        el.tableState.innerHTML =
          '<div class="empty">'
          + '<div class="empty-title">No matches</div>'
          + '<div class="empty-desc">No sessions match &ldquo;' + escapeHtml(searchTerm)
          + '&rdquo; in the selected time range.</div>'
          + '</div>';
      }
      return;
    }

    el.tableState.innerHTML = '';
    el.table.style.display = '';

    // 扁平 → 主/子树形分组（主 session + 其子 session 数组）
    const groups = buildTree(filtered);

    // 分组感知分页：分页单位 = "主 + 其子" 整组，保证主子不被拆散。
    // 单组超过 pageSize 时整组独占一页（不拆分）；pageSize 仍按行数算（含子行）。
    const pages = [];          // 每页 = [{session, depth, isLast}, ...]
    let cur = [];
    for (const g of groups) {
      const gRows = [{ session: g.session, depth: 0, isLast: false }];
      g.children.forEach((c, i) =>
        gRows.push({ session: c, depth: 1, isLast: i === g.children.length - 1 }));
      if (cur.length > 0 && cur.length + gRows.length > pageSize) {
        pages.push(cur);
        cur = [];
      }
      cur = cur.concat(gRows);
    }
    if (cur.length > 0) pages.push(cur);

    const totalRows = groups.reduce((n, g) => n + 1 + g.children.length, 0);
    const totalPages = Math.max(1, pages.length);
    // 刷新后数据可能变少，钳制当前页到合法范围（保持页码，不强制回第 1 页）
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const pageRows = pages[currentPage - 1] || [];
    // 当前页在展开后扁平列表中的起止序号（用于分页信息文本）
    let startIdx = 0;
    for (let i = 0; i < currentPage - 1; i++) startIdx += (pages[i] || []).length;

    const frag = document.createDocumentFragment();
    // 动画延迟基于页内索引，避免长列表尾部过慢
    pageRows.forEach((r, i) => frag.appendChild(renderRow(r.session, i, r.depth, r.isLast)));
    el.body.innerHTML = '';
    el.body.appendChild(frag);

    renderPagination(totalRows, totalPages, startIdx + 1, startIdx + pageRows.length);
  }

  /* ============================================================
   * 分页栏
   * ========================================================== */

  /** 计算要显示的页码序列（含省略号占位 '...'），页数 ≤7 时全显示 */
  function computePageNumbers(current, total) {
    if (total <= 7) {
      const arr = [];
      for (let i = 1; i <= total; i++) arr.push(i);
      return arr;
    }
    const items = [];
    const left = Math.max(1, current - 1);
    const right = Math.min(total, current + 1);
    items.push(1);
    if (left > 2) items.push('...');
    for (let i = left; i <= right; i++) {
      if (i !== 1 && i !== total) items.push(i);
    }
    if (right < total - 1) items.push('...');
    items.push(total);
    return items;
  }

  function scrollTableTop() {
    if (el.tableWrap) el.tableWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderPagination(total, totalPages, startItem, endItem) {
    el.pagination.style.display = '';

    el.paginationInfo.textContent =
      '共 ' + total + ' 条 · 第 ' + startItem + '–' + endItem + ' / ' + total;

    el.pageSizeSelect.value = String(pageSize);

    // 上一页 / 下一页禁用态
    el.prevBtn.disabled = currentPage <= 1;
    el.nextBtn.disabled = currentPage >= totalPages;

    // 页码按钮
    const nums = computePageNumbers(currentPage, totalPages);
    el.pageNumbers.innerHTML = nums.map(function (n) {
      if (n === '...') return '<span class="page-ellipsis">…</span>';
      const active = n === currentPage ? ' active' : '';
      return '<button class="page-btn' + active + '" data-page="' + n + '">' + n + '</button>';
    }).join('');
  }

  /* ============================================================
   * 状态切换
   * ========================================================== */
  function showLoading() {
    el.table.style.display = 'none';
    el.pagination.style.display = 'none';
    el.tableState.innerHTML =
      '<div class="loading"><div class="spinner"></div><span>Loading sessions…</span></div>';
  }

  function showError(msg) {
    el.table.style.display = 'none';
    el.pagination.style.display = 'none';
    el.tableState.innerHTML =
      '<div class="error-box"><strong>Failed to load:</strong> ' + escapeHtml(msg) + '</div>';
  }

  /* ============================================================
   * 数据加载
   * ========================================================== */
  async function loadStats() {
    try {
      const data = await apiFetch('/otel/api/stats');
      renderStats(data);
    } catch (e) {
      // 统计失败不阻塞列表，静默处理
      console.warn('stats load failed:', e.message);
    }
  }

  async function loadSessions() {
    try {
      const data = await apiFetch('/otel/api/sessions?limit=500');
      allSessions = Array.isArray(data) ? data : [];
      renderTable();
    } catch (e) {
      showError(e.message);
    }
  }

  async function refreshAll() {
    await Promise.all([loadStats(), loadSessions()]);
    nextRefreshAt = Date.now() + refreshSec * 1000;
  }

  function updateCountdown() {
    if (refreshSec === 0) {
      el.refreshText.textContent = '';
      return;
    }
    const remain = Math.max(0, Math.round((nextRefreshAt - Date.now()) / 1000));
    el.refreshText.textContent = remain + 's';
  }

  /* ============================================================
   * 刷新调度
   * ========================================================== */
  function clearTimers() {
    if (refreshTimer)    { clearInterval(refreshTimer);    refreshTimer = null; }
    if (countdownTimer)  { clearInterval(countdownTimer);  countdownTimer = null; }
  }

  function setupRefresh() {
    clearTimers();
    if (refreshSec === 0) {
      el.refreshIndicator.classList.add('is-off');
      el.refreshText.textContent = '';
      return;
    }
    el.refreshIndicator.classList.remove('is-off');
    refreshTimer = setInterval(refreshAll, refreshSec * 1000);
    countdownTimer = setInterval(updateCountdown, REFRESH_TICK_MS);
    nextRefreshAt = Date.now() + refreshSec * 1000;
    updateCountdown();
  }

  /* ------------------------------------------------------------
   * 可见性调度：页面不可见（浏览器后台 / 父 dashboard 切到别的 tab）
   * 时停止自动刷新以省请求；恢复可见时重启定时器并立即补刷一次。
   * ---------------------------------------------------------- */
  function applyRefresh() {
    const shouldRun = tabActive && browserVisible && refreshSec > 0;
    if (shouldRun) {
      setupRefresh();
      refreshRunning = true;
    } else {
      clearTimers();
      refreshRunning = false;
      el.refreshIndicator.classList.add('is-off');
      el.refreshText.textContent = (refreshSec > 0) ? 'paused' : '';
    }
  }

  /* ============================================================
   * 启动
   * ========================================================== */
  function start() {
    // 从 localStorage 恢复上次选择的时间范围
    const prefs = loadPrefs();
    const savedRange = prefs.timeRange;
    if (savedRange === 'today' || savedRange === '7d' || savedRange === '30d' || savedRange === 'all') {
      timeRange = savedRange;
    }
    el.timeRange.value = timeRange; // 同步 <select> 显示，避免与实际过滤不一致

    const savedType = prefs.typeFilter;
    if (savedType === 'all' || savedType === 'opencode' || savedType === 'pi') {
      typeFilter = savedType;
    }
    el.typeFilter.value = typeFilter;

    el.searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.trim();
      currentPage = 1;          // 搜索变化回到第 1 页
      renderTable();
    });

    el.timeRange.addEventListener('change', (e) => {
      timeRange = e.target.value;
      // 持久化到 localStorage（读-改-写，避免覆盖其他偏好）
      const p = loadPrefs();
      p.timeRange = timeRange;
      savePrefs(p);
      currentPage = 1;          // 时间范围变化回到第 1 页
      renderTable();
    });

    el.typeFilter.addEventListener('change', (e) => {
      typeFilter = e.target.value;
      const p = loadPrefs();
      p.typeFilter = typeFilter;
      savePrefs(p);
      currentPage = 1;
      renderTable();
    });

    el.refreshInterval.addEventListener('change', (e) => {
      refreshSec = Number(e.target.value) || 0;
      applyRefresh();
      // 立即触发一次刷新，让用户看到效果
      if (refreshSec > 0 && tabActive && browserVisible) refreshAll();
    });

    // 分页：上一页 / 下一页
    el.prevBtn.addEventListener('click', () => {
      if (currentPage <= 1) return;
      currentPage--;
      renderTable();
      scrollTableTop();
    });
    el.nextBtn.addEventListener('click', () => {
      currentPage++;
      renderTable();
      scrollTableTop();
    });

    // 分页：页码点击（事件委托）
    el.pageNumbers.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-page]');
      if (!btn) return;
      const p = Number(btn.dataset.page);
      if (p && p !== currentPage) {
        currentPage = p;
        renderTable();
        scrollTableTop();
      }
    });

    // 分页：每页条数切换 → 回到第 1 页
    el.pageSizeSelect.addEventListener('change', (e) => {
      pageSize = Number(e.target.value) || 20;
      currentPage = 1;
      renderTable();
    });

    // 浏览器 tab 前后台切换
    document.addEventListener('visibilitychange', () => {
      const was = browserVisible;
      browserVisible = !document.hidden;
      if (browserVisible && !was && refreshSec > 0) {
        applyRefresh();   // 重启定时器
        refreshAll();     // 补刷一次
      } else {
        applyRefresh();
      }
    });

    // 父 dashboard tab 切换通知（仅 iframe 场景；独立访问 /otel/ 时无此消息，
    // tabActive 保持 true，仅受浏览器前后台影响）
    if (window.self !== window.top) {
      window.addEventListener('message', (e) => {
        if (!e.data || e.data.type !== 'tab-visibility') return;
        const was = tabActive;
        tabActive = !!e.data.visible;
        if (tabActive && !was && refreshSec > 0) {
          applyRefresh();
          refreshAll();
        } else {
          applyRefresh();
        }
      });
    }

    showLoading();
    refreshAll();
    applyRefresh();
  }

  start();
})();
