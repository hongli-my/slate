// utils.js — 共用工具函数（fetch 封装、时间/数字格式化、颜色与 span 摘要）
// 所有页面都依赖此文件，须最先加载。

// iframe 内重定向 __TAURI__（Tauri 只注入主 frame）
if (!window.__TAURI__ && window.parent && window.parent.__TAURI__) {
  window.__TAURI__ = window.parent.__TAURI__;
}

/* ============================================================
 * fetch 封装（Tauri invoke 版）
 * ========================================================== */

/**
 * 统一数据获取：在 Tauri app 内走 invoke，路由到对应 Rust command。
 * @param {string} path  API 路径，如 /otel/api/sessions?limit=500
 * @returns {Promise<any>} data
 * @throws {Error} invoke 失败时抛出
 */
async function apiFetch(path) {
  const invoke = window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.invoke;
  if (!invoke) throw new Error('Tauri invoke 不可用（__TAURI__ 未注入）');

  // 解析路径 + query
  const u = new URL(path, 'http://localhost');
  const p = u.pathname;
  const q = u.searchParams;

  let cmd, args;
  if (p === '/otel/api/stats') {
    cmd = 'otel_stats'; args = {};
  } else if (p === '/otel/api/sessions') {
    cmd = 'otel_sessions'; args = { limit: q.has('limit') ? parseInt(q.get('limit'), 10) : null };
  } else if (p.startsWith('/otel/api/session/')) {
    cmd = 'otel_session'; args = { id: decodeURIComponent(p.slice('/otel/api/session/'.length)) };
  } else if (p === '/otel/api/spans') {
    cmd = 'otel_spans'; args = { traceId: q.get('traceId') || '' };
  } else {
    throw new Error('未知 API 路径: ' + path);
  }

  try {
    return await invoke(cmd, args);
  } catch (e) {
    throw new Error(typeof e === 'string' ? e : (e && e.message ? e.message : String(e)));
  }
}

/* ============================================================
 * 时间格式化
 * ========================================================== */

