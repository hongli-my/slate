/* ============================================================
   project-manager.js v2 — 项目管理（后端存储）
   项目由"新建会话时选择目录"驱动创建，此处只负责切换/删除
   ============================================================ */

;(function () {
  'use strict';

  var H = window.Hermes;
  if (!H) return;

  // ---- 状态 ----
  var projects = [];           // [{ id, name, path, created_at, session_count }]
  var currentProjectId = null; // null = 默认项目（未分配）

  // ---- 加载项目列表 ----
  function loadProjects() {
    return H.api('/projects').then(function (data) {
      projects = data.data || [];
      H.projects = projects; // 保持引用同步，避免 H.projects 指向旧数组
      return projects;
    });
  }

  // ---- 删除项目 ----
  function deleteProject(projectId) {
    return H.api('/projects/' + encodeURIComponent(projectId), { method: 'DELETE' }).then(function () {
      if (currentProjectId === projectId) switchProject(null);
      // 重新从后端加载，确保列表最新
      return loadProjects();
    }).then(function () {
      updateProjectUI();
      renderProjectList();
    });
  }

  // ---- 切换当前项目 ----
  function switchProject(projectId) {
    // 如果项目没有变化，直接返回，避免循环调用
    if (projectId === currentProjectId) return;

    currentProjectId = projectId;
    H.state.currentProjectId = projectId;
    H.currentProjectId = currentProjectId; // 同步更新暴露的引用

    // 清理当前会话视图（切换到欢迎页）
    if (H.state.focusedSessionId) {
      H.state.focusedSessionId = null;
      H.state.viewMode = 'list';
      if (H.showView) H.showView('welcome');
      if (H.updateStreamingHints) H.updateStreamingHints();
      if (H.updateURL) H.updateURL();
    }

    // 更新 URL hash
    if (projectId) {
      // 切换到具体项目：#/p/<projectId>
      location.hash = '#/p/' + encodeURIComponent(projectId);
    } else {
      // 切回默认项目：清空 hash
      history.replaceState(null, '', location.pathname);
    }

    updateProjectUI();
    if (H.loadSessions) H.loadSessions();
  }

  // ---- UI 更新 ----
  function updateProjectUI() {
    var dom = H.dom;
    if (!dom.currentProjectName) return;

    var proj = projects.find(function (p) { return p.id === currentProjectId; });
    if (proj) {
      dom.currentProjectName.textContent = proj.name || '默认项目';
      dom.currentProjectPath.textContent = proj.path || '';
    } else {
      dom.currentProjectName.textContent = '全部目录';
      dom.currentProjectPath.textContent = '所有工作目录的会话';
    }

    // 更新下拉列表中的 active 状态
    var items = document.querySelectorAll('.project-item');
    items.forEach(function (item) {
      var id = item.getAttribute('data-project-id');
      item.classList.toggle('active', id === currentProjectId);
    });
  }

  // ---- 渲染项目下拉列表 ----
  function renderProjectList() {
    var dom = H.dom;
    if (!dom.projectList) return;

    var html = '';

    // "默认项目" 项（=全部目录）
    html += '<div class="project-item' + (!currentProjectId ? ' active' : '') + '" data-project-id="">'
          + '<div class="project-item-icon">*</div>'
          + '<div class="project-item-body">'
          + '<span class="project-item-name">全部目录</span>'
          + '</div>'
          + '</div>';

    projects.forEach(function (p) {
      var icon = (p.name || 'P').charAt(0).toUpperCase();
      var count = p.session_count || 0;
      html += '<div class="project-item' + (p.id === currentProjectId ? ' active' : '') + '" data-project-id="' + escAttr(p.id) + '">'
            + '<div class="project-item-icon">' + esc(icon) + '</div>'
            + '<div class="project-item-body">'
            + '<span class="project-item-name">' + esc(p.name) + '</span>'
            + (p.path ? '<span class="project-item-path">' + esc(p.path) + '</span>' : '')
            + '</div>'
            + '<span class="project-item-count">' + count + '</span>';
      // pi 不能删除目录，不渲染删除按钮
      html += '</div>';
    });

    // 底部：选择目录按钮
    html += '<div class="project-action-bar">'
          + '<button class="btn-select-dir" id="btn-select-dir" title="设置项目目录（绝对路径）">📂 选择目录</button>'
          + '</div>';

    dom.projectList.innerHTML = html;
  }

  // ---- 弹窗：输入目录绝对路径 ----
  function showPathDialog() {
    // 移除已有弹窗
    var existing = document.getElementById('path-dialog-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'path-dialog-overlay';
    overlay.className = 'path-dialog-overlay';
    overlay.innerHTML =
      '<div class="path-dialog">' +
        '<div class="path-dialog-header">' +
          '<span>新增项目目录</span>' +
          '<button class="path-dialog-close" id="path-dialog-close">✕</button>' +
        '</div>' +
        '<div class="path-dialog-body">' +
          '<label class="path-dialog-label">项目绝对路径</label>' +
          '<input type="text" class="path-dialog-input" id="path-dialog-input" ' +
            'placeholder="如 /Users/xxx/projects/my-project" autocomplete="off" />' +
          '<span class="path-dialog-hint">输入完整的绝对路径，agent 会在此目录下执行操作</span>' +
        '</div>' +
        '<div class="path-dialog-footer">' +
          '<button class="path-dialog-cancel" id="path-dialog-cancel">取消</button>' +
          '<button class="path-dialog-confirm" id="path-dialog-confirm">确认</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    var input = document.getElementById('path-dialog-input');
    var closeBtn = document.getElementById('path-dialog-close');
    var cancelBtn = document.getElementById('path-dialog-cancel');
    var confirmBtn = document.getElementById('path-dialog-confirm');

    function doSave() {
      var path = input.value.trim();
      if (!path) {
        H.toast('请输入项目绝对路径', true);
        return;
      }
      saveProjectPath(path);
      overlay.remove();
    }

    function doClose() {
      overlay.remove();
    }

    confirmBtn.addEventListener('click', doSave);
    cancelBtn.addEventListener('click', doClose);
    closeBtn.addEventListener('click', doClose);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) doClose();
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); doSave(); }
      if (e.key === 'Escape') { e.preventDefault(); doClose(); }
    });

    // 自动聚焦并选中
    setTimeout(function () {
      input.focus();
      if (input.value) input.select();
    }, 80);
  }

  // ---- 保存路径（始终创建新项目）----
  async function saveProjectPath(path) {
    var parts = path.split('/');
    var name = parts[parts.length - 1] || path;
    try {
      var projRes = await H.api('/projects', { method: 'POST', body: { name: name, path: path } });
      if (projRes.ok && projRes.data) {
        await loadProjects();
        switchProject(projRes.data.id);
      }
    } catch(e) { H.toast('创建项目失败: ' + e.message, true); }
    closeDropdown();
  }

  // ---- 下拉菜单开关 ----
  function openDropdown() {
    var dom = H.dom;
    if (!dom.projectDropdown) return;
    renderProjectList();
    dom.projectDropdown.style.display = 'block';
    dom.projectSelector.classList.add('open');
  }

  function closeDropdown() {
    var dom = H.dom;
    if (!dom.projectDropdown) return;
    dom.projectDropdown.style.display = 'none';
    dom.projectSelector.classList.remove('open');
  }

  function isDropdownOpen() {
    var dom = H.dom;
    return !!(dom.projectDropdown && dom.projectDropdown.style.display === 'block');
  }

  function toggleDropdown() {
    if (isDropdownOpen()) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }

  // ---- 绑定事件 ----
  function bindProjectEvents() {
    var dom = H.dom;

    // 点击项目触发器
    if (dom.projectTrigger) {
      dom.projectTrigger.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleDropdown();
      });
    }

    // 点击项目列表项（事件委托）
    if (dom.projectList) {
      dom.projectList.addEventListener('click', function (e) {
        // 选择目录按钮
        var dirBtn = e.target.closest('#btn-select-dir');
        if (dirBtn) {
          e.stopPropagation();
          showPathDialog();
          return;
        }

        var item = e.target.closest('.project-item');
        if (!item) return;

        // 删除按钮
        var delBtn = e.target.closest('.project-item-delete');
        if (delBtn) {
          e.stopPropagation();
          var delId = delBtn.getAttribute('data-delete-id');
          if (delId) {
            deleteProject(delId).catch(function (err) { H.toast(err.message, true); });
          }
          return;
        }

        var projId = item.getAttribute('data-project-id');
        switchProject(projId || null);
        closeDropdown();
      });
    }

    // 点击其他地方关闭下拉
    document.addEventListener('click', function (e) {
      if (isDropdownOpen() && !e.target.closest('#project-selector')) {
        closeDropdown();
      }
    });

    // ESC 关闭下拉
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isDropdownOpen()) {
        closeDropdown();
      }
    });
  }

  // ---- 从 URL hash 解析当前项目 ----
  function restoreProjectFromURL() {
    var hash = location.hash || '';
    var m = hash.match(/#\/p\/([^/#?]+)/);
    if (m && m[1]) {
      currentProjectId = decodeURIComponent(m[1]);
      H.state.currentProjectId = currentProjectId;
      H.currentProjectId = currentProjectId; // 同步更新暴露的引用
    }
  }

  // ---- 初始化 ----
  function initProjects() {
    restoreProjectFromURL();

    return loadProjects().then(function () {
      // 校验 URL 中的项目 ID 是否仍然有效
      if (currentProjectId && !projects.find(function(p) { return p.id === currentProjectId; })) {
        currentProjectId = null;
        H.state.currentProjectId = null;
        H.currentProjectId = null;
      }
      updateProjectUI();
    }).catch(function (e) {
      console.warn('加载项目列表失败:', e);
      // 加载失败时不清空 currentProjectId，保留 URL 中的项目选择
      updateProjectUI();
    });
  }

  // ---- 工具函数 ----
  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function escAttr(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ---- 会话恢复：将默认项目下的 unassigned 会话迁到当前项目 ----
  async function recoverSessionsToProject(targetProjectId) {
    var pid = targetProjectId || currentProjectId;
    if (!pid) {
      H.toast('请先切换到目标项目', true);
      return;
    }
    // 获取哪些会话还没有项目映射
    var mappingRes;
    try { mappingRes = await H.api('/projects/mapping'); } catch(e) { mappingRes = {}; }
    var sessionProjectMap = (mappingRes && mappingRes.data) || {};
    var sessions = H.state.sessions || [];
    var candidates = sessions.filter(function(s) {
      return !sessionProjectMap[s.id]; // 没有项目映射的
    });
    if (candidates.length === 0) {
      H.toast('没有需要恢复的会话（所有会话已有映射）');
      return;
    }
    var success = 0, fail = 0;
    for (var i = 0; i < candidates.length; i++) {
      try {
        var res = await H.api('/projects/' + encodeURIComponent(pid) + '/assign', {
          method: 'POST',
          body: { session_id: candidates[i].id },
        });
        if (res.ok) { success++; } else { fail++; }
      } catch(e) { fail++; }
    }
    H.toast('已恢复 ' + success + ' 个会话' + (fail > 0 ? '，' + fail + ' 个失败' : ''));
    if (H.loadSessions) H.loadSessions();
  }

  // ---- 暴露到 H ----
  H.initProjects = initProjects;
  H.bindProjectEvents = bindProjectEvents;
  H.switchProject = switchProject;
  H.loadProjects = loadProjects;
  H.recoverSessionsToProject = recoverSessionsToProject;
  H.renderProjectList = renderProjectList;
  H.showPathDialog = showPathDialog;
  H.projects = projects;
  H.currentProjectId = currentProjectId;

})();
