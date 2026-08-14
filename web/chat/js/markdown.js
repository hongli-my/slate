/* ============================================================
   Hermes WebUI - Markdown Rendering Module
   ============================================================ */

window.Hermes = window.Hermes || {};

(function() {
  'use strict';

  const esc = window.Hermes.esc;

  // 流式模式标志：跳过 hljs 语法高亮（性能瓶颈），保留 marked Markdown 渲染
  var _streamingMode = false;

  // ---- Markdown 渲染 (marked + highlight.js) ----
  function initMarked() {
    const renderer = new marked.Renderer();
    renderer.code = function(codeObj) {
      const text = typeof codeObj === 'string' ? codeObj : (codeObj.text || '');
      const lang = typeof codeObj === 'string' ? arguments[1] : (codeObj.lang || '');
      let highlighted;
      var needAutoHighlight = false;
      if (_streamingMode) {
        // 流式阶段跳过 hljs（highlightAuto 可达 100-500ms），仅转义
        // 代码块结构（header/语言标签/复制按钮）与最终渲染一致
        highlighted = esc(text);
      } else if (lang && hljs.getLanguage(lang)) {
        try { highlighted = hljs.highlight(text, { language: lang }).value; }
        catch(e) { highlighted = esc(text); }
      } else {
        // P#2: 大代码块(>2000字)跳过 highlightAuto（O(n) 尝试所有语言），降级为纯 esc
        if (text.length > 2000) {
          highlighted = esc(text);
        } else {
          // 异步高亮：先转义，标记待 highlightAuto（避免同步 100-500ms 阻塞主线程）
          highlighted = esc(text);
          needAutoHighlight = true;
        }
      }
      const langLabel = lang ? '<span class="code-lang">' + esc(lang) + '</span>' : '';
      var codeClass = 'hljs language-' + esc(lang || 'text') + (needAutoHighlight ? ' need-auto-highlight' : '');
      return '<div class="code-block">' +
        '<div class="code-header">' + langLabel +
        '<button class="code-copy-btn" data-action="copy-code">复制</button></div>' +
        '<pre><code class="' + codeClass + '">' + highlighted + '</code></pre></div>';
    };
    marked.setOptions({
      renderer: renderer,
      gfm: true,
      breaks: false,
    });
  }
  initMarked();

  // 全局复制函数（事件委托）
  function copyCode(btn) {
    const codeEl = btn.closest('.code-block').querySelector('code');
    const text = codeEl.textContent;
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = '已复制!';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = '复制'; btn.classList.remove('copied'); }, 2000);
    }).catch(() => {
      btn.textContent = '失败';
      setTimeout(() => { btn.textContent = '复制'; }, 2000);
    });
  }

  // 渲染最终回复区域（含复制 markdown 原文按钮 + 折叠按钮）
  function renderAnswerBlock(markdownText) {
    const id = 'ans-' + (++window.Hermes.answerBlockCounter);
    return `
      <div class="step-answer-wrap" id="${id}">
        <div class="step-answer collapsible">${renderMarkdown(markdownText)}</div>
        <button class="collapse-btn" data-action="toggle-collapse" data-target="${id}" style="display:none">
          <span class="arrow">▼</span><span class="label">展开</span>
        </button>
        <button class="copy-md-btn" data-action="copy-markdown" data-target="${id}" title="复制 Markdown 原文">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          <span>复制</span>
        </button>
        <textarea class="md-raw" readonly>${esc(markdownText)}</textarea>
      </div>`;
  }

  // 复制 markdown 原文
  function copyMarkdown(id, btn) {
    const wrap = document.getElementById(id);
    const raw = wrap?.querySelector('.md-raw');
    if (!raw) return;
    navigator.clipboard.writeText(raw.value).then(() => {
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><span>已复制</span>';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg><span>复制</span>';
        btn.classList.remove('copied');
      }, 2000);
    });
  }

  // 展开/折叠长回答
  function toggleCollapse(id, btn) {
    const wrap = document.getElementById(id);
    const answer = wrap?.querySelector('.step-answer.collapsible');
    if (!answer) return;
    const isCollapsed = answer.classList.contains('collapsed');
    if (isCollapsed) {
      answer.classList.remove('collapsed');
      btn.classList.add('expanded');
      btn.querySelector('.label').textContent = '收起';
    } else {
      answer.classList.add('collapsed');
      btn.classList.remove('expanded');
      btn.querySelector('.label').textContent = '展开';
      answer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // ---- Event Delegation for inline actions ----
  // Handles data-action="copy-code", data-action="copy-markdown", data-action="toggle-collapse"
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'copy-code') {
      copyCode(btn);
    } else if (action === 'copy-markdown') {
      copyMarkdown(btn.dataset.target, btn);
    } else if (action === 'toggle-collapse') {
      toggleCollapse(btn.dataset.target, btn);
    }
  });

  // P#3: 检测 collapsible 元素，限定容器范围而非全局 document
  window.Hermes.initCollapsible = function(container) {
    var root = container || document;
    // 收集容器内 step-answer 元素
    var allAnswers = root.querySelectorAll('.step-answer.collapsible');
    var isStreaming = !!(root.querySelector ? root.querySelector('.turn[data-streaming="true"]') : document.querySelector('.turn[data-streaming="true"]'));
    var lastIndex = allAnswers.length - 1;

    allAnswers.forEach(function(el, idx) {
      if (el.dataset.collapsibleInit) return;
      el.dataset.collapsibleInit = '1';
      var isLastAnswer = (idx === lastIndex);
      if (isLastAnswer) {
        var wrap = el.closest('.step-answer-wrap');
        var btn = wrap ? wrap.querySelector('.collapse-btn') : null;
        if (btn && el.scrollHeight > 320) btn.style.display = '';
        return;
      }
      if (el.scrollHeight > 320) {
        el.classList.add('collapsed');
        var wrap2 = el.closest('.step-answer-wrap');
        var btn2 = wrap2 ? wrap2.querySelector('.collapse-btn') : null;
        if (btn2) btn2.style.display = '';
      }
    });
    root.querySelectorAll('.thinking-block:not(.thinking-expanded):not(.thinking-collapsed) .thinking-body').forEach(function(el) {
      el.scrollTop = el.scrollHeight;
    });
    root.querySelectorAll('.tool-result:not(.tool-result-expanded):not(.tool-result-collapsed) .tool-result-body').forEach(function(el) {
      el.scrollTop = el.scrollHeight;
    });
    scheduleIdleHighlight(root);
  };

  // ---- 流式轻量渲染（P#1: 流式中不做完整 marked.parse，仅转义+基础格式）----
  function renderStreamingText(text) {
    if (!text) return '';
    var escaped = esc(text);
    // 保留换行，识别代码块围栏（不高亮，仅 <pre> 包裹）
    // 简单识别 ``` 代码块
    var parts = escaped.split(/(```[\s\S]*?```)/g);
    var html = '';
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      if (part.startsWith('```') && part.endsWith('```')) {
        var inner = part.slice(3, -3);
        var nlIdx = inner.indexOf('\n');
        var lang = '';
        var code = inner;
        if (nlIdx >= 0) {
          lang = inner.substring(0, nlIdx).trim();
          code = inner.substring(nlIdx + 1);
        }
        html += '<pre class="code-block streaming-code"><code>' + code + '</code></pre>';
      } else {
        html += part.replace(/\n/g, '<br>');
      }
    }
    return html;
  }

  // ---- 流式 Markdown 稳定段缓存 ----
  // 按块边界切分，已闭合块只 parse/sanitize 一次并缓存，后续每次只重新解析
  // 最后一个"活跃块"。长回复从 O(n²) 降到 O(n)，避免越输出越卡。
  // cacheKey 区分不同流式正文流（'sf' 正文 / 'tm' 思考），互不干扰。
  var _mdStreamCache = {};

  // 按块边界切分 markdown：双换行切段，代码围栏( ``` )内部保护不切。
  // 返回块数组；最后一块视为"活跃块"（可能尚未结束），前面的是已闭合稳定块。
  function splitMdBlocks(text) {
    var blocks = [];
    var lines = text.split('\n');
    var cur = [];
    var inFence = false;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (line.replace(/^\s+/, '').slice(0, 3) === '```') {
        cur.push(line);
        inFence = !inFence;
        if (!inFence) { blocks.push(cur.join('\n')); cur = []; }
        continue;
      }
      // 非围栏内的空行 = 块边界：切分当前块（不含此空行），避免尾部 \n 污染
      // stableText，提高缓存命中率。块间双换行由 join('\n\n') 补回。
      if (!inFence && line.replace(/^\s+/, '') === '') {
        if (cur.length > 0) { blocks.push(cur.join('\n')); cur = []; }
        continue;
      }
      cur.push(line);
    }
    if (cur.length > 0) blocks.push(cur.join('\n'));
    return blocks.filter(function(b) { return b.replace(/\s/g, '') !== ''; });
  }

  // ---- 流式 Markdown 渲染（marked.parse + 跳过 hljs + 稳定段缓存）----
  // 与最终 renderMarkdown 格式一致（标题/列表/表格/链接/代码块结构等）
  // 仅代码块无语法高亮颜色，finalizeStreamingTurn 时由 renderMarkdown 补上
  // cacheKey 可选：传入则启用稳定段缓存（'sf'/'tm'），不传则每次全量解析（兼容）
  function renderStreamingMarkdown(text, cacheKey) {
    if (!text) return '';

    // 无 cacheKey → 退化为每次全量解析（兼容旧调用）
    if (!cacheKey) {
      _streamingMode = true;
      try {
        var html0 = marked.parse(text);
        if (typeof DOMPurify !== 'undefined') {
          return DOMPurify.sanitize(html0, { ADD_TAGS: ['del', 'input'], ADD_ATTR: ['type', 'checked', 'disabled'] });
        }
        return html0;
      } catch(e) {
        return '<p>' + esc(text) + '</p>';
      } finally {
        _streamingMode = false;
      }
    }

    // 带 cacheKey → 稳定段缓存
    var c = _mdStreamCache[cacheKey];
    if (c && c.text === text) return c.fullHtml;  // 完全命中

    var blocks = splitMdBlocks(text);
    if (blocks.length === 0) return '';

    var stableBlocks, activeBlock;
    if (blocks.length === 1) {
      stableBlocks = [];
      activeBlock = blocks[0];
    } else {
      stableBlocks = blocks.slice(0, -1);
      activeBlock = blocks[blocks.length - 1];
    }
    var stableText = stableBlocks.join('\n\n');

    // 稳定前缀变化（增长一个块）时重新解析并缓存（含 sanitize）
    if (!c || c.stableText !== stableText) {
      _streamingMode = true;
      var sh;
      try { sh = stableText ? marked.parse(stableText) : ''; }
      catch(e) { sh = stableText ? '<p>' + esc(stableText) + '</p>' : ''; }
      finally { _streamingMode = false; }
      if (typeof DOMPurify !== 'undefined' && sh) {
        sh = DOMPurify.sanitize(sh, { ADD_TAGS: ['del', 'input'], ADD_ATTR: ['type', 'checked', 'disabled'] });
      }
      c = { stableText: stableText, stableHtml: sh };
      _mdStreamCache[cacheKey] = c;
    }

    // 活跃块每次重新解析（体积小，开销低）
    _streamingMode = true;
    var activeHtml;
    try { activeHtml = marked.parse(activeBlock); }
    catch(e) { activeHtml = '<p>' + esc(activeBlock) + '</p>'; }
    finally { _streamingMode = false; }
    if (typeof DOMPurify !== 'undefined' && activeHtml) {
      activeHtml = DOMPurify.sanitize(activeHtml, { ADD_TAGS: ['del', 'input'], ADD_ATTR: ['type', 'checked', 'disabled'] });
    }

    var full = (c.stableHtml || '') + activeHtml;
    c.text = text;
    c.fullHtml = full;
    return full;
  }

  // 清除流式缓存（新对话时调用，防止跨 turn 串内容）
  function clearStreamingMdCache(cacheKey) {
    if (cacheKey) delete _mdStreamCache[cacheKey];
    else _mdStreamCache = {};
  }

  // 异步高亮：用 requestIdleCallback 分批处理 need-auto-highlight 的代码块，避免阻塞主线程
  function scheduleIdleHighlight(container) {
    var scope = container || document;
    var pending = scope.querySelectorAll('code.need-auto-highlight');
    if (pending.length === 0) return;
    var i = 0;
    function processOne(deadline) {
      while (i < pending.length) {
        if (deadline && deadline.timeRemaining && deadline.timeRemaining() <= 0) break;
        var codeEl = pending[i];
        try {
          var text = codeEl.textContent;
          codeEl.innerHTML = hljs.highlightAuto(text).value;
        } catch(e) {}
        codeEl.classList.remove('need-auto-highlight');
        i++;
      }
      if (i < pending.length) {
        if (window.requestIdleCallback) window.requestIdleCallback(processOne);
        else setTimeout(function() { processOne(); }, 16);
      }
    }
    if (window.requestIdleCallback) window.requestIdleCallback(processOne);
    else setTimeout(function() { processOne(); }, 16);
  }

  // ---- Exports ----
  // Define as function declarations first so they're hoisted within the IIFE
  var _mdCache = new Map();
  var _MD_CACHE_MAX = 80;
  function renderMarkdown(md) {
    if (!md) return '';
    if (_mdCache.has(md)) return _mdCache.get(md);
    var html;
    try {
      html = marked.parse(md);
      if (typeof DOMPurify !== 'undefined') {
        html = DOMPurify.sanitize(html, { ADD_TAGS: ['del', 'input'], ADD_ATTR: ['type', 'checked', 'disabled'] });
      }
    } catch(e) {
      html = '<p>' + esc(md) + '</p>';
    }
    if (_mdCache.size >= _MD_CACHE_MAX) {
      var firstKey = _mdCache.keys().next().value;
      _mdCache.delete(firstKey);
    }
    _mdCache.set(md, html);
    return html;
  }

  window.Hermes.renderMarkdown = renderMarkdown;
  window.Hermes.renderStreamingText = renderStreamingText;
  window.Hermes.renderStreamingMarkdown = renderStreamingMarkdown;
  window.Hermes.clearStreamingMdCache = clearStreamingMdCache;
  window.Hermes.renderAnswerBlock = renderAnswerBlock;
  window.Hermes.scheduleIdleHighlight = scheduleIdleHighlight;

})();
