// session.js — Session 详情页逻辑（含 timeline 甘特图 + tree 视图 + detail panel）
// 依赖：utils.js
//
// 关键能力：
//   1. 解析 URL ?id= 加载 session 详情 + trace 列表
//   2. trace 可展开/折叠，展开后加载该 trace 的 spans
//   3. timeline：横向甘特图，左列 span 名（sticky），右侧 bar
//      - 鼠标滚轮在 bar 区缩放（围绕鼠标位置）
//      - 拖拽平移（同步纵向 + 横向滚动）
//      - hover bar 显示轻量 tooltip
//   4. 点击 span → 右侧固定 detail panel 显示完整详情（#1）
//   5. Tree 视图与 Timeline 切换（#2）
//   6. span 行内显示 duration/tokens/cost（#3）
//   7. status badge（#4）
//   8. 热力图着色模式（#6）
//   9. TraceSettingsDropdown 视图设置（#7）
//  10. gutter 宽度可拖拽（#9）
//  11. URL ?spanId= &view= 联动（#10）

(function () {
  'use strict';

  const params = new URLSearchParams(location.search);
  const sessionId     = params.get('id');
  const initialSpanId = params.get('spanId');                              // #10
  const initialView   = (params.get('view') === 'tree') ? 'tree' : 'timeline'; // #2 #10

  // ---- 布局常量 ----
  const ROW_H       = 26;     // 每行高度
  const MIN_BAR_W   = 2;      // bar 最小宽度
  const TICK_COUNT  = 8;      // 标尺刻度数
  const GUTTER_MIN  = 160;
  const GUTTER_MAX  = 560;
  const GUTTER_DEFAULT = 300;
  const DETAIL_PANEL_W = 400;

  // ---- 状态 ----
  let sessionData = null;
  const spansCache  = {};
  const tlState     = {};      // trace_id -> { pxPerMs }
  let expandedTraceId = null;

  let currentView = initialView;       // 'tree' | 'timeline'
  let prefs = Object.assign(defaultPrefs(), loadPrefs());
  let gutterW = GUTTER_DEFAULT;
  let selected = null;                 // { traceId, spanId }

  // 全局拖拽（timeline 平移 / gutter 调整）
  let activeDrag = null;

  const app = document.querySelector('.app');
  const tooltipEl = document.getElementById('tooltip');

  // 初始化 gutter 宽度（#9）
  try {
    const w = parseInt(localStorage.getItem(OTEL_GUTTER_KEY), 10);
    if (!isNaN(w) && w >= GUTTER_MIN && w <= GUTTER_MAX) gutterW = w;
  } catch (_) {}
  document.documentElement.style.setProperty('--label-w', gutterW + 'px');

  /* ============================================================
   * 页面状态显示
   * ========================================================== */
  function showError(msg) {
    app.innerHTML =
      '<a class="back-link" href="/otel/">← Back to sessions</a>'
      + '<div class="error-box"><strong>Failed to load:</strong> ' + escapeHtml(msg) + '</div>';
  }

  function showNotFound(msg) {
    app.innerHTML =
      '<div class="empty" style="margin-top:48px">'
      + '<div class="empty-icon">'
      + '<svg width="26" height="26" viewBox="0 0 26 26" fill="none">'
      + '<circle cx="13" cy="13" r="10" stroke="currentColor" stroke-width="1.6"/>'
      + '<path d="M10 10l6 6M16 10l-6 6" stroke="currentColor" stroke-width="1.6" '
      + 'stroke-linecap="round"/>'
      + '</svg></div>'
      + '<div class="empty-title">' + escapeHtml(msg) + '</div>'
      + '<div class="empty-desc"><a href="/otel/">← Back to sessions</a></div>'
      + '</div>';
  }

  /* ============================================================
   * 主渲染
   * ========================================================== */
  function renderPage() {
    const session = sessionData.session;
    const traces  = sessionData.traces || [];
    const calls   = sessionData.calls || [];

    const title = session.title || session.session_id || 'Untitled session';

    // 时间范围：取 traces 的最早 start → 最晚 end
    let totalDur = 0;
    let rangeText = formatLocalTime(session.time_created);
    if (traces.length) {
      const tStart = Math.min(...traces.map(t => t.start_ms));
      const tEnd   = Math.max(...traces.map(t => t.end_ms));
      totalDur = Math.max(0, tEnd - tStart);
      rangeText = formatLocalTime(tStart) + '  →  ' + formatLocalTime(tEnd)
                + '  (' + formatDuration(totalDur) + ')';
    }

    app.innerHTML =
      '<a class="back-link" href="/otel/">'
      + '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="display:inline">'
      + '<path d="M7.5 2.5L4 6l3.5 3.5" stroke="currentColor" stroke-width="1.6" '
      + 'stroke-linecap="round" stroke-linejoin="round"/></svg>'
      + ' Back to sessions</a>'

      + '<header class="session-header">'
      +   '<div class="session-title-block">'
      +     '<div class="session-title">' + escapeHtml(truncate(title, 120)) + '</div>'
      +     '<div class="session-id">' + escapeHtml(session.session_id || '') + '</div>'
      +   '</div>'
      +   '<div class="session-meta">'
      +     (session.agent
            ? '<span class="tag tag-accent">' + escapeHtml(session.agent) + '</span>' : '')
      +     ((session.model_provider || session.model_id)
            ? '<span class="tag">' + escapeHtml(session.model_provider || '?')
              + ' / ' + escapeHtml(truncate(session.model_id || '', 20)) + '</span>' : '')
      +     (session.profile
            ? '<span class="tag tag-llm">' + escapeHtml(session.profile) + '</span>' : '')
      +   '</div>'
      + '</header>'

      + '<div class="overview">'
      +   '<div class="ov-card" style="animation-delay:0ms">'
      +     '<div class="ov-label">Total Cost</div>'
      +     '<div class="ov-value" style="color:' + costColor(session.total_cost) + '">'
      +       formatCost(session.total_cost) + '</div>'
      +   '</div>'
      +   '<div class="ov-card" style="animation-delay:60ms">'
      +     '<div class="ov-label">Input Tokens</div>'
      +     '<div class="ov-value">' + formatNumber(session.total_input_tokens) + '</div>'
      +   '</div>'
      +   '<div class="ov-card" style="animation-delay:120ms">'
      +     '<div class="ov-label">Output Tokens</div>'
      +     '<div class="ov-value">' + formatNumber(session.total_output_tokens) + '</div>'
      +   '</div>'
      +   '<div class="ov-card" style="animation-delay:180ms">'
      +     '<div class="ov-label">Spans</div>'
      +     '<div class="ov-value">' + (session.span_count ?? 0) + '</div>'
      +   '</div>'
      +   '<div class="ov-card" style="animation-delay:240ms">'
      +     '<div class="ov-label">Duration</div>'
      +     '<div class="ov-value ov-value-sm">' + formatDuration(totalDur) + '</div>'
      +   '</div>'
      +   '<div class="ov-card" style="animation-delay:300ms">'
      +     '<div class="ov-label">LLM / Tool Calls</div>'
      +     '<div class="ov-value ov-value-sm">'
      +       (session.llm_call_count ?? 0) + ' / ' + (session.tool_call_count ?? 0) + '</div>'
      +   '</div>'
      + '</div>'

      + '<div class="ov-card" style="margin-bottom:22px;padding:10px 16px">'
      +   '<div class="ov-label" style="margin:0">Time Range</div>'
      +   '<div style="font-family:var(--font-mono);font-size:12px;color:var(--text-weak);margin-top:2px">'
      +     escapeHtml(rangeText) + '</div>'
      + '</div>'

      + '<h2 class="section-title">Calls <span class="count">' + calls.length + '</span></h2>'
      + '<div id="calls-list"></div>'

      + '<h2 class="section-title">Traces <span class="count">' + traces.length + '</span></h2>'
      + '<div class="trace-list" id="trace-list"></div>';

    renderCallsList(calls);
    renderTraceList(traces);

    // 单 trace 自动展开，方便直接查看
    if (traces.length === 1) {
      const row = document.querySelector('.trace-row');
      if (row) row.querySelector('.trace-head').click();
    }
  }

  /* ============================================================
   * calls 调用明细表（基本不变）
   * ============================================================ */
  function renderCallsList(calls) {
    const container = document.getElementById('calls-list');
    if (!container) return;

    if (sessionData.calls_error) {
      container.innerHTML =
        '<div class="error-box"><strong>Failed to load calls:</strong> '
        + escapeHtml(sessionData.calls_error) + '</div>';
      return;
    }

    if (!calls || !calls.length) {
      container.innerHTML =
        '<div class="empty" style="padding:40px">'
        + '<div class="empty-title">No calls in this session</div></div>';
      return;
    }

    calls = calls.slice().sort((a, b) => (a.start_ms || 0) - (b.start_ms || 0));
    const body = calls
      .map((c, i) => renderCallRow(c, i + 1, Math.min(i * 40, 400)))
      .join('');

    container.innerHTML =
      '<div class="calls-wrap">'
      + '<table class="calls-table">'
      +   '<thead><tr>'
      +     '<th class="col-idx">#</th>'
      +     '<th class="col-type">Type</th>'
      +     '<th class="col-prompt">Prompt / Tool</th>'
      +     '<th class="col-resp">Response / Output</th>'
      +     '<th class="col-tokens">Tokens</th>'
      +     '<th class="col-dur">Duration</th>'
      +     '<th class="col-time">Time</th>'
      +   '</tr></thead>'
      +   '<tbody>' + body + '</tbody>'
      + '</table></div>';
  }

  function renderCallRow(c, idx, delay) {
    const isLLM = c.type === 'llm';
    const isErr = (c.status_code || '').toUpperCase() === 'ERROR';
    const ds    = ' style="animation-delay:' + delay + 'ms"';
    const rowCls = 'call-row call-type-' + (isLLM ? 'llm' : 'tool')
                 + (isErr ? ' call-row-error' : '');

    const typeChip = isLLM
      ? '<span class="tag tag-accent">LLM</span>'
      : '<span class="tag tag-tool">TOOL</span>';

    let promptCell;
    if (isLLM) {
      const p = c.prompt_summary || '';
      promptCell = '<div class="cell-text" title="' + escapeHtml(p) + '">'
                 + escapeHtml(truncate(p, 80)) + '</div>';
    } else {
      const tn  = c.tool_name || c.name || '?';
      const ins = c.input_summary || '';
      promptCell = '<div class="cell-tool-name">' + escapeHtml(tn) + '</div>'
                 + '<div class="cell-text cell-text-sm" title="' + escapeHtml(ins) + '">'
                 + escapeHtml(truncate(ins, 80)) + '</div>';
    }

    let respCell;
    if (isLLM) {
      const r = c.response_summary || '';
      let h = '<div class="cell-text" title="' + escapeHtml(r) + '">'
            + escapeHtml(truncate(r, 100)) + '</div>';
      if (c.tool_calls_summary) {
        h += '<div class="cell-sub">→ calls: ' + escapeHtml(c.tool_calls_summary) + '</div>';
      }
      if (c.finish_reason && c.finish_reason !== 'stop') {
        h += '<div class="cell-meta">finish: ' + escapeHtml(c.finish_reason) + '</div>';
      }
      respCell = h;
    } else {
      const o = c.output_summary || '';
      respCell = '<div class="cell-text" title="' + escapeHtml(o) + '">'
               + escapeHtml(truncate(o, 100)) + '</div>';
    }

    const tokensCell = isLLM
      ? '<span class="cell-mono">' + formatTokens(c.input_tokens, c.output_tokens) + '</span>'
      : '<span class="dash">—</span>';
    const durCell  = '<span class="cell-mono">' + formatDuration(c.duration_ms) + '</span>';
    const timeCell = '<span class="cell-time" title="' + escapeHtml(formatISO(c.start_ms)) + '">'
                   + formatLocalTime(c.start_ms) + '</span>';

    let errMark = '';
    if (isErr) {
      errMark = '<div class="cell-error" title="' + escapeHtml(c.status_message || 'ERROR') + '">'
              + '● ' + escapeHtml(c.status_message ? truncate(c.status_message, 60) : 'error')
              + '</div>';
    }

    let html =
      '<tr class="' + rowCls + '"' + ds + '>'
      +   '<td class="col-idx">' + idx + '</td>'
      +   '<td class="col-type">' + typeChip + '</td>'
      +   '<td class="col-prompt">' + promptCell + errMark + '</td>'
      +   '<td class="col-resp">' + respCell + '</td>'
      +   '<td class="col-tokens">' + tokensCell + '</td>'
      +   '<td class="col-dur">' + durCell + '</td>'
      +   '<td class="col-time">' + timeCell + '</td>'
      + '</tr>';

    if (isLLM && Array.isArray(c.tool_calls) && c.tool_calls.length) {
      c.tool_calls.forEach((tc) => {
        const tn = tc.tool_name || '?';
        const ij = tc.input_json || '';
        html +=
          '<tr class="call-sub-row"' + ds + '>'
          +   '<td class="col-idx"></td>'
          +   '<td class="col-type"><span class="sub-arrow">↳</span></td>'
          +   '<td class="col-prompt" colspan="5">'
          +     '<div class="sub-row-content">'
          +       '<span class="tag tag-tool">' + escapeHtml(tn) + '</span>'
          +       '<span class="sub-input" title="' + escapeHtml(ij) + '">'
          +         escapeHtml(truncate(ij, 140)) + '</span>'
          +     '</div>'
          +   '</td>'
          + '</tr>';
      });
    }
    return html;
  }

  /* ============================================================
   * trace 列表渲染
   * ========================================================== */
  function renderTraceList(traces) {
    const list = document.getElementById('trace-list');
    if (!traces.length) {
      list.innerHTML =
        '<div class="empty" style="padding:40px">'
        + '<div class="empty-title">No traces in this session</div></div>';
      return;
    }
    traces = traces.slice().sort((a, b) => a.start_ms - b.start_ms);
    list.innerHTML = '';
    traces.forEach((t, i) => {
      const row = renderTraceRow(t);
      row.style.animationDelay = Math.min(i * 40, 400) + 'ms';
      list.appendChild(row);
    });
  }

  function renderTraceRow(trace) {
    const row = document.createElement('div');
    row.className = 'trace-row';
    row.dataset.traceId = trace.trace_id;
    row.innerHTML =
      '<div class="trace-head">'
      +   '<span class="trace-chev"></span>'
      +   '<span class="trace-id">' + escapeHtml((trace.trace_id || '').slice(0, 8)) + '</span>'
      +   '<span class="trace-time" title="' + escapeHtml(formatISO(trace.start_ms)) + '">'
      +     formatLocalTime(trace.start_ms) + '</span>'
      +   '<div class="trace-stats">'
      +     '<span><b>' + (trace.span_count ?? 0) + '</b> spans</span>'
      +     '<span><b>' + formatDuration(trace.duration_ms) + '</b></span>'
      +   '</div>'
      + '</div>'
      + '<div class="trace-body"></div>';

    row.querySelector('.trace-head').addEventListener('click', () => toggleTrace(row, trace));
    return row;
  }

  async function toggleTrace(row, trace) {
    if (expandedTraceId === trace.trace_id) {
      cleanupTraceBodyListeners(row);
      row.classList.remove('expanded');
      expandedTraceId = null;
      selected = null;
      hideTooltip();
      return;
    }
    document.querySelectorAll('.trace-row.expanded').forEach(r => {
      cleanupTraceBodyListeners(r);
      r.classList.remove('expanded');
    });
    expandedTraceId = trace.trace_id;
    row.classList.add('expanded');

    const body = row.querySelector('.trace-body');
    body.innerHTML =
      '<div class="loading" style="padding:30px"><div class="spinner"></div>'
      + '<span>Loading spans…</span></div>';

    try {
      let spans = spansCache[trace.trace_id];
      if (!spans) {
        spans = await apiFetch('/otel/api/spans?traceId=' + encodeURIComponent(trace.trace_id));
        spansCache[trace.trace_id] = spans;
      }
      renderTraceBody(body, trace, spans);
    } catch (e) {
      body.innerHTML =
        '<div class="error-box"><strong>Failed to load spans:</strong> '
        + escapeHtml(e.message) + '</div>';
    }
  }

  /** 清理 trace-body 上的 settings 文档监听器，避免泄漏 */
  function cleanupTraceBodyListeners(row) {
    const oldBody = row.querySelector('.trace-body');
    if (oldBody && oldBody._settingsDocListener) {
      document.removeEventListener('click', oldBody._settingsDocListener);
      oldBody._settingsDocListener = null;
    }
  }

  /* ============================================================
   * timeline 工具：计算 span 深度
   * ========================================================== */
  function computeDepth(spans) {
    const map = new Map();
    spans.forEach(s => map.set(s.span_id, s));
    const cache = new Map();
    function depthOf(s) {
      if (cache.has(s.span_id)) return cache.get(s.span_id);
      if (!s.parent_span_id || !map.has(s.parent_span_id)) {
        cache.set(s.span_id, 0);
        return 0;
      }
      cache.set(s.span_id, 0); // 防御环引用
      const d = depthOf(map.get(s.parent_span_id)) + 1;
      cache.set(s.span_id, d);
      return d;
    }
    spans.forEach(s => { s._depth = depthOf(s); });
  }

  /** 应用 minDuration 过滤，但保留根 span 以维持树结构完整性 */
  function filterSpans(spans) {
    const min = prefs.minDurationMs || 0;
    if (!min) return spans;
    // 保留 duration >= min 的 span，以及它们的祖先链
    const idMap = new Map(spans.map(s => [s.span_id, s]));
    const keep = new Set();
    spans.forEach(s => {
      if ((s.duration_ms || 0) >= min) {
        let cur = s;
        while (cur && !keep.has(cur.span_id)) {
          keep.add(cur.span_id);
          cur = cur.parent_span_id ? idMap.get(cur.parent_span_id) : null;
        }
      }
    });
    return spans.filter(s => keep.has(s.span_id));
  }

  /** 热力图着色 class（#6） */
  function heatClass(spans, span) {
    if (prefs.colorMode !== 'heatmap') return '';
    const ratio = spanDurationRatio(spans, span);
    if (ratio >= 0.75) return 'heat-hot';
    if (ratio >= 0.5)  return 'heat-warm';
    return 'heat-cool';
  }

  /** span 行内 metrics HTML（#3） */
  function buildSpanMetricsHtml(span) {
    const parts = [];
    if (prefs.showDuration) {
      parts.push('<span class="sm-dur">' + formatDuration(span.duration_ms) + '</span>');
    }
    if (prefs.showTokens) {
      const t = getSpanTokens(span);
      if (t.input != null || t.output != null) {
        parts.push('<span class="sm-tokens">'
          + formatNumber(t.input || 0) + '→' + formatNumber(t.output || 0)
          + '</span>');
      }
    }
    if (prefs.showCost) {
      const c = getSpanCost(span);
      if (c != null) {
        parts.push('<span class="sm-cost">' + formatCost(c) + '</span>');
      }
    }
    if (!parts.length) return '';
    return '<span class="span-metrics">' + parts.join('<span class="sm-sep">·</span>') + '</span>';
  }

  /** tree 行 metrics HTML（与 span-metrics 类似但用 tm- 前缀） */
  function buildTreeMetricsHtml(span) {
    const parts = [];
    if (prefs.showDuration) {
      parts.push('<span class="tm-dur">' + formatDuration(span.duration_ms) + '</span>');
    }
    if (prefs.showTokens) {
      const t = getSpanTokens(span);
      if (t.input != null || t.output != null) {
        parts.push('<span class="tm-tokens">'
          + formatNumber(t.input || 0) + '→' + formatNumber(t.output || 0)
          + '</span>');
      }
    }
    if (prefs.showCost) {
      const c = getSpanCost(span);
      if (c != null) {
        parts.push('<span class="tm-cost">' + formatCost(c) + '</span>');
      }
    }
    return parts.join('<span class="sm-sep">·</span>');
  }

  /* ============================================================
   * trace-body 主渲染：toolbar + 左视图 + 右 detail panel（#1）
   * ========================================================== */
  function renderTraceBody(body, trace, spans) {
    const filtered = filterSpans(spans);
    if (!filtered || !filtered.length) {
      body.innerHTML =
        '<div class="trace-body-left">'
        + '<div class="empty" style="padding:30px"><div class="empty-title">No spans</div></div>'
        + '</div>';
      return;
    }

    computeDepth(filtered);

    body.classList.remove('collapsed-detail');
    body.innerHTML =
      '<div class="trace-body-left">'
      +   '<div class="trace-toolbar">'
      +     '<div class="view-toggle" id="view-toggle">'
      +       '<button data-view="tree"     class="' + (currentView === 'tree' ? 'active' : '') + '">树形</button>'
      +       '<button data-view="timeline" class="' + (currentView === 'timeline' ? 'active' : '') + '">时间线</button>'
      +     '</div>'
      +     '<div class="settings-dropdown">'
      +       '<button class="icon-btn" id="settings-btn" title="视图设置">'
      +         gearIconSvg()
      +       '</button>'
      +       '<div class="settings-menu" id="settings-menu">'
      +         settingsMenuHtml()
      +       '</div>'
      +     '</div>'
      +     '<button class="icon-btn" id="panel-toggle" title="折叠/展开右侧面板">'
      +       panelToggleIconSvg()
      +     '</button>'
      +   '</div>'
      +   '<div class="trace-view-container" id="trace-view-container"></div>'
      + '</div>'
      + '<div class="trace-body-right" id="trace-body-right"></div>';

    const viewContainer = body.querySelector('#trace-view-container');
    const panelEl       = body.querySelector('#trace-body-right');

    // 渲染视图（tree 或 timeline）
    if (currentView === 'tree') {
      renderTreeView(viewContainer, trace, filtered);
    } else {
      renderTimeline(viewContainer, trace, filtered);
    }

    // 渲染 detail panel（默认 trace 概览，或恢复选中 span）
    if (selected && selected.traceId === trace.trace_id) {
      const span = filtered.find(s => s.span_id === selected.spanId);
      if (span) {
        renderSpanDetail(panelEl, trace, span, filtered);
      } else {
        renderTraceOverview(panelEl, trace, filtered);
      }
    } else {
      renderTraceOverview(panelEl, trace, filtered);
    }

    // 绑定 toolbar 事件
    bindToolbarEvents(body, trace, filtered);
  }

  function gearIconSvg() {
    return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none">'
      + '<path d="M8 4.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" stroke="currentColor" stroke-width="1.3"/>'
      + '<path d="M8 1.5v1.8M8 12.7v1.8M14.5 8h-1.8M3.3 8H1.5M12.6 3.4l-1.3 1.3M4.7 11.3l-1.3 1.3M12.6 12.6l-1.3-1.3M4.7 4.7L3.4 3.4"'
      + ' stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
  }

  function panelToggleIconSvg() {
    return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none">'
      + '<rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" stroke-width="1.3"/>'
      + '<line x1="10" y1="3" x2="10" y2="13" stroke="currentColor" stroke-width="1.3"/></svg>';
  }

  function settingsMenuHtml() {
    const p = prefs;
    const minDurOpts = [
      { v: 0,    label: '0ms' },
      { v: 10,   label: '10ms' },
      { v: 100,  label: '100ms' },
      { v: 1000, label: '1s' },
    ];
    return ''
      + '<div class="menu-title">显示选项</div>'
      + '<div class="settings-item" data-toggle="showDuration">'
      +   '<span class="si-label">显示耗时</span>'
      +   '<span class="toggle-switch ' + (p.showDuration ? 'on' : '') + '" data-key="showDuration"></span>'
      + '</div>'
      + '<div class="settings-item" data-toggle="showTokens">'
      +   '<span class="si-label">显示 Token</span>'
      +   '<span class="toggle-switch ' + (p.showTokens ? 'on' : '') + '" data-key="showTokens"></span>'
      + '</div>'
      + '<div class="settings-item" data-toggle="showCost">'
      +   '<span class="si-label">显示成本</span>'
      +   '<span class="toggle-switch ' + (p.showCost ? 'on' : '') + '" data-key="showCost"></span>'
      + '</div>'
      + '<div class="settings-divider"></div>'
      + '<div class="menu-title">颜色模式</div>'
      + '<div class="settings-item">'
      +   '<span class="si-label">着色</span>'
      +   '<div class="radio-group" data-key="colorMode">'
      +     '<button data-value="type"    class="' + (p.colorMode === 'type' ? 'active' : '') + '">按类型</button>'
      +     '<button data-value="heatmap" class="' + (p.colorMode === 'heatmap' ? 'active' : '') + '">按耗时</button>'
      +   '</div>'
      + '</div>'
      + '<div class="settings-divider"></div>'
      + '<div class="menu-title">最小耗时过滤</div>'
      + '<div class="settings-item">'
      +   '<span class="si-label">阈值</span>'
      +   '<div class="radio-group" data-key="minDurationMs">'
      +     minDurOpts.map(o =>
        '<button data-value="' + o.v + '" class="' + (p.minDurationMs === o.v ? 'active' : '') + '">' + o.label + '</button>'
      ).join('')
      +   '</div>'
      + '</div>';
  }

  function bindToolbarEvents(body, trace, spans) {
    // 视图切换
    body.querySelectorAll('#view-toggle button').forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // 面板折叠
    const panelToggle = body.querySelector('#panel-toggle');
    panelToggle.addEventListener('click', () => {
      body.classList.toggle('collapsed-detail');
      panelToggle.classList.toggle('active', !body.classList.contains('collapsed-detail'));
    });
    if (!body.classList.contains('collapsed-detail')) panelToggle.classList.add('active');

    // 设置下拉
    const settingsBtn  = body.querySelector('#settings-btn');
    const settingsMenu = body.querySelector('#settings-menu');
    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      settingsMenu.classList.toggle('show');
    });
    // 点外部关闭
    const onDocClick = (e) => {
      if (!settingsMenu.contains(e.target) && e.target !== settingsBtn && !settingsBtn.contains(e.target)) {
        settingsMenu.classList.remove('show');
      }
    };
    document.addEventListener('click', onDocClick);
    // 切换 trace 时清理监听（简单处理：用 body 的 dataset 标记，避免重复绑定）
    body._settingsDocListener = onDocClick;

    // toggle 开关
    settingsMenu.querySelectorAll('.toggle-switch').forEach((sw) => {
      sw.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = sw.dataset.key;
        prefs[key] = !prefs[key];
        sw.classList.toggle('on', prefs[key]);
        savePrefs(prefs);
        rerenderTraceBody(trace);
      });
    });

    // radio 组
    settingsMenu.querySelectorAll('.radio-group').forEach((group) => {
      group.querySelectorAll('button').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const key = group.dataset.key;
          const val = btn.dataset.value;
          prefs[key] = key === 'minDurationMs' ? Number(val) : val;
          group.querySelectorAll('button').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          savePrefs(prefs);
          rerenderTraceBody(trace);
        });
      });
    });
  }

  /** 重新渲染当前展开的 trace body（保留选中态） */
  function rerenderTraceBody(trace) {
    const row = document.querySelector('.trace-row.expanded');
    if (!row) return;
    // 清理旧 settings 文档监听
    const oldBody = row.querySelector('.trace-body');
    if (oldBody && oldBody._settingsDocListener) {
      document.removeEventListener('click', oldBody._settingsDocListener);
    }
    const spans = spansCache[trace.trace_id];
    if (!spans) return;
    renderTraceBody(oldBody, trace, spans);
  }

  /* ============================================================
   * timeline 渲染（每个 trace 一个实例）
   * ========================================================== */
  function renderTimeline(container, trace, spans) {
    if (!spans || !spans.length) {
      container.innerHTML =
        '<div class="empty" style="padding:30px"><div class="empty-title">No spans</div></div>';
      return;
    }

    // 时间范围
    const tStart = Math.min(...spans.map(s => s.start_ms));
    const tEnd   = Math.max(...spans.map(s => s.end_ms));
    const totalMs = Math.max(1, tEnd - tStart);

    // 初始 pxPerMs：让 bar 区填满可用宽度（至少 600px）
    const containerW = container.clientWidth - 16 || 800;
    const barAreaW0 = Math.max(600, containerW - gutterW);
    let pxPerMs = tlState[trace.trace_id]?.pxPerMs || (barAreaW0 / totalMs);

    const wrap = document.createElement('div');
    wrap.className = 'timeline';
    wrap.innerHTML =
      '<div class="timeline-toolbar">'
      +   '<button data-zoom="out" title="缩小">−</button>'
      +   '<button data-zoom="in" title="放大">+</button>'
      +   '<button data-reset title="重置缩放">Reset fit</button>'
      +   '<span class="timeline-zoom-info"></span>'
      + '</div>'
      + '<div class="tl-viewport">'
      +   '<div class="tl-canvas">'
      +     '<div class="tl-header">'
      +       '<div class="tl-corner">Span · ' + spans.length + '</div>'
      +       '<div class="tl-ruler"></div>'
      +     '</div>'
      +     '<div class="tl-grid"></div>'
      +     '<div class="tl-rows"></div>'
      +   '</div>'
      + '</div>'
      + '<div class="gutter-handle" title="拖拽调整列宽"></div>';

    container.innerHTML = '';
    container.appendChild(wrap);

    const vp       = wrap.querySelector('.tl-viewport');
    const canvas   = wrap.querySelector('.tl-canvas');
    const ruler    = wrap.querySelector('.tl-ruler');
    const grid     = wrap.querySelector('.tl-grid');
    const rowsEl   = wrap.querySelector('.tl-rows');
    const zinfo    = wrap.querySelector('.timeline-zoom-info');
    const gutterHandle = wrap.querySelector('.gutter-handle');

    // gutter 拖拽（#9）
    setupGutterDrag(gutterHandle);

    let drawScheduled = false;
    function scheduleDraw() {
      if (drawScheduled) return;
      drawScheduled = true;
      requestAnimationFrame(() => { drawScheduled = false; draw(); });
    }

    function draw() {
      const barAreaW = totalMs * pxPerMs;
      const canvasW = gutterW + barAreaW;
      canvas.style.width = canvasW + 'px';

      // 标尺刻度
      ruler.innerHTML = '';
      ruler.style.width = barAreaW + 'px';
      for (let i = 0; i <= TICK_COUNT; i++) {
        const frac = i / TICK_COUNT;
        const px = frac * barAreaW;
        const tick = document.createElement('div');
        tick.className = 'ruler-tick' + (i === 0 ? ' first' : '');
        tick.style.left = px + 'px';
        tick.textContent = i === 0 ? '0' : '+' + formatDuration(frac * totalMs);
        ruler.appendChild(tick);
      }

      // 网格线
      grid.innerHTML = '';
      grid.style.left = gutterW + 'px';
      grid.style.width = barAreaW + 'px';
      for (let i = 0; i <= TICK_COUNT; i++) {
        const frac = i / TICK_COUNT;
        const line = document.createElement('div');
        line.className = 'grid-line';
        line.style.left = (frac * barAreaW) + 'px';
        grid.appendChild(line);
      }

      // span 行
      rowsEl.innerHTML = '';
      const frag = document.createDocumentFragment();
      spans.forEach(s => {
        const row = document.createElement('div');
        row.className = 'span-row';
        row.dataset.spanId = s.span_id;
        if (selected && selected.spanId === s.span_id) row.classList.add('selected');

        const depth = s._depth || 0;
        const label = document.createElement('div');
        label.className = 'span-label';
        let labelHtml = '';
        for (let d = 0; d < depth; d++) labelHtml += '<span class="span-indent"></span>';
        labelHtml += '<span class="span-name" title="' + escapeHtml(s.name || '') + '">'
                   + escapeHtml(s.name || '?') + '</span>';
        // 行内 metrics（#3）
        labelHtml += buildSpanMetricsHtml(s);
        // status badge（#4）
        labelHtml += '<span class="span-status">' + statusBadge(getSpanStatus(s)) + '</span>';
        label.innerHTML = labelHtml;
        label.style.pointerEvents = 'auto'; // 允许点击 label 选中 span

        // bar
        const barOffset = (s.start_ms - tStart) * pxPerMs;
        const barW = Math.max(MIN_BAR_W, (s.end_ms - s.start_ms) * pxPerMs);
        const bar = document.createElement('div');
        let barCls = 'span-bar span-bar-color-' + spanColorClass(s.name);
        const heat = heatClass(spans, s);
        if (heat) barCls += ' ' + heat;
        bar.className = barCls;
        bar.style.left = (gutterW + barOffset) + 'px';
        bar.style.width = barW + 'px';
        // bar 内不再画 duration 文字（#3 已移到 label 区）

        attachBarEvents(bar, s, trace, spans);
        // label 也支持点击选中
        label.addEventListener('click', (e) => {
          e.stopPropagation();
          selectSpan(trace, spans, s.span_id);
        });

        row.appendChild(label);
        row.appendChild(bar);
        frag.appendChild(row);
      });
      rowsEl.appendChild(frag);

      // 缩放信息
      const zoomX = (pxPerMs * totalMs / barAreaW0).toFixed(2);
      zinfo.innerHTML = '<b>zoom</b> ' + zoomX + '× · <b>'
                      + spans.length + '</b> spans · <b>' + formatDuration(totalMs) + '</b>';
    }

    draw();

    // 缩放按钮
    wrap.querySelector('[data-zoom="in"]').addEventListener('click', () => {
      pxPerMs = Math.min(1e6, pxPerMs * 1.5);
      tlState[trace.trace_id] = { pxPerMs };
      draw();
    });
    wrap.querySelector('[data-zoom="out"]').addEventListener('click', () => {
      pxPerMs = Math.max(0.0001, pxPerMs / 1.5);
      tlState[trace.trace_id] = { pxPerMs };
      draw();
    });
    wrap.querySelector('[data-reset]').addEventListener('click', () => {
      pxPerMs = barAreaW0 / totalMs;
      tlState[trace.trace_id] = { pxPerMs };
      vp.scrollLeft = 0;
      vp.scrollTop = 0;
      draw();
    });

    // 滚轮缩放（围绕鼠标）
    vp.addEventListener('wheel', (e) => {
      const rect = vp.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      if (mouseX < gutterW) return;
      e.preventDefault();
      const oldPx = pxPerMs;
      const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2;
      const newPx = Math.max(0.0001, Math.min(1e6, oldPx * factor));
      if (newPx === oldPx) return;

      const barX = mouseX - gutterW + vp.scrollLeft;
      const timeAtMouse = tStart + barX / oldPx;

      pxPerMs = newPx;
      tlState[trace.trace_id] = { pxPerMs };
      scheduleDraw();

      const newBarX = (timeAtMouse - tStart) * newPx;
      vp.scrollLeft = Math.max(0, newBarX - (mouseX - gutterW));
    }, { passive: false });

    // 拖拽平移
    vp.addEventListener('mousedown', (e) => {
      if (e.target.closest('.span-bar')) return;
      if (e.target.closest('.span-label')) return; // label 点击交给 click
      if (e.button !== 0) return;
      activeDrag = {
        type: 'pan',
        vp,
        startX: e.clientX,
        startY: e.clientY,
        scrollLeft: vp.scrollLeft,
        scrollTop: vp.scrollTop,
        moved: false,
      };
      vp.classList.add('dragging');
      e.preventDefault();
    });
  }

  /* ============================================================
   * tree 视图渲染（#2）
   * ============================================================ */
  function renderTreeView(container, trace, spans) {
    if (!spans || !spans.length) {
      container.innerHTML =
        '<div class="empty" style="padding:30px"><div class="empty-title">No spans</div></div>';
      return;
    }

    // 按开始时间排序
    const sorted = spans.slice().sort((a, b) => (a.start_ms || 0) - (b.start_ms || 0));

    // 构建父→子映射
    // 跨 trace 场景：子 agent root 的 parent_span_id 指向主 trace 的 span（已在集合中），
    // 但直接查看子 trace 时 parent 不在集合——此时归为 '__root__' 保证渲染。
    const idSet = new Set(sorted.map(s => s.span_id));
    const childrenMap = new Map();
    sorted.forEach(s => {
      const pid = (s.parent_span_id && idSet.has(s.parent_span_id)) ? s.parent_span_id : '__root__';
      if (!childrenMap.has(pid)) childrenMap.set(pid, []);
      childrenMap.get(pid).push(s);
    });

    // 折叠状态（sessionStorage，按 trace_id）
    const foldKey = 'otel-tree-fold-' + trace.trace_id;
    let folded = {};
    try {
      folded = JSON.parse(sessionStorage.getItem(foldKey) || '{}');
    } catch (_) { folded = {}; }
    function saveFolded() {
      try { sessionStorage.setItem(foldKey, JSON.stringify(folded)); } catch (_) {}
    }

    const wrap = document.createElement('div');
    wrap.className = 'tree-view';
    container.innerHTML = '';
    container.appendChild(wrap);

    function renderNode(span, depth) {
      const row = document.createElement('div');
      row.className = 'tree-row';
      row.dataset.spanId = span.span_id;
      if (selected && selected.spanId === span.span_id) row.classList.add('selected');

      const children = childrenMap.get(span.span_id) || [];
      const hasChild = children.length > 0;
      const isFolded = !!folded[span.span_id];
      if (hasChild && isFolded) row.classList.add('folded');
      else if (hasChild) row.classList.add('expanded');

      // color dot
      const colorCls = prefs.colorMode === 'heatmap'
        ? heatDotClass(spans, span)
        : 'c-' + spanColorClass(span.name);

      let html = '';
      // 缩进
      for (let i = 0; i < depth; i++) html += '<span class="span-indent"></span>';
      // chevron
      html += '<span class="tree-chev ' + (hasChild ? 'has-child' : 'leaf') + '"></span>';
      // color dot
      html += '<span class="tree-color-dot ' + colorCls + '"></span>';
      // name
      html += '<span class="tree-name" title="' + escapeHtml(span.name || '') + '">'
            + escapeHtml(span.name || '?') + '</span>';
      // metrics
      html += '<span class="tree-metrics">' + buildTreeMetricsHtml(span) + '</span>';
      // status
      html += statusBadge(getSpanStatus(span));

      row.innerHTML = html;

      // chevron 折叠
      const chev = row.querySelector('.tree-chev');
      if (hasChild) {
        chev.addEventListener('click', (e) => {
          e.stopPropagation();
          folded[span.span_id] = !folded[span.span_id];
          saveFolded();
          renderTreeView(container, trace, spans);
        });
      }
      // 点击行选中
      row.addEventListener('click', () => {
        selectSpan(trace, spans, span.span_id);
      });

      wrap.appendChild(row);

      // 递归子节点
      if (hasChild && !isFolded) {
        children.forEach(c => renderNode(c, depth + 1));
      }
    }

    // 渲染根节点
    (childrenMap.get('__root__') || []).forEach(s => renderNode(s, 0));
  }

  function heatDotClass(spans, span) {
    if (prefs.colorMode !== 'heatmap') return 'c-other';
    const ratio = spanDurationRatio(spans, span);
    if (ratio >= 0.75) return 'c-hot';
    if (ratio >= 0.5)  return 'c-warm';
    return 'c-cool';
  }

  /* ============================================================
   * detail panel 渲染（#1 #8）
   * ========================================================== */
  function renderTraceOverview(panelEl, trace, spans) {
    // 聚合统计
    let totalIn = 0, totalOut = 0, totalCost = 0;
    let okCount = 0, errCount = 0, unsetCount = 0;
    spans.forEach(s => {
      const t = getSpanTokens(s);
      if (t.input != null)  totalIn  += t.input;
      if (t.output != null) totalOut += t.output;
      const c = getSpanCost(s);
      if (c != null) totalCost += c;
      const st = getSpanStatus(s);
      if (st === 'ERROR') errCount++;
      else if (st === 'UNSET') unsetCount++;
      else okCount++;
    });

    const tStart = Math.min(...spans.map(s => s.start_ms));
    const tEnd   = Math.max(...spans.map(s => s.end_ms));
    const totalDur = tEnd - tStart;

    const session = sessionData.session;
    panelEl.innerHTML =
      '<div class="detail-panel">'
      + '<div class="detail-panel-head">'
      +   '<div class="dp-title-wrap">'
      +     '<div class="dp-title">Trace 概览</div>'
      +     '<div class="dp-sub">点击 span 查看详情</div>'
      +   '</div>'
      + '</div>'
      + '<div class="detail-panel-body">'
      +   '<div class="dp-overview">'
      +     '<div class="ov-row"><span class="ov-k">trace_id</span>'
      +       '<span class="ov-v" style="color:var(--accent)">' + escapeHtml(trace.trace_id || '') + '</span></div>'
      +     '<div class="ov-row"><span class="ov-k">session_id</span>'
      +       '<span class="ov-v">' + escapeHtml((session && session.session_id) || '') + '</span></div>'
      +     '<div class="ov-row"><span class="ov-k">spans</span>'
      +       '<span class="ov-v">' + spans.length + '</span></div>'
      +     '<div class="ov-row"><span class="ov-k">duration</span>'
      +       '<span class="ov-v">' + formatDuration(totalDur) + '</span></div>'
      +     '<div class="ov-row"><span class="ov-k">tokens</span>'
      +       '<span class="ov-v">' + formatNumber(totalIn) + ' → ' + formatNumber(totalOut) + '</span></div>'
      +     '<div class="ov-row"><span class="ov-k">cost</span>'
      +       '<span class="ov-v" style="color:' + costColor(totalCost) + '">' + formatCost(totalCost) + '</span></div>'
      +     '<div class="ov-row"><span class="ov-k">time</span>'
      +       '<span class="ov-v" style="font-size:11px">' + formatLocalTime(tStart) + '<br>→ ' + formatLocalTime(tEnd) + '</span></div>'
      +     '<div class="ov-row"><span class="ov-k">status</span>'
      +       '<span class="ov-v">'
      +         '<span class="status-badge status-ok" style="margin-right:4px">OK ' + okCount + '</span>'
      +         (errCount ? '<span class="status-badge status-err" style="margin-right:4px">ERROR ' + errCount + '</span>' : '')
      +         (unsetCount ? '<span class="status-badge status-unset">UNSET ' + unsetCount + '</span>' : '')
      +       '</span></div>'
      +   '</div>'
      + '</div>'
      + '</div>';
  }

  function renderSpanDetail(panelEl, trace, span, spans) {
    const status = span.status || {};
    const statusText = status.code
      ? (status.code + (status.message ? ' — ' + status.message : ''))
      : 'UNSET';

    const parent = span.parent_span_id
      ? (spans.find(s => s.span_id === span.parent_span_id) || null)
      : null;

    const attrs   = span.attributes || {};
    const resource = span.resource || {};

    const fieldHtml = (k, v, cls) =>
      '<div class="dp-field"><span class="dp-k">' + escapeHtml(k) + '</span>'
      + '<span class="dp-v' + (cls ? ' ' + cls : '') + '">' + v + '</span></div>';

    panelEl.innerHTML =
      '<div class="detail-panel">'
      + '<div class="detail-panel-head">'
      +   '<div class="dp-title-wrap">'
      +     '<div class="dp-title" title="' + escapeHtml(span.name || '') + '">' + escapeHtml(span.name || '?') + '</div>'
      +     '<div class="dp-sub">'
      +       statusBadge(getSpanStatus(span))
      +       ' <span style="margin-left:6px">' + escapeHtml(statusText) + '</span>'
      +     '</div>'
      +   '</div>'
      +   '<button class="detail-panel-close" title="返回 Trace 概览">×</button>'
      + '</div>'
      + '<div class="detail-panel-body">'
      +   fieldHtml('span_id',  escapeHtml(span.span_id || ''), 'mono-id')
      +   fieldHtml('parent',   parent
                            ? escapeHtml(parent.name || parent.span_id) + ' <span style="color:var(--text-faint)">(' + escapeHtml(span.parent_span_id) + ')</span>'
                            : '<span style="color:var(--text-faint)">(root)</span>')
      +   fieldHtml('kind',     escapeHtml(span.kind || 'INTERNAL'))
      +   fieldHtml('duration', formatDuration(span.duration_ms))
      +   fieldHtml('start',    escapeHtml(formatLocalTime(span.start_ms))
                            + ' <span style="color:var(--text-faint)">(' + escapeHtml(formatISO(span.start_ms)) + ')</span>')
      +   fieldHtml('end',      escapeHtml(formatLocalTime(span.end_ms))
                            + ' <span style="color:var(--text-faint)">(' + escapeHtml(formatISO(span.end_ms)) + ')</span>')
      +   buildJsonSection('attributes', attrs)
      +   buildJsonSection('resource', resource)
      + '</div>'
      + '</div>';

    // 关闭按钮 → 回 trace 概览
    const closeBtn = panelEl.querySelector('.detail-panel-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        clearSelection();
        renderTraceOverview(panelEl, trace, spans);
      });
    }

    // 大字段展开 + 复制按钮
    const bodyEl = panelEl.querySelector('.detail-panel-body');
    if (bodyEl) bindLargeFieldToggle(bodyEl);
    bindCopyButtons(panelEl, { attributes: attrs, resource: resource });
  }

  function buildJsonSection(title, obj) {
    const hasContent = obj && Object.keys(obj).length > 0;
    const jsonStr = hasContent ? JSON.stringify(obj, null, 2) : '';
    return '<div class="dp-section">'
      + '<div class="dp-section-title">'
      +   '<span>' + title + '</span>'
      +   (hasContent
          ? '<button class="copy-btn" data-copy="' + escapeHtml(jsonStr) + '" title="复制 JSON">'
            + copyIconSvg() + ' 复制</button>'
          : '')
      + '</div>'
      + (hasContent
          ? '<div class="json-tree">' + renderJsonTree(obj, null, 0) + '</div>'
          : '<div class="dp-section-empty">(empty)</div>')
      + '</div>';
  }

  function copyIconSvg() {
    return '<svg width="11" height="11" viewBox="0 0 12 12" fill="none">'
      + '<rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.2"/>'
      + '<path d="M2 8V2.5C2 2.2 2.2 2 2.5 2H8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>'
      + '</svg>';
  }

  function bindCopyButtons(panelEl, sections) {
    panelEl.querySelectorAll('.copy-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const raw = btn.dataset.copy || '';
        copyToClipboard(raw).then(() => {
          btn.classList.add('copied');
          const orig = btn.innerHTML;
          btn.innerHTML = '✓ Copied';
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = orig;
          }, 1200);
        }).catch(() => {});
      });
    });
  }

  /* ============================================================
   * 选中态管理（#1 #2 #10）
   * ============================================================ */
  function selectSpan(trace, spans, spanId, opts) {
    opts = opts || {};
    selected = { traceId: trace.trace_id, spanId: spanId };

    // 更新 timeline / tree 行的 selected class
    const root = document.querySelector('.trace-row.expanded .trace-body');
    if (root) {
      root.querySelectorAll('.span-row.selected, .tree-row.selected')
        .forEach(r => r.classList.remove('selected'));
      root.querySelectorAll('.span-row[data-span-id="' + spanId + '"], .tree-row[data-span-id="' + spanId + '"]')
        .forEach(r => r.classList.add('selected'));
    }

    // 更新 detail panel
    const panelEl = document.querySelector('.trace-row.expanded .trace-body-right');
    if (panelEl) {
      const span = spans.find(s => s.span_id === spanId);
      if (span) renderSpanDetail(panelEl, trace, span, spans);
    }

    // 隐藏 tooltip（避免与 detail panel 信息重复）
    hideTooltip();

    // 更新 URL（#10）
    updateUrl(spanId, currentView);
  }

  function clearSelection() {
    selected = null;
    const root = document.querySelector('.trace-row.expanded .trace-body');
    if (root) {
      root.querySelectorAll('.span-row.selected, .tree-row.selected')
        .forEach(r => r.classList.remove('selected'));
    }
    updateUrl(null, currentView);
  }

  /* ============================================================
   * 视图切换（#2）
   * ============================================================ */
  function switchView(newView) {
    if (newView === currentView) return;
    currentView = newView;
    // 存 sessionStorage
    try { sessionStorage.setItem(OTEL_VIEW_KEY, newView); } catch (_) {}

    if (expandedTraceId) {
      const trace = (sessionData.traces || []).find(t => t.trace_id === expandedTraceId);
      const spans = spansCache[expandedTraceId];
      if (trace && spans) rerenderTraceBody(trace);
    }
    updateUrl(selected ? selected.spanId : null, newView);
  }

  /* ============================================================
   * gutter 拖拽（#9）
   * ========================================================== */
  function setupGutterDrag(handle) {
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      activeDrag = {
        type: 'gutter',
        startX: e.clientX,
        startW: gutterW,
        handle: handle,
      };
      handle.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });
  }

  /* ============================================================
   * URL 参数联动（#10）
   * ============================================================ */
  function updateUrl(spanId, view) {
    const u = new URL(location.href);
    if (spanId) u.searchParams.set('spanId', spanId);
    else u.searchParams.delete('spanId');
    if (view === 'tree') u.searchParams.set('view', 'tree');
    else u.searchParams.delete('view');
    try { history.replaceState(null, '', u.toString()); } catch (_) {}
  }

  /* ============================================================
   * tooltip：hover span 显示轻量信息（保留作为未点击时的提示）
   * ============================================================ */
  function attachBarEvents(bar, span, trace, spans) {
    bar.addEventListener('mouseenter', (e) => showTooltip(span, e));
    bar.addEventListener('mousemove', (e) => moveTooltip(e));
    bar.addEventListener('mouseleave', hideTooltip);
    bar.addEventListener('click', (e) => {
      e.stopPropagation();
      selectSpan(trace, spans, span.span_id);
    });
  }

  function showTooltip(span, e) {
    const summary = spanSummary(span);
    const t = getSpanTokens(span);
    const c = getSpanCost(span);
    const parts = [formatDuration(span.duration_ms)];
    if (t.input != null || t.output != null) {
      parts.push(formatNumber(t.input || 0) + '→' + formatNumber(t.output || 0));
    }
    if (c != null) parts.push(formatCost(c));

    tooltipEl.innerHTML =
      '<div class="tooltip-title">' + escapeHtml(span.name || '?') + '</div>'
      + '<div class="tooltip-meta">'
      +   statusBadge(getSpanStatus(span))
      +   ' <span style="margin-left:4px">' + escapeHtml(span.kind || 'INTERNAL') + '</span>'
      +   '<br>'
      +   '<span style="color:var(--accent)">' + escapeHtml(span.span_id || '') + '</span>'
      +   (span.parent_span_id
            ? '  ←  <span style="color:var(--text-weak)">' + escapeHtml(span.parent_span_id) + '</span>'
            : '  (root)')
      +   '<br>'
      +   escapeHtml(parts.join(' · '))
      + '</div>'
      + (summary
          ? '<div class="tooltip-meta" style="color:var(--cost-mid)">' + escapeHtml(summary) + '</div>'
          : '')
      + '<div class="tooltip-section-label">点击查看完整详情 →</div>';

    tooltipEl.classList.add('tooltip-show');
    moveTooltip(e);
  }

  function moveTooltip(e) {
    const pad = 14;
    const rect = tooltipEl.getBoundingClientRect();
    let x = e.clientX + pad;
    let y = e.clientY + pad;
    if (x + rect.width > window.innerWidth)  x = e.clientX - rect.width - pad;
    if (y + rect.height > window.innerHeight) y = e.clientY - rect.height - pad;
    if (x < 4) x = 4;
    if (y < 4) y = 4;
    tooltipEl.style.left = x + 'px';
    tooltipEl.style.top  = y + 'px';
  }

  function hideTooltip() {
    tooltipEl.classList.remove('tooltip-show');
  }

  /* ============================================================
   * 全局拖拽监听（timeline 平移 + gutter 调整）
   * ============================================================ */
  document.addEventListener('mousemove', (e) => {
    if (!activeDrag) return;
    if (activeDrag.type === 'gutter') {
      const dx = e.clientX - activeDrag.startX;
      const newW = Math.max(GUTTER_MIN, Math.min(GUTTER_MAX, activeDrag.startW + dx));
      if (newW !== gutterW) {
        gutterW = newW;
        document.documentElement.style.setProperty('--label-w', newW + 'px');
        try { localStorage.setItem(OTEL_GUTTER_KEY, String(newW)); } catch (_) {}
      }
    } else if (activeDrag.type === 'pan') {
      const dx = e.clientX - activeDrag.startX;
      const dy = e.clientY - activeDrag.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) activeDrag.moved = true;
      activeDrag.vp.scrollLeft = activeDrag.scrollLeft - dx;
      activeDrag.vp.scrollTop  = activeDrag.scrollTop - dy;
    }
  });
  document.addEventListener('mouseup', () => {
    if (!activeDrag) return;
    if (activeDrag.type === 'gutter') {
      activeDrag.handle.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    } else if (activeDrag.type === 'pan') {
      activeDrag.vp.classList.remove('dragging');
    }
    activeDrag = null;
  });

  /* ============================================================
   * #10 自动定位 spanId（加载时）
   * ============================================================ */
  async function autoLocateSpan(spanId) {
    const traces = sessionData.traces || [];
    for (const t of traces) {
      let spans = spansCache[t.trace_id];
      if (!spans) {
        try {
          spans = await apiFetch('/otel/api/spans?traceId=' + encodeURIComponent(t.trace_id));
          spansCache[t.trace_id] = spans;
        } catch (_) { continue; }
      }
      const found = spans.find(s => s.span_id === spanId);
      if (found) {
        const row = document.querySelector('.trace-row[data-trace-id="' + t.trace_id + '"]');
        if (row && !row.classList.contains('expanded')) {
          await toggleTrace(row, t);
        }
        // 等渲染完
        await new Promise(r => setTimeout(r, 60));
        selectSpan(t, spans, spanId);
        // 滚动到该 span
        const el = document.querySelector('.span-row[data-span-id="' + spanId + '"], .tree-row[data-span-id="' + spanId + '"]');
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    console.warn('spanId not found in any trace:', spanId);
  }

  /* ============================================================
   * 启动
   * ============================================================ */
  if (!sessionId) {
    showNotFound('Session not found');
  } else {
    (async () => {
      try {
        sessionData = await apiFetch('/otel/api/session/' + encodeURIComponent(sessionId));
        if (!sessionData || !sessionData.session) {
          showNotFound('Session not found');
          return;
        }
        renderPage();
        // #10 自动定位 spanId
        if (initialSpanId) {
          await autoLocateSpan(initialSpanId);
        }
      } catch (e) {
        showNotFound('Session not found');
      }
    })();
  }
})();
