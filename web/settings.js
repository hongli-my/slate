/* ============================================================
   settings.js — Slate 应用设置页
   首项：对话引擎 (pi-bridge sidecar 进程管理)
   非 ES module，直接用 window.__TAURI__ 全局对象
   ============================================================ */

(function () {
  'use strict';

  // ---- Tauri 桥接 (复用 index.html 既有模式) ----
  function tauriInvoke(cmd, args) {
    var core = window.__TAURI__ && window.__TAURI__.core;
    if (!core || typeof core.invoke !== 'function') {
      return Promise.reject(new Error('Tauri core.invoke 不可用'));
    }
    return core.invoke(cmd, args);
  }
  function tauriListen(event, cb) {
    var ev = window.__TAURI__ && window.__TAURI__.event;
    if (!ev || typeof ev.listen !== 'function') {
      return Promise.reject(new Error('Tauri event.listen 不可用'));
    }
    return ev.listen(event, cb);
  }

  // ---- 引擎状态 ----
  var BRIDGE_PORT = '127.0.0.1:8643';
  var MAX_LOG_LINES = 200;

  var engineState = 'unknown'; // running | stopped | starting | error | unknown
  var engineBusy = false;      // 操作进行中 (按钮 loading)
  var engineLogs = [];
  var engineListeners = [];    // unlisten 函数
  var statusPollTimer = null;
  var settingsActive = false;  // 设置页是否激活

  function esc(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function el(id) { return document.getElementById(id); }

  // ============================================================
  // 入口：初始化设置页 DOM (把 placeholder 替换为真实面板)
  // ============================================================
  function initSettingsView() {
    var view = el('view-settings');
    if (!view || view.dataset.init === '1') return;
    view.dataset.init = '1';

    view.innerHTML =
      '<div class="settings-page">' +
        '<div class="settings-header">' +
          '<h1>设置</h1>' +
          '<p class="settings-sub">管理 Slate 应用与对话引擎。</p>' +
        '</div>' +
        '<div class="settings-list">' +
          // ---- 对话引擎卡片 ----
          '<section class="settings-card" id="engine-card">' +
            '<div class="settings-card-head">' +
              '<div class="settings-card-title">' +
                '<span class="settings-card-icon">🔌</span>' +
                '<div>' +
                  '<div class="settings-card-name">对话引擎</div>' +
                  '<div class="settings-card-desc">pi-bridge sidecar 进程 · ' + BRIDGE_PORT + '</div>' +
                '</div>' +
              '</div>' +
              '<div class="settings-card-actions">' +
                '<button class="s-btn s-btn-primary" id="engine-start"><span class="s-btn-text">▶ 启动</span></button>' +
                '<button class="s-btn" id="engine-stop"><span class="s-btn-text">■ 停止</span></button>' +
                '<button class="s-btn" id="engine-restart"><span class="s-btn-text">↻ 重启</span></button>' +
              '</div>' +
            '</div>' +
            '<div class="engine-status-bar">' +
              '<span class="engine-dot" id="engine-dot"></span>' +
              '<span class="engine-status-label" id="engine-status-label">检测中…</span>' +
              '<span class="engine-meta" id="engine-meta"></span>' +
            '</div>' +
          '</section>' +
          // ---- 运行日志卡片 ----
          '<section class="settings-card" id="log-card">' +
            '<div class="settings-card-head">' +
              '<div class="settings-card-title">' +
                '<span class="settings-card-icon">📝</span>' +
                '<div class="settings-card-name">运行日志</div>' +
              '</div>' +
              '<div class="settings-card-actions">' +
                '<button class="s-btn s-btn-ghost" id="engine-clear-log">清空</button>' +
              '</div>' +
            '</div>' +
            '<pre class="engine-log" id="engine-log"></pre>' +
            '<div class="settings-hint">来自 pi-bridge 的 stdout / stderr，实时推送，保留最近 ' + MAX_LOG_LINES + ' 行。</div>' +
          '</section>' +
          // ---- 未来设置项占位 ----
          '<section class="settings-card settings-card-coming">' +
            '<div class="settings-card-title">' +
              '<span class="settings-card-icon">🎨</span>' +
              '<div class="settings-card-name">外观与编辑器</div>' +
            '</div>' +
            '<div class="settings-card-desc">主题、字体、快捷键等设置即将推出。</div>' +
          '</section>' +
        '</div>' +
      '</div>';

    // 绑定按钮
    el('engine-start').addEventListener('click', function () { engineAction('start'); });
    el('engine-stop').addEventListener('click', function () { engineAction('stop'); });
    el('engine-restart').addEventListener('click', function () { engineAction('restart'); });
    el('engine-clear-log').addEventListener('click', function () {
      engineLogs = [];
      renderLogs();
    });
  }

  // ============================================================
  // 激活 / 停用 (由 switchView hook 调用)
  // ============================================================
  function activateSettings() {
    if (settingsActive) return;
    settingsActive = true;
    initSettingsView();

    // 订阅事件
    subscribeEvents();

    // 查询初始状态
    refreshStatus();
  }

  function deactivateSettings() {
    if (!settingsActive) return;
    settingsActive = false;

    // 清理 Tauri event listener
    engineListeners.forEach(function (un) {
      if (typeof un === 'function') { try { un(); } catch (e) { /* noop */ } }
    });
    engineListeners = [];

    // 停止业务状态轮询
    if (statusPollTimer) { clearTimeout(statusPollTimer); statusPollTimer = null; }
  }

  // ============================================================
  // 事件订阅
  // ============================================================
  function subscribeEvents() {
    // 日志行
    tauriListen('pi-bridge://log', function (ev) {
      var line = ev && ev.payload;
      if (line == null) return;
      if (typeof line === 'object') line = line.line || line.message || JSON.stringify(line);
      appendLog(String(line));
    }).then(function (un) { engineListeners.push(un); })
      .catch(function () { /* 静默 */ });

    // 健康检查通过
    tauriListen('pi-bridge://ready', function () {
      engineState = 'running';
      renderStatus();
      fetchBusinessStatus();
      appendLog('[ready] 健康检查通过，服务可用');
    }).then(function (un) { engineListeners.push(un); })
      .catch(function () { /* noop */ });

    // 健康检查失败 / 启动超时
    tauriListen('pi-bridge://error', function (ev) {
      engineState = 'error';
      renderStatus();
      stopPolling();
      var msg = ev && ev.payload;
      if (typeof msg === 'object') msg = msg.message || JSON.stringify(msg);
      appendLog('[error] ' + (msg || '健康检查未通过 (15s 超时)'));
    }).then(function (un) { engineListeners.push(un); })
      .catch(function () { /* noop */ });

    // 进程退出
    tauriListen('pi-bridge://terminated', function (ev) {
      engineState = 'stopped';
      renderStatus();
      stopPolling();
      var payload = ev && ev.payload;
      var code = (payload && payload.code != null) ? payload.code : '?';
      appendLog('[terminated] 进程退出 (code=' + code + ')');
    }).then(function (un) { engineListeners.push(un); })
      .catch(function () { /* noop */ });
  }

  // ============================================================
  // 状态查询
  // ============================================================
  function refreshStatus() {
    tauriInvoke('bridge_status').then(function (running) {
      engineState = running ? 'running' : 'stopped';
      renderStatus();
      if (running) {
        fetchBusinessStatus();
        startPolling();
      } else {
        stopPolling();
        var meta = el('engine-meta');
        if (meta) meta.textContent = '';
      }
    }).catch(function (e) {
      engineState = 'error';
      renderStatus();
      appendLog('[error] bridge_status 查询失败: ' + (e && e.message ? e.message : e));
    });
  }

  function renderStatus() {
    var dot = el('engine-dot');
    var label = el('engine-status-label');
    if (!dot || !label) return;

    var dotCls, text;
    if (engineState === 'running') { dotCls = 'engine-dot online'; text = '运行中'; }
    else if (engineState === 'starting') { dotCls = 'engine-dot starting'; text = '启动中…'; }
    else if (engineState === 'error') { dotCls = 'engine-dot error'; text = '异常'; }
    else if (engineState === 'stopped') { dotCls = 'engine-dot stopped'; text = '已停止'; }
    else { dotCls = 'engine-dot stopped'; text = '检测中…'; }

    dot.className = dotCls;
    label.textContent = text;

    // 按钮禁用
    var isRunning = engineState === 'running';
    var isStopped = engineState === 'stopped' || engineState === 'error' || engineState === 'unknown';
    var btnStart = el('engine-start');
    var btnStop = el('engine-stop');
    var btnRestart = el('engine-restart');
    if (btnStart) btnStart.disabled = engineBusy || isRunning;
    if (btnStop) btnStop.disabled = engineBusy || isStopped;
    if (btnRestart) btnRestart.disabled = engineBusy || isStopped;
  }

  // ============================================================
  // 操作：启动 / 停止 / 重启
  // ============================================================
  function engineAction(action) {
    var cmd = action === 'start' ? 'start_bridge'
            : action === 'stop' ? 'stop_bridge'
            : 'restart_bridge';
    engineBusy = true;
    if (action === 'start' || action === 'restart') {
      engineState = 'starting';
    }
    renderStatus();
    appendLog('[cmd] ' + action + '_bridge …');

    tauriInvoke(cmd).then(function () {
      engineBusy = false;
      appendLog('[cmd] ' + action + '_bridge 完成');
      if (action === 'stop') {
        engineState = 'stopped';
        renderStatus();
        stopPolling();
        var meta = el('engine-meta');
        if (meta) meta.textContent = '';
      } else {
        // start/restart: 等 ready/error 事件更新，兜底轮询
        setTimeout(refreshStatus, 800);
      }
    }).catch(function (e) {
      engineBusy = false;
      engineState = 'error';
      renderStatus();
      var msg = e && e.message ? e.message : String(e);
      appendLog('[error] ' + action + '_bridge 失败: ' + msg);
    });
  }

  // ============================================================
  // 业务状态 (HTTP /status)
  // ============================================================
  function fetchBusinessStatus() {
    var meta = el('engine-meta');
    if (!meta) return;
    if (engineState !== 'running') { meta.textContent = ''; return; }

    fetch('http://' + BRIDGE_PORT + '/status')
      .then(function (r) { return r.json(); })
      .then(function (res) {
        var data = res && res.data ? res.data : (res || {});
        var parts = [];
        if (res && res.model) parts.push('🧠 ' + res.model);
        else if (data.model) parts.push('🧠 ' + data.model);
        if (data.pid) parts.push('PID ' + data.pid);
        if (data.status) parts.push(data.status);
        meta.textContent = parts.join(' · ') || '服务在线';
      })
      .catch(function () {
        meta.textContent = '正在启动…';
      });
  }

  function startPolling() {
    stopPolling();
    statusPollTimer = setInterval(function () {
      if (engineState === 'running' && settingsActive) {
        fetchBusinessStatus();
      }
    }, 10000);
  }

  function stopPolling() {
    if (statusPollTimer) { clearInterval(statusPollTimer); statusPollTimer = null; }
  }

  // ============================================================
  // 日志
  // ============================================================
  function appendLog(line) {
    var ts = new Date().toTimeString().slice(0, 8);
    engineLogs.push('[' + ts + '] ' + line);
    if (engineLogs.length > MAX_LOG_LINES) {
      engineLogs = engineLogs.slice(-MAX_LOG_LINES);
    }
    renderLogs();
  }

  function renderLogs() {
    var pre = el('engine-log');
    if (!pre) return;
    pre.textContent = engineLogs.join('\n');
    pre.scrollTop = pre.scrollHeight;
  }

  // ============================================================
  // 导出 (供 index.html switchView 调用)
  // ============================================================
  window.SlateSettings = {
    activate: activateSettings,
    deactivate: deactivateSettings,
  };

})();
