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

  // ---- 带超时的 invoke ----
  // 引擎命令 (start/stop/restart_bridge) 若 Rust 侧 hang 住，invoke 永不 resolve，
  // engineBusy 会一直为 true，三个按钮永久禁用。这里加超时兜底，并在 settle 后清 timer。
  function invokeWithTimeout(cmd, ms) {
    var timer;
    var timeoutP = new Promise(function (_, reject) {
      timer = setTimeout(function () { reject(new Error('操作超时')); }, ms);
    });
    var invokeP = tauriInvoke(cmd);
    // 无论成功/失败都清掉超时 timer，避免泄露
    invokeP.then(function () { clearTimeout(timer); }, function () { clearTimeout(timer); });
    return Promise.race([invokeP, timeoutP]);
  }

  // ---- 引擎状态 ----
  var BRIDGE_PORT = '127.0.0.1:8643';
  var MAX_LOG_LINES = 200;

  var engineState = 'unknown'; // running | stopped | starting | error | unknown
  var engineBusy = false;      // 操作进行中 (按钮 loading)
  var engineLogs = [];
  var engineListeners = [];    // unlisten 函数
  var statusPollTimer = null;
  var statusPolling = false;   // 轮询 in-flight 标记，防止 fetch 堆叠
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
          // ---- AI 助手卡片 ----
          '<section class="settings-card" id="ai-card">' +
            '<div class="settings-card-head">' +
              '<div class="settings-card-title">' +
                '<span class="settings-card-icon">✨</span>' +
                '<div>' +
                  '<div class="settings-card-name">AI 助手</div>' +
                  '<div class="settings-card-desc">编辑区内嵌 AI 助手的偏好设置</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="settings-row">' +
              '<div class="settings-row-text">' +
                '<div class="settings-row-name">自动附当前文件</div>' +
                '<div class="settings-row-desc">提问时自动带上当前打开文件的正文作为上下文</div>' +
              '</div>' +
              '<label class="switch">' +
                '<input type="checkbox" id="ai-attach-file">' +
                '<span class="switch-slider"></span>' +
              '</label>' +
            '</div>' +
            '<div class="settings-row">' +
              '<div class="settings-row-text">' +
                '<div class="settings-row-name">默认模型</div>' +
                '<div class="settings-row-desc">AI 助手与对话引擎共用的默认模型</div>' +
              '</div>' +
              '<select class="settings-select" id="ai-model"></select>' +
            '</div>' +
            '<div class="settings-hint" id="ai-model-hint">模型列表需对话引擎在线后加载。</div>' +
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

    // ---- AI 助手设置 ----
    var attachEl = el('ai-attach-file');
    if (attachEl) {
      attachEl.checked = localStorage.getItem('slate.ai.attachFile') !== '0';
      attachEl.addEventListener('change', function () {
        localStorage.setItem('slate.ai.attachFile', attachEl.checked ? '1' : '0');
      });
    }
    var modelSel = el('ai-model');
    if (modelSel) {
      modelSel.addEventListener('change', function () {
        switchAiModel(modelSel.value);
      });
    }
    loadAiModels();
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

    invokeWithTimeout(cmd, 15000).then(function () {
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
      engineState = 'error';
      renderStatus();
      var msg = e && e.message ? e.message : String(e);
      appendLog('[error] ' + action + '_bridge 失败: ' + msg);
    }).finally(function () {
      // 无论成功 / 失败 / 超时，都解除按钮 loading，避免卡死无法恢复
      engineBusy = false;
      renderStatus();
    });
  }

  // ============================================================
  // 业务状态 (HTTP /status)
  // ============================================================
  function fetchBusinessStatus() {
    var meta = el('engine-meta');
    if (!meta) return Promise.resolve();
    if (engineState !== 'running') { meta.textContent = ''; return Promise.resolve(); }

    return fetch('http://' + BRIDGE_PORT + '/status')
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

  // 递归 setTimeout：等上一次 fetch 真正结束（含失败）再排下一次，
  // 避免慢请求 >10s 时 setInterval 堆叠调用。statusPolling 防 in-flight 重入。
  function startPolling() {
    stopPolling();
    var tick = function () {
      statusPollTimer = null;
      if (!settingsActive || statusPolling) return;
      var scheduleNext = function () {
        statusPolling = false;
        if (settingsActive) statusPollTimer = setTimeout(tick, 10000);
      };
      if (engineState === 'running') {
        statusPolling = true;
        fetchBusinessStatus().then(scheduleNext, scheduleNext);
      } else {
        // 非运行态：保持节奏，状态可能后续变 running
        statusPollTimer = setTimeout(tick, 10000);
      }
    };
    statusPollTimer = setTimeout(tick, 10000);
  }

  function stopPolling() {
    if (statusPollTimer) { clearTimeout(statusPollTimer); statusPollTimer = null; }
    statusPolling = false;
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
  // AI 助手：默认模型加载 / 切换
  // ============================================================
  function loadAiModels() {
    var sel = el('ai-model');
    var hint = el('ai-model-hint');
    if (!sel) return;
    fetch('http://' + BRIDGE_PORT + '/models')
      .then(function (r) { return r.json(); })
      .then(function (res) {
        var models = (res && res.models) || [];
        sel.innerHTML = '';
        models.forEach(function (mm) {
          var opt = document.createElement('option');
          opt.value = mm.id;
          opt.textContent = mm.name + ' (' + mm.provider + ')';
          sel.appendChild(opt);
        });
        return fetch('http://' + BRIDGE_PORT + '/providers').then(function (r) { return r.json(); });
      })
      .then(function (prov) {
        var current = prov && prov.current;
        if (current && current.modelId) sel.value = current.modelId;
        if (hint) hint.textContent = '';
      })
      .catch(function () {
        if (hint) hint.textContent = '模型列表不可用，请先启动对话引擎。';
      });
  }

  function switchAiModel(modelId) {
    var hint = el('ai-model-hint');
    if (!modelId) return;
    fetch('http://' + BRIDGE_PORT + '/model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId: modelId }),
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && res.ok) {
          if (hint) hint.textContent = '已切换默认模型。';
        } else {
          if (hint) hint.textContent = '切换失败: ' + (res && res.error ? res.error : 'unknown');
        }
      })
      .catch(function (e) {
        if (hint) hint.textContent = '切换失败: ' + (e && e.message ? e.message : e);
      });
  }

  // ============================================================
  // 导出 (供 index.html switchView 调用)
  // ============================================================
  window.SlateSettings = {
    activate: activateSettings,
    deactivate: deactivateSettings,
  };

})();
