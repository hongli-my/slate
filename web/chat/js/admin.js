/* ============================================================
   admin.js — 配置中心：Subagent / Extension / Skill / Settings
   展示 + subagent CRUD + settings 编辑
   ============================================================ */

window.Hermes = window.Hermes || {};

(function () {
  'use strict';

  var H = window.Hermes;
  var esc = H.esc;
  var api = H.api;

  var currentTab = 'agents'; // agents | extensions | skills | settings
  var cache = { agents: [], extensions: [], skills: [], settings: {} };

  function getView() { return document.getElementById('admin-view'); }

  // ============================================================
  // 入口
  // ============================================================
  function openAdmin(tab) {
    currentTab = tab || currentTab;
    H.showView('admin');
    renderShell();
    loadCurrent();
  }

  // 侧边栏导航与当前 tab 联动高亮
  function syncNavActive(tab) {
    document.querySelectorAll('.sidebar-nav .nav-btn[data-admin]').forEach(function (btn) {
      btn.classList.toggle('active', !!tab && btn.dataset.admin === tab);
    });
  }

  function renderShell() {
    var el = getView();
    if (!el) return;
    var tabs = [
      ['agents', '🤖 Subagent'],
      ['extensions', '🧩 扩展'],
      ['skills', '🎯 Skills'],
      ['schedules', '⏰ 定时任务'],
      ['settings', '⚙️ Settings'],
    ];
    var tabHtml = tabs.map(function (t) {
      return '<button class="admin-tab' + (t[0] === currentTab ? ' active' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>';
    }).join('');
    el.innerHTML =
      '<div class="admin-header">' +
        '<div class="admin-title">⚙️ 配置中心</div>' +
        '<div class="admin-tabs">' + tabHtml + '</div>' +
        '<button class="admin-close" id="admin-close" title="返回">✕</button>' +
      '</div>' +
      '<div class="admin-body" id="admin-body"></div>';
    el.querySelectorAll('.admin-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentTab = btn.dataset.tab;
        renderShell();
        loadCurrent();
      });
    });
    var closeBtn = el.querySelector('#admin-close');
    if (closeBtn) closeBtn.addEventListener('click', function () {
      H.state.focusedSessionId = null;
      H.state.viewMode = 'list';
      H.showView('welcome');
      syncNavActive(null);
    });
    syncNavActive(currentTab);
  }

  function loadCurrent() {
    if (currentTab === 'agents') loadAgents();
    else if (currentTab === 'extensions') loadExtensions();
    else if (currentTab === 'skills') loadSkillsView();
    else if (currentTab === 'schedules') loadSchedules();
    else if (currentTab === 'settings') loadSettingsView();
  }

  function setBody(html) {
    var el = getView();
    if (!el) return;
    var body = el.querySelector('#admin-body');
    if (body) body.innerHTML = html;
  }

  // ============================================================
  // Subagent
  // ============================================================
  function loadAgents() {
    setBody('<div class="admin-loading">加载中…</div>');
    api('/agents').then(function (res) {
      cache.agents = res.data || [];
      renderAgents();
    }).catch(function (e) { setBody('<div class="admin-error">' + esc(e.message) + '</div>'); });
  }

  function renderAgents() {
    var list = cache.agents;
    var html = '<div class="admin-toolbar">' +
      '<span class="admin-count">' + list.length + ' 个 subagent · 目录 ~/.pi/agent/agents</span>' +
      '<button class="btn-primary btn-sm" id="admin-agent-new">+ 新建 Subagent</button>' +
      '</div>';
    if (list.length === 0) {
      html += '<div class="admin-empty">还没有 subagent。</div>';
    } else {
      html += '<div class="card-grid">';
      list.forEach(function (a) {
        var tools = (a.tools || []).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('');
        var skills = (a.skills || []).map(function (s) { return '<span class="tag tag-skill">' + esc(s) + '</span>'; }).join('');
        html += '<div class="config-card" data-name="' + esc(a.name) + '">' +
          '<div class="config-card-head">' +
            '<div class="config-card-name">' + esc(a.name) + '</div>' +
            '<div class="config-card-actions">' +
              '<button class="icon-btn" data-act="edit" title="编辑">✏️</button>' +
              '<button class="icon-btn" data-act="del" title="删除">🗑</button>' +
            '</div>' +
          '</div>' +
          '<div class="config-card-desc">' + esc(a.description || '—') + '</div>' +
          '<div class="config-card-meta">' +
            (a.model ? '<span class="meta-item">🧠 ' + esc(a.model) + '</span>' : '') +
            '<span class="meta-item">📁 ' + esc(a.defaultContext) + '</span>' +
            '<span class="meta-item">' + (a.systemPromptMode === 'replace' ? '🔁 replace' : '➕ append') + '</span>' +
            (a.inheritProjectContext ? '<span class="meta-item">📎 proj</span>' : '') +
            (a.hasSkillsDir ? '<span class="meta-item">📂 skills/</span>' : '') +
          '</div>' +
          (tools ? '<div class="config-card-tags">' + tools + '</div>' : '') +
          (skills ? '<div class="config-card-tags">' + skills + '</div>' : '') +
        '</div>';
      });
      html += '</div>';
    }
    setBody(html);
    var newBtn = document.querySelector('#admin-agent-new');
    if (newBtn) newBtn.addEventListener('click', function () { agentEditor(null); });
    document.querySelectorAll('#admin-body .config-card').forEach(function (card) {
      var name = card.dataset.name;
      var editBtn = card.querySelector('[data-act="edit"]');
      var delBtn = card.querySelector('[data-act="del"]');
      if (editBtn) editBtn.addEventListener('click', function () { agentEditor(name); });
      if (delBtn) delBtn.addEventListener('click', function () { deleteAgent(name); });
    });
  }

  function deleteAgent(name) {
    if (!confirm('删除 subagent "' + name + '"？\n目录及 skills 子目录都会删除，不可恢复。')) return;
    api('/agents/' + encodeURIComponent(name), { method: 'DELETE' }).then(function () {
      H.toast('已删除 ' + name);
      loadAgents();
    }).catch(function (e) { H.toast('删除失败: ' + e.message, true); });
  }

  // ---- Subagent 编辑弹窗 ----
  function agentEditor(name) {
    var a = name ? cache.agents.find(function (x) { return x.name === name; }) : null;
    var isNew = !a;
    var existing = document.getElementById('agent-editor-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'agent-editor-overlay';
    overlay.className = 'ae-overlay';
    overlay.innerHTML =
      '<div class="ae-dialog">' +
        '<div class="ae-header">' +
          '<span>' + (isNew ? '新建 Subagent' : '编辑 Subagent') + '</span>' +
          '<button class="ae-close" id="ae-close">✕</button>' +
        '</div>' +
        '<div class="ae-body">' +
          '<div class="ae-field"><label>名称 (name)</label><input id="ae-name" value="' + esc(a ? a.name : '') + '" placeholder="如 my-agent" ' + (isNew ? '' : '') + '></div>' +
          '<div class="ae-field"><label>描述 (description)</label><input id="ae-desc" value="' + esc(a ? a.description : '') + '"></div>' +
          '<div class="ae-row">' +
            '<div class="ae-field"><label>模型 (model，可空)</label><input id="ae-model" value="' + esc(a ? a.model : '') + '" placeholder="provider/model"></div>' +
            '<div class="ae-field"><label>工具 (tools，逗号分隔)</label><input id="ae-tools" value="' + esc(a ? (a.tools || []).join(', ') : '') + '" placeholder="read, grep, ls, bash"></div>' +
          '</div>' +
          '<div class="ae-row">' +
            '<div class="ae-field"><label>systemPromptMode</label>' +
              '<select id="ae-spm"><option value="append"' + (a && a.systemPromptMode === 'append' ? ' selected' : '') + '>append</option>' +
              '<option value="replace"' + (a && a.systemPromptMode === 'replace' ? ' selected' : '') + '>replace</option></select>' +
            '</div>' +
            '<div class="ae-field"><label>defaultContext</label>' +
              '<select id="ae-dc"><option value="fresh"' + (a && a.defaultContext === 'fresh' ? ' selected' : '') + '>fresh</option>' +
              '<option value="fork"' + (a && a.defaultContext === 'fork' ? ' selected' : '') + '>fork</option></select>' +
            '</div>' +
          '</div>' +
          '<div class="ae-row">' +
            '<div class="ae-field"><label>skills (逗号分隔)</label><input id="ae-skills" value="' + esc(a ? (a.skills || []).join(', ') : '') + '"></div>' +
            '<div class="ae-field"><label>skillPath</label><input id="ae-skillpath" value="' + esc(a ? a.skillPath : '') + '" placeholder="./skills"></div>' +
          '</div>' +
          '<div class="ae-row ae-checks">' +
            '<label class="ae-check"><input type="checkbox" id="ae-ipc"' + (a ? (a.inheritProjectContext ? ' checked' : '') : ' checked') + '> inheritProjectContext</label>' +
            '<label class="ae-check"><input type="checkbox" id="ae-is"' + (a ? (a.inheritSkills ? ' checked' : '') : ' checked') + '> inheritSkills</label>' +
          '</div>' +
          '<div class="ae-field"><label>System Prompt 正文 (body)</label><textarea id="ae-body" rows="14" placeholder="你是…">' + esc(a ? a.body : '') + '</textarea></div>' +
        '</div>' +
        '<div class="ae-footer">' +
          '<button class="btn-sm" id="ae-cancel">取消</button>' +
          '<button class="btn-primary btn-sm" id="ae-save">保存</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    function close() { overlay.remove(); }

    function collect() {
      var $ = function (id) { return document.getElementById(id); };
      var tools = $('ae-tools').value.trim();
      var skills = $('ae-skills').value.trim();
      function splitArr(s) { return s ? s.split(',').map(function (x) { return x.trim(); }).filter(Boolean) : []; }
      return {
        name: $('ae-name').value.trim(),
        description: $('ae-desc').value,
        model: $('ae-model').value.trim(),
        tools: splitArr(tools),
        systemPromptMode: $('ae-spm').value,
        defaultContext: $('ae-dc').value,
        skills: splitArr(skills),
        skillPath: $('ae-skillpath').value.trim(),
        inheritProjectContext: $('ae-ipc').checked,
        inheritSkills: $('ae-is').checked,
        body: $('ae-body').value,
      };
    }

    function save() {
      var data = collect();
      if (!data.name) { H.toast('name 不能为空', true); return; }
      if (!/^[a-zA-Z0-9_-]+$/.test(data.name)) { H.toast('name 只能含字母数字 _ -', true); return; }
      var req = isNew
        ? api('/agents', { method: 'POST', body: data })
        : api('/agents/' + encodeURIComponent(name), { method: 'PATCH', body: data });
      req.then(function () {
        H.toast(isNew ? '已创建 ' + data.name : '已保存');
        close();
        loadAgents();
      }).catch(function (e) { H.toast('保存失败: ' + e.message, true); });
    }

    overlay.querySelector('#ae-close').addEventListener('click', close);
    overlay.querySelector('#ae-cancel').addEventListener('click', close);
    overlay.querySelector('#ae-save').addEventListener('click', save);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.getElementById('agent-editor-overlay')) close();
    });
    setTimeout(function () { var i = document.getElementById('ae-name'); if (i) i.focus(); }, 80);
  }

  // ============================================================
  // Extensions
  // ============================================================
  function loadExtensions() {
    setBody('<div class="admin-loading">加载中…</div>');
    api('/extensions').then(function (res) {
      cache.extensions = res.data || [];
      renderExtensions();
    }).catch(function (e) { setBody('<div class="admin-error">' + esc(e.message) + '</div>'); });
  }

  function renderExtensions() {
    var list = cache.extensions;
    var html = '<div class="admin-toolbar"><span class="admin-count">' + list.length + ' 个扩展 · 来源：本地目录 + settings.packages</span></div>';
    if (list.length === 0) {
      html += '<div class="admin-empty">没有扩展。可在 ~/.pi/agent/extensions 放目录，或在 settings.json 的 packages 加 "npm:xxx"。</div>';
    } else {
      html += '<div class="card-grid">';
      list.forEach(function (x) {
        var typeIcon = x.type === 'local' ? '📁' : (x.type === 'package' ? '📦' : '🔗');
        var typeLabel = x.type === 'local' ? '本地' : (x.type === 'package' ? 'npm包' : '路径');
        html += '<div class="config-card">' +
          '<div class="config-card-head">' +
            '<div class="config-card-name">' + typeIcon + ' ' + esc(x.name) + '</div>' +
            '<span class="type-badge">' + typeLabel + '</span>' +
          '</div>' +
          '<div class="config-card-desc">' + esc(x.description || '—') + '</div>' +
          '<div class="config-card-meta">' +
            (x.version ? '<span class="meta-item">v' + esc(x.version) + '</span>' : '') +
            (x.installed === false ? '<span class="meta-item meta-warn">未安装</span>' : '<span class="meta-item meta-ok">已安装</span>') +
          '</div>' +
          (x.path ? '<div class="config-card-path" title="' + esc(x.path) + '">' + esc(x.path) + '</div>' : '') +
        '</div>';
      });
      html += '</div>';
    }
    setBody(html);
  }

  // ============================================================
  // Skills
  // ============================================================
  function loadSkillsView() {
    setBody('<div class="admin-loading">加载中…</div>');
    api('/skills').then(function (res) {
      cache.skills = res.data || [];
      renderSkillsView();
    }).catch(function (e) { setBody('<div class="admin-error">' + esc(e.message) + '</div>'); });
  }

  function renderSkillsView() {
    var list = cache.skills;
    var html = '<div class="admin-toolbar"><span class="admin-count">' + list.length + ' 个 skill · 由 loadSkills() 加载</span></div>';
    if (list.length === 0) {
      html += '<div class="admin-empty">没有 skill。可在 ~/.pi/agent/skills 放 SKILL.md。</div>';
    } else {
      html += '<div class="card-grid">';
      list.forEach(function (s) {
        html += '<div class="config-card">' +
          '<div class="config-card-head">' +
            '<div class="config-card-name">🎯 ' + esc(s.name) + '</div>' +
            (s.disableModelInvocation ? '<span class="type-badge">仅手动</span>' : '<span class="type-badge type-badge-ok">可调用</span>') +
          '</div>' +
          '<div class="config-card-desc">' + esc(s.description || '—') + '</div>' +
          (s.baseDir ? '<div class="config-card-path" title="' + esc(s.baseDir) + '">' + esc(s.baseDir) + '</div>' : '') +
        '</div>';
      });
      html += '</div>';
    }
    setBody(html);
  }

  // ============================================================
  // Settings（JSON 编辑器）
  // ============================================================
  function loadSettingsView() {
    setBody('<div class="admin-loading">加载中…</div>');
    api('/settings').then(function (res) {
      cache.settings = res.data || {};
      renderSettingsView();
    }).catch(function (e) { setBody('<div class="admin-error">' + esc(e.message) + '</div>'); });
  }

  function renderSettingsView() {
    var pretty = JSON.stringify(cache.settings, null, 2);
    var html = '<div class="admin-toolbar">' +
      '<span class="admin-count">settings.json · 直接编辑 JSON（PATCH 合并保存）</span>' +
      '<button class="btn-primary btn-sm" id="admin-settings-save">💾 保存</button>' +
      '</div>' +
      '<div class="settings-editor-wrap"><textarea id="admin-settings-json" class="settings-editor" spellcheck="false">' + esc(pretty) + '</textarea></div>' +
      '<div class="admin-hint">⚠️ 保存为全量 PATCH 合并（顶层字段覆盖）。packages/extensions 等数组字段会整体替换。改 packages 后需重启 pi-bridge 生效。</div>';
    setBody(html);
    var saveBtn = document.querySelector('#admin-settings-save');
    if (saveBtn) saveBtn.addEventListener('click', saveSettings);
  }

  function saveSettings() {
    var ta = document.getElementById('admin-settings-json');
    if (!ta) return;
    var obj;
    try { obj = JSON.parse(ta.value); }
    catch (e) { H.toast('JSON 格式错误: ' + e.message, true); return; }
    api('/settings', { method: 'PATCH', body: obj }).then(function (res) {
      cache.settings = res.data || obj;
      H.toast('settings 已保存');
      renderSettingsView();
    }).catch(function (e) { H.toast('保存失败: ' + e.message, true); });
  }

  // ============================================================
  // Schedules（定时任务）
  // ============================================================
  var schedCache = [];

  function loadSchedules() {
    setBody('<div class="admin-loading">加载中…</div>');
    api('/schedules').then(function (res) {
      schedCache = res.data || [];
      renderSchedules();
    }).catch(function (e) { setBody('<div class="admin-error">' + esc(e.message) + '</div>'); });
  }

  function fmtSchedTime(ts) {
    if (!ts) return '—';
    var d = new Date(ts);
    return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' + d.toTimeString().slice(0, 5);
  }

  function fmtRunStatus(s) {
    return { success: '✅ 成功', failed: '❌ 失败', timeout: '⏱ 超时', skipped: '⏭ 跳过', running: '🔄 运行中' }[s] || s;
  }

  function cronHuman(cron) {
    if (!window.cronstrue || !cron) return '';
    try { return window.cronstrue.toString(cron); } catch (e) { return ''; }
  }

  function renderSchedules() {
    var list = schedCache;
    var html = '<div class="admin-toolbar">' +
      '<span class="admin-count">' + list.length + ' 个定时任务 · ~/.pi/agent/schedules.json</span>' +
      '<button class="btn-primary btn-sm" id="admin-sched-new">+ 新建任务</button>' +
      '</div>';
    if (list.length === 0) {
      html += '<div class="admin-empty">还没有定时任务。点击「新建任务」创建。</div>';
    } else {
      html += '<div class="card-grid">';
      list.forEach(function (t) {
        var human = cronHuman(t.cron);
        var badge = t.enabled ? '<span class="type-badge type-badge-ok">启用</span>' : '<span class="type-badge">停用</span>';
        html += '<div class="config-card" data-id="' + esc(t.id) + '">' +
          '<div class="config-card-head">' +
            '<div class="config-card-name">⏰ ' + esc(t.name) + '</div>' +
            '<div class="config-card-actions">' +
              '<button class="icon-btn" data-act="run" title="立即运行">▶️</button>' +
              '<button class="icon-btn" data-act="edit" title="编辑">✏️</button>' +
              '<button class="icon-btn" data-act="del" title="删除">🗑</button>' +
            '</div>' +
          '</div>' +
          '<div class="config-card-desc">' + esc(t.prompt.slice(0, 100)) + (t.prompt.length > 100 ? '…' : '') + '</div>' +
          '<div class="config-card-meta">' +
            '<span class="meta-item">📋 <code>' + esc(t.cron) + '</code></span>' +
            (human ? '<span class="meta-item">' + esc(human) + '</span>' : '') +
            badge +
          '</div>' +
          '<div class="config-card-meta">' +
            '<span class="meta-item">上次: ' + esc(fmtSchedTime(t.lastRunAt)) + '</span>' +
            '<span class="meta-item">下次: ' + esc(fmtSchedTime(t.nextRunAt)) + '</span>' +
            (t.model ? '<span class="meta-item">🧠 ' + esc(t.model) + '</span>' : '') +
          '</div>' +
        '</div>';
      });
      html += '</div>';
    }
    setBody(html);
    var newBtn = document.querySelector('#admin-sched-new');
    if (newBtn) newBtn.addEventListener('click', function () { scheduleEditor(null); });
    document.querySelectorAll('#admin-body .config-card[data-id]').forEach(function (card) {
      var cid = card.dataset.id;
      card.querySelector('[data-act="edit"]').addEventListener('click', function (e) { e.stopPropagation(); scheduleEditor(cid); });
      card.querySelector('[data-act="del"]').addEventListener('click', function (e) { e.stopPropagation(); deleteSchedule(cid); });
      card.querySelector('[data-act="run"]').addEventListener('click', function (e) { e.stopPropagation(); runScheduleNow(cid); });
      card.addEventListener('click', function (e) {
        if (e.target.closest('.icon-btn')) return;
        loadScheduleRuns(cid);
      });
    });
  }

  function deleteSchedule(id) {
    var t = schedCache.find(function (x) { return x.id === id; });
    if (!t) return;
    if (!confirm('删除定时任务「' + t.name + '」？')) return;
    api('/schedules/' + id, { method: 'DELETE' }).then(function () {
      H.toast('已删除 ' + t.name);
      loadSchedules();
    }).catch(function (e) { H.toast('删除失败: ' + e.message, true); });
  }

  function runScheduleNow(id) {
    var t = schedCache.find(function (x) { return x.id === id; });
    if (!t) return;
    H.toast('正在运行「' + t.name + '」…');
    api('/schedules/' + id + '/run', { method: 'POST' }).then(function (res) {
      var run = res.data || {};
      H.toast('任务完成: ' + fmtRunStatus(run.status));
      loadScheduleRuns(id);
    }).catch(function (e) { H.toast('运行失败: ' + e.message, true); });
  }

  // ---- 任务编辑弹窗（含 Cron Builder）----
  function scheduleEditor(id) {
    var t = id ? schedCache.find(function (x) { return x.id === id; }) : null;
    var isNew = !t;
    var existing = document.getElementById('sched-editor-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'sched-editor-overlay';
    overlay.className = 'ae-overlay';
    overlay.innerHTML =
      '<div class="ae-dialog ae-dialog-wide">' +
        '<div class="ae-header">' +
          '<span>' + (isNew ? '新建定时任务' : '编辑定时任务') + '</span>' +
          '<button class="ae-close" id="se-close">✕</button>' +
        '</div>' +
        '<div class="ae-body">' +
          '<div class="ae-field"><label>任务名称</label><input id="se-name" value="' + esc(t ? t.name : '') + '" placeholder="如 每日集群巡检"></div>' +
          '<div class="ae-field"><label>Prompt（发给 agent 的指令）</label><textarea id="se-prompt" rows="5" placeholder="检查集群状态，如有异常请详细描述…">' + esc(t ? t.prompt : '') + '</textarea></div>' +
          '<div class="ae-row">' +
            '<div class="ae-field"><label>频率</label>' +
              '<select id="se-freq">' +
                '<option value="minute">每分钟</option>' +
                '<option value="hour">每小时</option>' +
                '<option value="day">每天</option>' +
                '<option value="week">每周</option>' +
                '<option value="month">每月</option>' +
                '<option value="custom">自定义</option>' +
              '</select>' +
            '</div>' +
            '<div class="ae-field" id="se-time-wrap"><label>时间 (HH:MM)</label><input id="se-time" type="time" value="09:00"></div>' +
            '<div class="ae-field" id="se-dow-wrap" style="display:none"><label>星期几</label>' +
              '<select id="se-dow"><option value="1">周一</option><option value="2">周二</option><option value="3">周三</option><option value="4">周四</option><option value="5">周五</option><option value="6">周六</option><option value="0">周日</option></select>' +
            '</div>' +
            '<div class="ae-field" id="se-dom-wrap" style="display:none"><label>几号</label><input id="se-dom" type="number" min="1" max="31" value="1"></div>' +
            '<div class="ae-field" id="se-min-wrap" style="display:none"><label>第几分钟</label><input id="se-min" type="number" min="0" max="59" value="0"></div>' +
          '</div>' +
          '<div class="ae-field">' +
            '<label>Cron 表达式</label>' +
            '<input id="se-cron" value="' + esc(t ? t.cron : '0 9 * * *') + '" placeholder="0 9 * * 1-5">' +
            '<div class="cron-preview" id="se-cron-preview"></div>' +
          '</div>' +
          '<div class="ae-row">' +
            '<div class="ae-field"><label>模型（空=默认）</label><input id="se-model" value="' + esc(t ? (t.model || '') : '') + '" placeholder="如 glm5-cdp"></div>' +
            '<div class="ae-field"><label>工作目录（空=默认）</label><input id="se-cwd" value="' + esc(t ? (t.cwd || '') : '') + '" placeholder="/Users/honglichang/ai-home"></div>' +
          '</div>' +
          '<div class="ae-row ae-checks">' +
            '<label class="ae-check"><input type="checkbox" id="se-enabled"' + (!t || t.enabled ? ' checked' : '') + '> 启用</label>' +
          '</div>' +
        '</div>' +
        '<div class="ae-footer">' +
          '<button class="btn-sm" id="se-cancel">取消</button>' +
          '<button class="btn-primary btn-sm" id="se-save">保存</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    // Reverse-engineer frequency from existing cron
    if (t) {
      var parts = t.cron.split(/\s+/);
      var pm = parts[0], ph = parts[1], pdom = parts[2], pdow = parts[4];
      var freq = 'custom';
      if (pm === '*' && ph === '*') freq = 'minute';
      else if (ph === '*' && pdom === '*' && pdow === '*') freq = 'hour';
      else if (pdom === '*' && pdow === '*') freq = 'day';
      else if (pdom === '*') freq = 'week';
      else if (pdow === '*') freq = 'month';
      document.getElementById('se-freq').value = freq;
      if (ph !== '*' && ph) document.getElementById('se-time').value = String(ph).padStart(2, '0') + ':' + String(pm).padStart(2, '0');
      if (freq === 'hour') document.getElementById('se-min').value = pm;
      if (freq === 'week') document.getElementById('se-dow').value = pdow || '1';
      if (freq === 'month') document.getElementById('se-dom').value = pdom || '1';
    }

    function updateFreqUI() {
      var freq = document.getElementById('se-freq').value;
      document.getElementById('se-time-wrap').style.display = (freq === 'minute' || freq === 'hour' || freq === 'custom') ? 'none' : '';
      document.getElementById('se-dow-wrap').style.display = freq === 'week' ? '' : 'none';
      document.getElementById('se-dom-wrap').style.display = freq === 'month' ? '' : 'none';
      document.getElementById('se-min-wrap').style.display = freq === 'hour' ? '' : 'none';
      document.getElementById('se-cron').readOnly = freq !== 'custom';
      updateCronFromFreq();
    }

    function updateCronFromFreq() {
      var freq = document.getElementById('se-freq').value;
      if (freq === 'custom') { updateCronPreview(); return; }
      var cron = '';
      if (freq === 'minute') cron = '* * * * *';
      if (freq === 'hour') cron = (document.getElementById('se-min').value || '0') + ' * * * *';
      if (freq === 'day' || freq === 'week' || freq === 'month') {
        var time = (document.getElementById('se-time').value || '09:00').split(':');
        var h = time[0] || '9', mi = time[1] || '0';
        if (freq === 'day') cron = mi + ' ' + h + ' * * *';
        if (freq === 'week') cron = mi + ' ' + h + ' * * ' + (document.getElementById('se-dow').value || '1');
        if (freq === 'month') cron = mi + ' ' + h + ' ' + (document.getElementById('se-dom').value || '1') + ' * *';
      }
      document.getElementById('se-cron').value = cron;
      updateCronPreview();
    }

    function updateCronPreview() {
      var cron = document.getElementById('se-cron').value.trim();
      var el = document.getElementById('se-cron-preview');
      if (!cron) { el.textContent = ''; return; }
      try { el.textContent = window.cronstrue ? window.cronstrue.toString(cron) : ''; }
      catch (e) { el.textContent = '⚠️ 无效的 cron 表达式'; }
    }

    document.getElementById('se-freq').addEventListener('change', updateFreqUI);
    ['se-time', 'se-dow', 'se-dom', 'se-min'].forEach(function (fid) {
      var el = document.getElementById(fid);
      if (el) el.addEventListener('change', updateCronFromFreq);
    });
    document.getElementById('se-cron').addEventListener('input', updateCronPreview);
    updateFreqUI();

    function close() { overlay.remove(); }

    function collect() {
      return {
        name: document.getElementById('se-name').value.trim(),
        prompt: document.getElementById('se-prompt').value,
        cron: document.getElementById('se-cron').value.trim(),
        model: document.getElementById('se-model').value.trim(),
        cwd: document.getElementById('se-cwd').value.trim(),
        enabled: document.getElementById('se-enabled').checked,
      };
    }

    function save() {
      var data = collect();
      if (!data.name) { H.toast('名称不能为空', true); return; }
      if (!data.prompt) { H.toast('Prompt 不能为空', true); return; }
      if (!data.cron) { H.toast('Cron 表达式不能为空', true); return; }
      var req = isNew
        ? api('/schedules', { method: 'POST', body: data })
        : api('/schedules/' + id, { method: 'PUT', body: data });
      req.then(function () {
        H.toast(isNew ? '已创建' : '已保存');
        close();
        loadSchedules();
      }).catch(function (e) { H.toast('保存失败: ' + e.message, true); });
    }

    overlay.querySelector('#se-close').addEventListener('click', close);
    overlay.querySelector('#se-cancel').addEventListener('click', close);
    overlay.querySelector('#se-save').addEventListener('click', save);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.getElementById('sched-editor-overlay')) close();
    });
    setTimeout(function () { var i = document.getElementById('se-name'); if (i) i.focus(); }, 80);
  }

  // ---- Run 历史 ----
  function loadScheduleRuns(taskId) {
    var t = schedCache.find(function (x) { return x.id === taskId; });
    setBody('<div class="admin-loading">加载中…</div>');
    api('/schedules/' + taskId + '/runs').then(function (res) {
      renderScheduleRuns(res.data || [], t);
    }).catch(function (e) { setBody('<div class="admin-error">' + esc(e.message) + '</div>'); });
  }

  function renderScheduleRuns(runs, task) {
    var html = '<div class="admin-toolbar">' +
      '<button class="btn-sm" id="sched-runs-back">← 返回</button>' +
      '<span class="admin-count">⏰ ' + esc(task ? task.name : '') + ' · 运行历史 (' + runs.length + ')</span>' +
      '<button class="btn-primary btn-sm" id="sched-runs-run">▶️ 立即运行</button>' +
      '</div>';
    if (runs.length === 0) {
      html += '<div class="admin-empty">还没有运行记录。</div>';
    } else {
      html += '<div class="run-list">';
      runs.forEach(function (r) {
        var d = new Date(r.startedAt);
        var timeStr = d.toLocaleDateString('zh-CN') + ' ' + d.toTimeString().slice(0, 8);
        var dur = r.durationMs != null ? (r.durationMs < 1000 ? r.durationMs + 'ms' : Math.round(r.durationMs / 1000) + 's') : '—';
        var snippet = r.snippet ? '<div class="run-snippet">' + esc(r.snippet) + '</div>' : '';
        var err = r.error ? '<div class="run-error">⚠️ ' + esc(r.error) + '</div>' : '';
        var link = r.sessionId ? '<a class="run-session-link" data-sid="' + esc(r.sessionId) + '">查看对话 →</a>' : '';
        html += '<div class="run-item">' +
          '<div class="run-item-head">' +
            '<span class="run-status">' + fmtRunStatus(r.status) + '</span>' +
            '<span class="run-time">' + esc(timeStr) + '</span>' +
            '<span class="run-dur">' + dur + '</span>' +
          '</div>' + snippet + err + link +
        '</div>';
      });
      html += '</div>';
    }
    setBody(html);
    document.querySelector('#sched-runs-back').addEventListener('click', loadSchedules);
    var runBtn = document.querySelector('#sched-runs-run');
    if (runBtn) runBtn.addEventListener('click', function () { if (task) runScheduleNow(task.id); });
    document.querySelectorAll('.run-session-link').forEach(function (link) {
      link.addEventListener('click', function () {
        var sid = link.dataset.sid;
        if (sid && H.enterSession) H.enterSession(sid, 'chat');
      });
    });
  }

  // ============================================================
  // Exports
  // ============================================================
  H.openAdmin = openAdmin;
  H.loadAgents = loadAgents;
  H.loadExtensions = loadExtensions;
  H.loadSchedules = loadSchedules;

})();
