/* ============================================================
   Hermes WebUI - Gateway & Context Status Module
   ============================================================ */

window.Hermes = window.Hermes || {};

(function() {
  'use strict';

  const $ = window.Hermes.$;
  const api = window.Hermes.api;
  const esc = window.Hermes.esc;
  const fmtTokens = window.Hermes.fmtTokens;
  const fmtDuration = window.Hermes.fmtDuration;
  const state = window.Hermes.state;
  const dom = window.Hermes.dom;

  // ---- 网关状态 ----
  async function checkGateway() {
    try {
      const res = await api('/status');
      const data = res.data || res.gateway || {};
      if (!dom.gatewayStatus) return;
      const dot = dom.gatewayStatus.querySelector('.dot');
      const text = dom.gatewayStatus.querySelector('.status-text');
      if (!dot || !text) return;
      if (data.status === 'up' || data.http_code === 200) {
        dot.className = 'dot online';
        text.textContent = 'pi-bridge 在线';
      } else {
        dot.className = 'dot offline';
        text.textContent = 'pi-bridge 离线';
      }
    } catch (e) {
      if (!dom.gatewayStatus) return;
      const dot = dom.gatewayStatus.querySelector('.dot');
      const text = dom.gatewayStatus.querySelector('.status-text');
      if (dot) dot.className = 'dot offline';
      if (text) text.textContent = 'pi-bridge 未启动';
    }
  }

  // ---- 统计 ----
  // 兼容原始 .stat-card（旧 main.css 仍有定义），同时输出 .pm-stat-card 走 dashboard 设计
  function renderQuickStats() {
    const sessions = state.sessions;
    const totalMessages = sessions.reduce((sum, s) => sum + (s.message_count || 0), 0);
    const totalTokens = sessions.reduce((sum, s) => sum + (s.input_tokens || 0), 0);
    dom.quickStats.innerHTML = `
      <div class="pm-stat-card">
        <div class="pm-stat-head">
          <div class="pm-stat-icon c-blue">💬</div>
        </div>
        <div class="pm-stat-value">${sessions.length}</div>
        <div class="pm-stat-label">会话</div>
        <div class="pm-stat-sub">当前项目</div>
      </div>
      <div class="pm-stat-card">
        <div class="pm-stat-head">
          <div class="pm-stat-icon c-violet">📝</div>
        </div>
        <div class="pm-stat-value">${totalMessages}</div>
        <div class="pm-stat-label">消息</div>
        <div class="pm-stat-sub">累计往返</div>
      </div>
      <div class="pm-stat-card">
        <div class="pm-stat-head">
          <div class="pm-stat-icon c-teal">⚡</div>
        </div>
        <div class="pm-stat-value">${fmtTokens(totalTokens)}</div>
        <div class="pm-stat-label">Token</div>
        <div class="pm-stat-sub">消耗合计</div>
      </div>
      <div class="pm-stat-card">
        <div class="pm-stat-head">
          <div class="pm-stat-icon c-green">📡</div>
        </div>
        <div class="pm-stat-value">●</div>
        <div class="pm-stat-label">实时</div>
        <div class="pm-stat-sub">已连接网关</div>
      </div>`;
  }

  // ---- 上下文使用状态 (对齐 CLI 状态栏格式) ----
  // P#10: 防抖去重，5s 内不重复请求
  var _lastContextFetchAt = 0;
  var _lastContextFetchSid = null;

  async function loadContextInfo(sessionId, force) {
    // P#10: 防抖去重
    var now = Date.now();
    if (!force && _lastContextFetchSid === sessionId && (now - _lastContextFetchAt) < 5000) {
      return;
    }
    _lastContextFetchAt = now;
    _lastContextFetchSid = sessionId;

    try {
      var url = '/context';
      if (sessionId) url += '?session_id=' + encodeURIComponent(sessionId);
      const res = await api(url);
      const ctx = res.context || {};
      const percent = ctx.percent || 0;
      const isActive = ctx.active;

      // 模型名: 去掉 provider 前缀 (如 "custom/glm-5.1-fp8" → "glm-5.1-fp8")
      let modelName = ctx.model || '-';
      const slashIdx = modelName.indexOf('/');
      if (slashIdx >= 0 && slashIdx < 8) {
        modelName = modelName.substring(slashIdx + 1);
      }
      if (dom.ctxModel) dom.ctxModel.textContent = modelName;

      // Token 用量: 对齐 CLI 格式 "usedK/totalK" (如 "69.1K/196.6K")
      if (ctx.used_tokens > 0 && ctx.max_tokens > 0) {
        if (dom.ctxTokens) dom.ctxTokens.textContent = fmtTokens(ctx.used_tokens) + '/' + fmtTokens(ctx.max_tokens);
      } else if (ctx.max_tokens > 0) {
        // Agent 不在内存，只能显示窗口大小
        if (dom.ctxTokens) dom.ctxTokens.textContent = '-/' + fmtTokens(ctx.max_tokens);
      } else {
        if (dom.ctxTokens) dom.ctxTokens.textContent = '-/-';
      }

      if (dom.ctxProgress) dom.ctxProgress.style.width = percent + '%';
      if (dom.ctxPercent) dom.ctxPercent.textContent = percent + '%';

      // 时长
      if (dom.ctxDuration) {
        if (isActive && ctx.duration && ctx.duration !== '-') {
          dom.ctxDuration.textContent = ctx.duration;
        } else if (!isActive) {
          dom.ctxDuration.textContent = '已结束';
        } else {
          dom.ctxDuration.textContent = '-';
        }
      }

      // 根据使用率改变进度条颜色
      const bar = dom.ctxProgress;
      if (bar) {
        bar.classList.remove('low', 'mid', 'high', 'critical');
        if (percent < 50) bar.classList.add('low');
        else if (percent < 75) bar.classList.add('mid');
        else if (percent < 90) bar.classList.add('high');
        else bar.classList.add('critical');
      }

    } catch (e) {
      if (dom.ctxModel) dom.ctxModel.textContent = '-';
      if (dom.ctxTokens) dom.ctxTokens.textContent = '-/-';
      if (dom.ctxProgress) dom.ctxProgress.style.width = '0%';
      if (dom.ctxPercent) dom.ctxPercent.textContent = '0%';
      if (dom.ctxDuration) dom.ctxDuration.textContent = '-';
    }
  }

  // ---- Exports ----
  window.Hermes.checkGateway = checkGateway;
  window.Hermes.renderQuickStats = renderQuickStats;
  window.Hermes.loadContextInfo = loadContextInfo;

  // ---- 模型选择（按 provider 分组 + 搜索）----
  // 缓存模型数据
  var _modelProviders = [];   // [{name, models:[{id,name,reasoning,contextWindow,input}]}]
  var _currentModel = null;   // {provider, modelId, name}

  /** 加载模型列表（按 provider 分组）并填充选择器 */
  async function loadProviders() {
    try {
      const res = await api('/providers');
      _modelProviders = res.providers || [];
      _currentModel = res.current || null;
      state.providers = _modelProviders;
      state.currentProvider = _currentModel ? _currentModel.modelId : '';

      // 更新 chat 工具栏 trigger
      const label = document.getElementById('provider-label');
      const trigger = document.getElementById('provider-trigger');
      if (label && _currentModel) {
        label.textContent = _currentModel.name || _currentModel.modelId;
      }
      if (trigger) {
        trigger.style.display = _modelProviders.length > 0 ? 'inline-flex' : 'none';
      }

      // 侧边栏 ctx-model 可点击切换
      var ctxModel = dom.ctxModel;
      if (ctxModel) {
        ctxModel.classList.add('clickable');
        ctxModel.title = '点击切换模型';
        ctxModel.onclick = function () { openModelModal(); };
      }
    } catch(e) {
      const trigger = document.getElementById('provider-trigger');
      if (trigger) trigger.style.display = 'none';
      console.warn('[loadProviders] failed:', e);
    }
  }

  /** 渲染模型选择器（搜索框 + 分组列表）到 container */
  function renderModelPicker(container) {
    var html = '<div class="mp-search-wrap"><input class="mp-search" type="text" placeholder="搜索模型或供应商…" value=""></div>';
    html += '<div class="mp-list">' + renderModelListHTML('') + '</div>';
    container.innerHTML = html;

    var searchInput = container.querySelector('.mp-search');
    var listEl = container.querySelector('.mp-list');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        listEl.innerHTML = renderModelListHTML(searchInput.value);
        bindModelItems(listEl);
      });
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeModelModal();
      });
    }
    bindModelItems(listEl);
    setTimeout(function () { if (searchInput) searchInput.focus(); }, 50);
  }

  /** 上下文窗口格式化 */
  function fmtCtxWindow(cw) {
    if (!cw || cw <= 0) return '';
    if (cw >= 1000000) return (cw / 1000000).toFixed(cw % 1000000 === 0 ? 0 : 1) + 'M';
    if (cw >= 1000) return Math.round(cw / 1000) + 'K';
    return String(cw);
  }

  /** 生成分组列表 HTML */
  function renderModelListHTML(query) {
    var q = (query || '').trim().toLowerCase();
    var html = '';
    _modelProviders.forEach(function (pv) {
      // 过滤：匹配模型名/id 或 provider 名
      var providerMatch = !q || (pv.name || '').toLowerCase().indexOf(q) >= 0;
      var models = pv.models.filter(function (mm) {
        if (!q) return true;
        if (providerMatch) return true; // provider 名匹配时显示该组全部
        return (mm.name || '').toLowerCase().indexOf(q) >= 0 || (mm.id || '').toLowerCase().indexOf(q) >= 0;
      });
      if (models.length === 0) return;
      html += '<div class="mp-group"><div class="mp-group-title">' + esc(pv.name) + ' <span class="mp-group-count">' + models.length + '</span></div>';
      models.forEach(function (mm) {
        var isCurrent = _currentModel && _currentModel.provider === pv.name && _currentModel.modelId === mm.id;
        var badges = '';
        if (mm.reasoning) badges += '<span class="mp-badge mp-badge-r">思考</span>';
        if (mm.input && mm.input.indexOf('image') >= 0) badges += '<span class="mp-badge mp-badge-img">图像</span>';
        var ctxStr = fmtCtxWindow(mm.contextWindow);
        var ctxHtml = ctxStr ? '<span class="mp-item-ctx">' + esc(ctxStr) + '</span>' : '';
        html += '<div class="mp-item' + (isCurrent ? ' active' : '') + '" data-provider="' + esc(pv.name) + '" data-model-id="' + esc(mm.id) + '">' +
          '<span class="mp-item-name">' + esc(mm.name || mm.id) + '</span>' +
          ctxHtml +
          badges +
          (isCurrent ? '<span class="mp-check">✓</span>' : '') +
        '</div>';
      });
      html += '</div>';
    });
    return html || '<div class="mp-empty">无匹配模型</div>';
  }

  /** 给列表项绑定点击 */
  function bindModelItems(listEl) {
    listEl.querySelectorAll('.mp-item').forEach(function (item) {
      item.addEventListener('click', function () {
        switchModel(item.dataset.provider, item.dataset.modelId);
        closeModelModal();
      });
    });
  }

  /** 切换模型 */
  async function switchModel(provider, modelId) {
    if (_currentModel && _currentModel.provider === provider && _currentModel.modelId === modelId) return;
    try {
      await api('/model', { method: 'POST', body: { provider: provider, modelId: modelId } });
      var pv = _modelProviders.find(function (p) { return p.name === provider; });
      var mm = pv ? pv.models.find(function (m) { return m.id === modelId; }) : null;
      if (mm) {
        _currentModel = { provider: provider, modelId: modelId, name: mm.name };
        state.currentProvider = modelId;
        var label = document.getElementById('provider-label');
        if (label) label.textContent = mm.name;
        if (dom.ctxModel) dom.ctxModel.textContent = mm.name;
        H.toast('模型已切换为 ' + mm.name);
      }
      H.loadContextInfo(state.focusedSessionId, true);
    } catch (e) {
      H.toast('切换模型失败: ' + e.message, true);
    }
  }

  /** 模型选择弹框（modal）*/
  var _modelModal = null;
  function openModelModal() {
    closeModelModal();
    var overlay = document.createElement('div');
    overlay.id = 'model-modal-overlay';
    overlay.className = 'mm-overlay';
    overlay.innerHTML =
      '<div class="mm-modal" role="dialog" aria-modal="true">' +
        '<div class="mm-head">' +
          '<span class="mm-title">选择模型</span>' +
          '<button class="mm-close" title="关闭 (Esc)">✕</button>' +
        '</div>' +
        '<div class="mm-body"></div>' +
      '</div>';
    document.body.appendChild(overlay);
    _modelModal = overlay;
    var body = overlay.querySelector('.mm-body');
    renderModelPicker(body);
    overlay.querySelector('.mm-close').addEventListener('click', closeModelModal);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModelModal(); });
    document.addEventListener('keydown', _modelModalEscHandler);
  }
  function _modelModalEscHandler(e) {
    if (e.key === 'Escape') closeModelModal();
  }
  function closeModelModal() {
    if (_modelModal) { _modelModal.remove(); _modelModal = null; }
    document.removeEventListener('keydown', _modelModalEscHandler);
  }

  window.Hermes.loadProviders = loadProviders;
  window.Hermes.switchProvider = switchModel;   // 旧名兼容
  window.Hermes.switchModel = switchModel;
  window.Hermes.openModelModal = openModelModal;
  window.Hermes.closeModelModal = closeModelModal;

})();