/** 相对时间："just now" / "5m ago" / "2h ago" / "3d ago" / "2mo ago" */
function formatRelativeTime(ms) {
  if (ms == null || ms < 0 || isNaN(ms)) return '-';
  const diff = Date.now() - ms;
  if (diff < 0) return 'just now';
  const s = Math.floor(diff / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return s + 's ago';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  const d = Math.floor(h / 24);
  if (d < 30) return d + 'd ago';
  const mo = Math.floor(d / 30);
  if (mo < 12) return mo + 'mo ago';
  return Math.floor(mo / 12) + 'y ago';
}

/** ISO 时间（用于 hover title） */
function formatISO(ms) {
  if (ms == null || ms < 0 || isNaN(ms)) return '-';
  return new Date(ms).toISOString();
}

/** 本地时间简短格式：2026-07-19 18:24:03 */
function formatLocalTime(ms) {
  if (ms == null || ms < 0 || isNaN(ms)) return '-';
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
    + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}

/** 耗时格式化："<1ms" / "345ms" / "1.23s" / "2.5min" / "1.2h" */
function formatDuration(ms) {
  if (ms == null || ms < 0 || isNaN(ms)) return '-';
  if (ms < 1) return '<1ms';
  if (ms < 1000) return Math.round(ms) + 'ms';
  const s = ms / 1000;
  if (s < 60) return (s < 10 ? s.toFixed(2) : s.toFixed(1)) + 's';
  const m = s / 60;
  if (m < 60) return m.toFixed(1) + 'min';
  return (m / 60).toFixed(1) + 'h';
}

/* ============================================================
 * 数字格式化
 * ========================================================== */

/** 紧凑数字：1234 → 1.2k, 1234567 → 1.2M, 1.2e9 → 1.2B */
function formatNumber(n) {
  if (n == null || isNaN(n)) return '-';
  n = Number(n);
  if (n < 1000) return String(n);
  if (n < 1e6) return (n / 1e3).toFixed(1) + 'k';
  if (n < 1e9) return (n / 1e6).toFixed(1) + 'M';
  return (n / 1e9).toFixed(1) + 'B';
}

/** 双向 token："12.3k → 5.6k" */
function formatTokens(input, output) {
  if (input == null && output == null) return '-';
  return formatNumber(input || 0) + ' → ' + formatNumber(output || 0);
}

/** cost 始终 4 位小数 */
function formatCost(cost) {
  if (cost == null || isNaN(cost)) return '$0.0000';
  return '$' + Number(cost).toFixed(4);
}

/**
 * cost 颜色档位：
 * <=0 灰 / <$0.05 灰 / <$0.5 绿 / <$2 橙 / ≥$2 红
 */
function costColor(cost) {
  if (cost == null || cost <= 0) return 'var(--cost-zero)';
  if (cost < 0.05) return 'var(--cost-low)';
  if (cost < 0.5) return 'var(--cost-mid)';
  if (cost < 2) return 'var(--cost-high)';
  return 'var(--cost-vhigh)';
}

/* ============================================================
 * 字符串工具
 * ========================================================== */

/** 截断字符串，超长加省略号 */
function truncate(str, len) {
  if (!str) return '';
  if (str.length <= len) return str;
  return str.slice(0, Math.max(1, len - 1)) + '…';
}

/** HTML 转义，防止注入 */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 把任意值格式化为可读字符串（用于 attributes tooltip） */
function formatAttrValue(v) {
  if (v == null) return 'null';
  if (typeof v === 'object') {
    try { return JSON.stringify(v); } catch (_) { return String(v); }
  }
  return String(v);
}

/* ============================================================
 * span 颜色与摘要
 * ========================================================== */

/**
 * 按 span.name 前缀分组返回颜色类别：
 * ai.* → ai(蓝) / Tool* → tool(绿) / LLM*|SessionPrompt* → llm(紫) / 其他 → other(灰)
 */
function spanColorClass(name) {
  if (!name) return 'other';
  if (name.indexOf('ai.') === 0) return 'ai';
  if (name.indexOf('Tool') === 0) return 'tool';
  if (name.indexOf('LLM') === 0 || name.indexOf('SessionPrompt') === 0) return 'llm';
  return 'other';
}

/**
 * 从 span.attributes 提取关键摘要，用于 timeline 行尾展示。
 * 返回字符串如 "model: claude-… · tool: read · tokens: 1.2k→560"
 */
function spanSummary(span) {
  const a = (span && span.attributes) || {};
  const parts = [];

  const model = a['gen_ai.request.model'] || a['model'] || a['model.id'];
  if (model) parts.push('model: ' + truncate(String(model), 24));

  const tool = a['tool.name'] || a['tool'];
  if (tool) parts.push('tool: ' + String(tool));

  const inT = a['gen_ai.usage.input_tokens'] || a['input_tokens'];
  const outT = a['gen_ai.usage.output_tokens'] || a['output_tokens'];
  if (inT != null || outT != null) {
    parts.push('tokens: ' + formatNumber(inT || 0) + '→' + formatNumber(outT || 0));
  }

  // 兜底：若都没有，挑一两个有信息量的属性
  if (parts.length === 0) {
    const keys = Object.keys(a).filter(k =>
      k !== 'session.id' && k !== 'trace.id' && k !== 'span.id');
    if (keys.length) {
      parts.push(keys.slice(0, 2).map(k => k + '=' + truncate(formatAttrValue(a[k]), 16)).join(' · '));
    }
  }
  return parts.join(' · ');
}

/* ============================================================
 * status / span metrics / JSON 树渲染（详情面板用）
 * ========================================================== */

/** 提取 span 的 status code，未设置返回 'UNSET' */
function getSpanStatus(span) {
  const code = (span && span.status && span.status.code) || '';
  return code ? String(code).toUpperCase() : 'UNSET';
}

/** session 列表聚合状态：有 ERROR span 则 ERROR，否则 OK */
function getSessionStatus(session) {
  if (session && session.error_span_count && session.error_span_count > 0) return 'ERROR';
  return 'OK';
}

/** status badge HTML（OK / ERROR / UNSET） */
function statusBadge(code) {
  const c = String(code || 'UNSET').toUpperCase();
  if (c === 'ERROR') return '<span class="status-badge status-err">ERROR</span>';
  if (c === 'OK')    return '<span class="status-badge status-ok">OK</span>';
  return '<span class="status-badge status-unset">UNSET</span>';
}

/** 从 span.attributes 提取 tokens */
function getSpanTokens(span) {
  const a = (span && span.attributes) || {};
  const i = a['gen_ai.usage.input_tokens'] != null ? a['gen_ai.usage.input_tokens'] : a['input_tokens'];
  const o = a['gen_ai.usage.output_tokens'] != null ? a['gen_ai.usage.output_tokens'] : a['output_tokens'];
  return {
    input:  i != null && !isNaN(Number(i)) ? Number(i) : null,
    output: o != null && !isNaN(Number(o)) ? Number(o) : null,
  };
}

/** 从 span.attributes 提取 cost（可能为 null，数据未上报时） */
function getSpanCost(span) {
  const a = (span && span.attributes) || {};
  const c = a['gen_ai.cost'] != null ? a['gen_ai.cost'] : a['cost'];
  return c != null && !isNaN(Number(c)) ? Number(c) : null;
}

/** 计算 span 相对父 span duration 的占比（0~1），用于热力图着色 */
function spanDurationRatio(spans, span) {
  if (!span || !span.parent_span_id) return 0;
  const parent = spans.find(s => s.span_id === span.parent_span_id);
  if (!parent) return 0;
  const pd = (parent.end_ms - parent.start_ms) || 1;
  return Math.max(0, Math.min(1, (span.duration_ms || 0) / pd));
}

/* ============================================================
 * JSON 树渲染（递归 <details>，用于详情面板 #8）
 * ============================================================ */
const LARGE_FIELD_THRESHOLD = 10 * 1024; // 10KB

/**
 * 递归渲染 JSON 树 HTML。
 * - 对象/数组 → <details>（depth<1 默认展开）
 * - 基本类型 → <div class="jt-leaf">
 * - 超大字符串 → 折叠占位，点击展开
 */
function renderJsonTree(value, key, depth) {
  depth = depth || 0;
  const keyHtml = key != null
    ? '<span class="jt-key">' + escapeHtml(String(key)) + '</span><span class="jt-colon">: </span>'
    : '';
  const isObj = value !== null && typeof value === 'object';

  if (isObj) {
    const entries = Array.isArray(value)
      ? value.map((v, i) => [i, v])
      : Object.entries(value);
    if (entries.length === 0) {
      return '<div class="jt-leaf">' + keyHtml
        + '<span class="jt-empty">' + (Array.isArray(value) ? '[]' : '{}') + '</span></div>';
    }
    const openAttr = depth < 1 ? ' open' : '';
    const kind = Array.isArray(value) ? '[' : '{';
    const kindClose = Array.isArray(value) ? ']' : '}';
    const summary = '<summary class="jt-summary">'
      + keyHtml
      + '<span class="jt-bracket">' + kind + '</span>'
      + '<span class="jt-count">' + entries.length + '</span>'
      + '<span class="jt-bracket">' + kindClose + '</span>'
      + '</summary>';
    const body = '<div class="jt-body">'
      + entries.map(([k, v]) => renderJsonTree(v, k, depth + 1)).join('')
      + '</div>';
    return '<details class="jt-node"' + openAttr + '>' + summary + body + '</details>';
  }

  // 字符串化的 JSON（如 ai.prompt、ai.toolCall.args / result）：
  // 尝试解析后递归渲染为可折叠节点，避免显示大量 \" 转义符
  var MAX_PARSE_DEPTH = 10;
  if (typeof value === 'string' && depth < MAX_PARSE_DEPTH) {
    var trimmed = value.trim();
    var head = trimmed.charAt(0);
    if (head === '{' || head === '[') {
      try {
        var parsed = JSON.parse(trimmed);
        if (parsed !== null && typeof parsed === 'object') {
          return renderJsonTree(parsed, key, depth);
        }
      } catch (_) { /* 非合法 JSON，回退到字符串渲染 */ }
    }
  }

  // 基本类型
  const isStr = typeof value === 'string';
  if (isStr && value.length > LARGE_FIELD_THRESHOLD) {
    // 大字段保护：用 data-raw 存原文（encodeURIComponent 不产生引号，可安全放进 attribute）
    const encoded = encodeURIComponent(value);
    return '<div class="jt-leaf jt-large">'
      + keyHtml
      + '<span class="jt-large-toggle" data-raw="' + encoded + '">'
      + '[大字段 · ' + value.length + ' 字符 · 点击展开]</span></div>';
  }
  let valHtml;
  if (value === null)             valHtml = '<span class="jt-null">null</span>';
  else if (isStr)                 valHtml = '<span class="jt-str">"' + escapeHtml(value) + '"</span>';
  else if (typeof value === 'number')  valHtml = '<span class="jt-num">' + escapeHtml(String(value)) + '</span>';
  else if (typeof value === 'boolean') valHtml = '<span class="jt-bool">' + escapeHtml(String(value)) + '</span>';
  else                            valHtml = '<span class="jt-str">' + escapeHtml(String(value)) + '</span>';
  return '<div class="jt-leaf">' + keyHtml + valHtml + '</div>';
}

/** 大字段点击展开绑定（事件委托，绑定到容器） */
function bindLargeFieldToggle(container) {
  container.querySelectorAll('.jt-large-toggle').forEach((toggle) => {
    if (toggle.dataset.bound) return;
    toggle.dataset.bound = '1';
    toggle.addEventListener('click', () => {
      const raw = decodeURIComponent(toggle.dataset.raw || '');
      const full = document.createElement('span');
      full.className = 'jt-str jt-str-full';
      full.textContent = '"' + raw + '"'; // textContent 自动 escape
      toggle.replaceWith(full);
    });
  });
}

/** 复制文本到剪贴板，返回 Promise */
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  // 兼容兜底
  return new Promise((resolve, reject) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      resolve();
    } catch (e) { reject(e); }
  });
}

/* ============================================================
 * localStorage 偏好读写（视图设置 #7 #9 #6 #2）
 * ============================================================ */
const OTEL_PREFS_KEY = 'otel-view-prefs';
const OTEL_GUTTER_KEY = 'otel-gutter-width';
const OTEL_COLOR_KEY  = 'otel-color-mode';
const OTEL_VIEW_KEY   = 'otel-view-mode'; // sessionStorage 用同名 key 也 ok

function loadPrefs() {
  try {
    const raw = localStorage.getItem(OTEL_PREFS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (_) { return {}; }
}

function savePrefs(prefs) {
  try { localStorage.setItem(OTEL_PREFS_KEY, JSON.stringify(prefs)); } catch (_) {}
}

/** 默认偏好 */
function defaultPrefs() {
  return {
    showDuration: true,
    showTokens:   true,
    showCost:     true,
    colorMode:    'type',    // 'type' | 'heatmap'
    minDurationMs: 0,        // 0 | 10 | 100 | 1000
  };
}
