/* ============================================================
   Hermes WebUI - Markdown Rendering Module
   ============================================================ */

window.Hermes = window.Hermes || {};

(function() {
  'use strict';

  const esc = window.Hermes.esc;

  // 流式模式标志：跳过 hljs 语法高亮（性能瓶颈），保留 marked Markdown 渲染
  var _streamingMode = false;

  // ---- hljs 懒加载 ----
  // hljs（core + 25 语言 ~350KB）不进 chat.bundle.js，改由独立 hljs.bundle.js
  // 在 scheduleIdleHighlight 首次需要时动态 <script> 加载。流式渲染不触达 hljs，
  // 仅终态/历史渲染的代码块高亮才触发加载 → 首屏（无代码块的对话）零 hljs 开销。
  var _hljsPromise = null;
  function loadHljs() {
    if (window.hljs) return Promise.resolve(window.hljs);
    if (_hljsPromise) return _hljsPromise;
    _hljsPromise = new Promise(function (resolve) {
      // hljs-entry.js 加载完会置 window.__hljsReady=true 并调 window.__hljsResolve
      window.__hljsResolve = resolve;
      if (window.__hljsReady) { resolve(window.hljs); return; }
      var s = document.createElement('script');
      // 相对 chat.bundle.js 所在目录（web/chat/）
      s.src = './hljs.bundle.js';
      s.async = true;
      s.onerror = function () {
        // 加载失败：resolve(undefined) 让调用方降级（代码块保持转义态）
        _hljsPromise = null;
        resolve(undefined);
      };
      document.head.appendChild(s);
    });
    return _hljsPromise;
  }
  window.Hermes.loadHljs = loadHljs;

  // ---- Markdown 渲染 (marked + highlight.js) ----
  function initMarked() {
    const renderer = new marked.Renderer();
    renderer.code = function(codeObj) {
      const text = typeof codeObj === 'string' ? codeObj : (codeObj.text || '');
      const lang = typeof codeObj === 'string' ? arguments[1] : (codeObj.lang || '');
      let highlighted;
      var needAutoHighlight = false;
      var hlLang = '';  // 异步高亮用的语言（空=highlightAuto）
      if (_streamingMode) {
        // 流式阶段跳过 hljs（highlightAuto 可达 100-500ms），仅转义
        // 代码块结构（header/语言标签/复制按钮）与最终渲染一致
        highlighted = esc(text);
      } else if (lang && window.hljs && hljs.getLanguage(lang)) {
        // B2: 已知语言也异步化——同步 hljs.highlight 2-10ms/块，多块阻塞 finalize
        // 先转义 + 标记 need-auto-highlight + data-lang，scheduleIdleHighlight 用指定语言高亮
        highlighted = esc(text);
        needAutoHighlight = true;
        hlLang = lang;
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
      var dataLangAttr = hlLang ? (' data-lang="' + esc(hlLang) + '"') : '';
      return '<div class="code-block">' +
        '<div class="code-header">' + langLabel +
        '<button class="code-copy-btn" data-action="copy-code">复制</button></div>' +
        '<pre><code class="' + codeClass + '"' + dataLangAttr + '>' + highlighted + '</code></pre></div>';
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
  // idHint：**稳定 id**（由调用方按 turn key 传）。不能用自增计数器——id 是 morphdom 的
  // 匹配键（getNodeKey），每次渲染换 id 会让 morph 把整个 .step-answer-wrap 子树当"新
  // 节点"重建：流式期已异步上色的代码块会掉色→再上色（可见闪），图片/表格节点也全重建。
  function renderAnswerBlock(markdownText, idHint) {
    const id = idHint || ('ans-' + (++window.Hermes.answerBlockCounter));
    // 两个硬约束（都是 morphdom 的脾气，别改回缩进模板字符串）：
    // 1) 必须与流式分支（session.js 的字符串拼接版）**逐节点同构**；
    // 2) 元素之间不能有空白文本节点。morphdom 的 children 并行游走遇到
    //    #text↔ELEMENT 失配时，会「删 from 子节点 + 末尾 append to 子节点」——
    //    结果就是整棵 .step-answer（含已异步上色的代码块）被丢弃重建 → 掉色重上色（可见闪）。
    // 结构：.step-answer-wrap > [.step-answer(.md-stable+.md-active), 折叠钮, 复制钮, md-raw]
    return '<div class="step-answer-wrap" id="' + id + '">'
      + '<div class="step-answer collapsible"><div class="md-stable">' + renderMarkdown(markdownText) + '</div><div class="md-active"></div></div>'
      + '<button class="collapse-btn" data-action="toggle-collapse" data-target="' + id + '" style="display:none"><span class="arrow">▼</span><span class="label">展开</span></button>'
      + '<button class="copy-md-btn" data-action="copy-markdown" data-target="' + id + '" title="复制 Markdown 原文"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg><span>复制</span></button>'
      + '<textarea class="md-raw" readonly>' + esc(markdownText) + '</textarea>'
      + '</div>';
  }

  // 复制 markdown 原文
  function copyMarkdown(id, btn) {
    // 优先用按钮自身定位（data-target/id 只是兜底）：避免任何 id 重名時拿错容器
    const wrap = (btn && btn.closest ? btn.closest('.step-answer-wrap') : null) || document.getElementById(id);
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
    // 优先用按钮自身定位（同 copyMarkdown：多容器/重复 id 兜底）
    const wrap = (btn && btn.closest ? btn.closest('.step-answer-wrap') : null) || document.getElementById(id);
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
    // 已删除：.thinking-block/.tool-result 的滚动到底兜底（对应 HTML 构建器已随死代码移除）
    scheduleIdleHighlight(root);
  };

  // ---- 流式轻量渲染（已删除 renderStreamingText：无调用方死代码，D4）----
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

  // 纯文本块检测：单行 + 无 markdown 结构字符 + 无 HTML 标签。
  // 保守策略——出现任一 markdown 特征即退回 marked 慢路径，保证正确性。
  function isPlainBlock(text) {
    if (!text || typeof text !== 'string') return false;
    if (text.indexOf('\n') !== -1) return false;
    if (/[`*_#>\[\]|~\\]/.test(text)) return false;
    if (/<[a-zA-Z/]/.test(text)) return false;
    return true;
  }

  // ---- 流式 Markdown 渲染（marked.parse + 跳过 hljs + 稳定段缓存）----
  // 与最终 renderMarkdown 格式一致（标题/列表/表格/链接/代码块结构等）
  // 仅代码块无语法高亮颜色，finalizeStreamingTurn 时由 renderMarkdown 补上
  // cacheKey 可选：传入则启用稳定段缓存（'sf'/'tm'），不传则每次全量解析（兼容）
  //
  // P#4: 核心 split 实现 —— 返回 { stableHtml, activeHtml, stableChanged, fullHtml }，
  // 让调用方可以只 patch 末尾活跃块 DOM（而非整段 innerHTML 重建）。
  // stableChanged=true 表示稳定前缀增长，需重建 stable 容器；false 则只需更新 active。
  function renderStreamingMarkdownSplit(text, cacheKey) {
    if (!text) return { stableHtml: '', activeHtml: '', stableChanged: false, fullHtml: '' };

    // 无 cacheKey → 退化为每次全量解析（兼容旧调用），全部内容作为 active
    if (!cacheKey) {
      _streamingMode = true;
      try {
        var html0 = marked.parse(text);
        if (typeof DOMPurify !== 'undefined') {
          html0 = DOMPurify.sanitize(html0, { ADD_TAGS: ['del', 'input'], ADD_ATTR: ['type', 'checked', 'disabled'] });
        }
        return { stableHtml: '', activeHtml: html0, stableChanged: true, fullHtml: html0 };
      } catch(e) {
        var f = '<p>' + esc(text) + '</p>';
        return { stableHtml: '', activeHtml: f, stableChanged: true, fullHtml: f };
      } finally {
        _streamingMode = false;
      }
    }

    // 带 cacheKey → 稳定段缓存
    var c = _mdStreamCache[cacheKey];
    if (c && c.text === text) {
      // 完全命中：stable 和 active 都没变（text 完全相同）
      return { stableHtml: c.stableHtml || '', activeHtml: c.activeHtml || '', stableChanged: false, fullHtml: c.fullHtml || '' };
    }

    var blocks = splitMdBlocks(text);
    if (blocks.length === 0) return { stableHtml: '', activeHtml: '', stableChanged: false, fullHtml: '' };

    var stableBlocks, activeBlock;
    if (blocks.length === 1) {
      stableBlocks = [];
      activeBlock = blocks[0];
    } else {
      stableBlocks = blocks.slice(0, -1);
      activeBlock = blocks[blocks.length - 1];
    }
    var stableText = stableBlocks.join('\n\n');

    var stableChanged = false;
    // 按块缓存稳定段：每个稳定块只 parse+sanitize 一次，边界推进时只解析新增块。
    // 旧实现每次边界推进都 re-parse 整个 stableText（1+2+...+N = O(N²) 段落解析）。
    // 新实现总开销 O(N)（N = 块数）。块内文本未变即命中缓存（已 sanitize 的 html）。
    var cachedBlocks = (c && c.blocks) || [];
    var htmlBlocks = []; // [{text, html}]
    for (var bi = 0; bi < stableBlocks.length; bi++) {
      var btext = stableBlocks[bi];
      if (cachedBlocks[bi] && cachedBlocks[bi].text === btext) {
        htmlBlocks.push(cachedBlocks[bi]); // 命中：复用已 sanitize 的 html
      } else {
        // 稳定块 = 已闭合的内容，不会再变：**不置 _streamingMode**，
        // 让代码块带上 need-auto-highlight（闭围栏就已可异步上色，不必等到整条回复结束），
        // 且异步上色后的 DOM 在 live→static 时由 morph 跳过（文本一致）→ 零闪。
        // 活跃块仍走 _streamingMode（每帧重解析，不上色）。
        var _prevStreamingMode = _streamingMode;
        _streamingMode = false;
        var bh;
        try { bh = marked.parse(btext); }
        catch(e) { bh = '<p>' + esc(btext) + '</p>'; }
        finally { _streamingMode = _prevStreamingMode; }
        // 流式期也必须 sanitize：marked.parse 会保留 raw inline HTML（<img onerror>、
        // <svg onload> 等），morphdom/innerHTML 写入即执行，live 流式窗口即可触发。
        if (typeof DOMPurify !== 'undefined' && bh) {
          bh = DOMPurify.sanitize(bh, { ADD_TAGS: ['del', 'input'], ADD_ATTR: ['type', 'checked', 'disabled'] });
        }
        htmlBlocks.push({ text: btext, html: bh });
        stableChanged = true;
      }
    }
    var sh = htmlBlocks.map(function(b) { return b.html; }).join('\n');
    c = { text: null, stableText: stableText, stableHtml: sh, blocks: htmlBlocks };
    _mdStreamCache[cacheKey] = c;

    // 活跃块每次重新解析（体积小，开销低）
    // 纯文本快路径：无 markdown 语法/HTML 标签 → 跳过 remend + marked（对纯文本
    // 都是无意义的遍历），直接转义。AI 输出大段纯叙述文字时收益明显。
    // 大块节流：活跃块 >10KB 时 marked.parse 可达 50-100ms/tick，每 tick 解析致卡顿。
    // 200ms 内已解析过大块复用上次 activeHtml，跳过 parse+sanitize（稳定段已独立缓存）。
    var BIG_BLOCK = 10 * 1024;
    var BIG_THROTTLE_MS = 200;
    var now = Date.now();
    var bigBlock = activeBlock.length > BIG_BLOCK;
    var throttled = bigBlock && c._lastActiveParseAt && (now - c._lastActiveParseAt < BIG_THROTTLE_MS);
    var activeHtml;
    if (throttled) {
      // 复用上次活跃块 HTML（不 parse 不 sanitize）；stableChanged 保持 false
      activeHtml = c.activeHtml || '';
    } else if (isPlainBlock(activeBlock)) {
      activeHtml = '<p>' + esc(activeBlock) + '</p>';
    } else {
      // remend 修复未闭合标记（** / [ / ( / ` / 围栏），避免流式期 marked 解析闪烁
      if (window.remend) { try { activeBlock = window.remend(activeBlock, { linkMode: 'text-only' }); } catch(e) {} }
      _streamingMode = true;
      try { activeHtml = marked.parse(activeBlock); }
      catch(e) { activeHtml = '<p>' + esc(activeBlock) + '</p>'; }
      finally { _streamingMode = false; }
      if (bigBlock) c._lastActiveParseAt = now;
    }
    // 活跃块同样必须 sanitize（与稳定块同理：防流式期 XSS 执行）；节流复用路径已 sanitize
    if (!throttled && typeof DOMPurify !== 'undefined' && activeHtml) {
      activeHtml = DOMPurify.sanitize(activeHtml, { ADD_TAGS: ['del', 'input'], ADD_ATTR: ['type', 'checked', 'disabled'] });
    }

    var full = (c.stableHtml || '') + activeHtml;
    c.text = text;
    c.fullHtml = full;
    c.activeHtml = activeHtml;  // 缓存活跃块 HTML，供完全命中时复用
    return { stableHtml: c.stableHtml || '', activeHtml: activeHtml, stableChanged: stableChanged, fullHtml: full };
  }

  // 清除流式缓存（新对话时调用，防止跨 turn 串内容）
  function clearStreamingMdCache(cacheKey) {
    if (cacheKey) delete _mdStreamCache[cacheKey];
    else _mdStreamCache = {};
  }

  // 异步高亮：用 requestIdleCallback 分批处理 need-auto-highlight 的代码块，避免阻塞主线程
  // hljs 懒加载：首次调用时动态 <script> 加载 hljs.bundle.js，加载完再高亮。
  function scheduleIdleHighlight(container) {
    var scope = container || document;
    var pending = scope.querySelectorAll('code.need-auto-highlight');
    if (pending.length === 0) return;
    // 转 Array（pending 是 live NodeList，延迟高亮期间可能变化）
    var list = Array.prototype.slice.call(pending);
    loadHljs().then(function (hljs) {
      if (!hljs) return; // 加载失败，代码块保持转义态
      var i = 0;
      function processOne(deadline) {
        while (i < list.length) {
          if (deadline && deadline.timeRemaining && deadline.timeRemaining() <= 0) break;
          var codeEl = list[i];
          try {
            var text = codeEl.textContent;
            // B2: 有 data-lang 用指定语言高亮（比 highlightAuto 快且准），否则回退 highlightAuto
            var lang = codeEl.dataset.lang;
            if (lang && hljs.getLanguage(lang)) {
              codeEl.innerHTML = hljs.highlight(text, { language: lang }).value;
            } else {
              codeEl.innerHTML = hljs.highlightAuto(text).value;
            }
            // 标记"已上色"：render.js 的 morph 跳过它（文本未变就不再覆盖 innerHTML），
            // 避免流结束整 turn 重渲时"掉色 → 异步再上色"的可见闪。
            codeEl.setAttribute('data-highlighted', 'yes');
          } catch(e) {}
          codeEl.classList.remove('need-auto-highlight');
          i++;
        }
        if (i < list.length) {
          if (window.requestIdleCallback) window.requestIdleCallback(processOne);
          else setTimeout(function() { processOne(); }, 16);
        }
      }
      if (window.requestIdleCallback) window.requestIdleCallback(processOne);
      else setTimeout(function() { processOne(); }, 16);
    });
  }

  // answerBlockCounter 仅作为无 idHint 时的兜底（正常路径用 turn key 派生稳定 id）
  var _mdCache = new Map();
  var _MD_CACHE_MAX = 256;
  function renderMarkdown(md) {
    if (!md) return '';
    if (_mdCache.has(md)) return _mdCache.get(md);
    var html;
    // 纯文本快路径：单行且无 markdown 语法/HTML → 跳过 marked.parse + DOMPurify.sanitize
    // （DOMPurify 是长会话全量渲染的主要开销）。user 短消息、纯叙述回复走此路径。
    if (isPlainBlock(md)) {
      html = '<p>' + esc(md) + '</p>';
    } else {
      try {
        html = marked.parse(md);
        if (typeof DOMPurify !== 'undefined') {
          html = DOMPurify.sanitize(html, { ADD_TAGS: ['del', 'input'], ADD_ATTR: ['type', 'checked', 'disabled'] });
        }
      } catch(e) {
        html = '<p>' + esc(md) + '</p>';
      }
    }
    if (_mdCache.size >= _MD_CACHE_MAX) {
      var firstKey = _mdCache.keys().next().value;
      _mdCache.delete(firstKey);
    }
    _mdCache.set(md, html);
    return html;
  }

  // 清除最终渲染 markdown 缓存（切会话时调用，防跨会话陈旧条目累积）
  function clearMdCache() {
    _mdCache.clear();
  }

  window.Hermes.renderMarkdown = renderMarkdown;
  window.Hermes.renderStreamingMarkdownSplit = renderStreamingMarkdownSplit;
  window.Hermes.clearStreamingMdCache = clearStreamingMdCache;
  window.Hermes.clearMdCache = clearMdCache;
  window.Hermes.renderAnswerBlock = renderAnswerBlock;
  window.Hermes.scheduleIdleHighlight = scheduleIdleHighlight;

})();
