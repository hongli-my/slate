/* ============================================================
   Hermes WebUI - Renderer Module (keyed element-map reconciler)

   对话渲染层 keyed reconciler：
   - container.__rdx 保存本容器当前渲染快照：sid + Map<turnKey → 渲染状态>
   - 每帧只对比签名：未变 turn 零 DOM 操作；变化 turn 按需 L2（结构）或 L3（流式正文微 patch）
   - turn 身份 = buildTurns 的稳定 key（element-map，不依赖 morphdom keyed）
   - UI 瞬态（展开面板/折叠回答/时间线锚点）只在 L2 重渲该 turn 时捕获与恢复
   - 结构性大改（切会话/删除/压缩/全量加载）→ renderFull 全量重建
   - 设计不变式：签名漏字段只导致过度重渲（损性能不损正确性）；等长内容替换等
     "漏渲"由结构性改写路径的强制 renderFull/签名比对封死。

   流式判定（形态统一后）：turn.live（由 buildTurns 挂载，来自
   state.activeStreams[sid] 的 live 累积器）替代旧 streaming step 标记。
   渲染优先级：L2 结构变化（_liveStructSig）→ L3.5 running 工具耗时徽标 →
   L3 流式正文/思考微 patch → 零操作。
   思考不做独立"右侧批注气泡"（那会挤压正文宽度 → 整篇重排），改为时间线内
   就地展开的思考面板：思考中展开、正文/工具开始即自动收起（同 deepseek/chatgpt）。

   HTML 构建器仍由 session.js/markdown.js 提供（renderSingleTurnHTML /
   renderTurnStepsHTML / renderThinkingItem / initCollapsible / scheduleIdleHighlight），
   render.js 只负责"何时、以何种粒度、把哪个 turn 的 DOM 更新成什么"。
   ============================================================ */

window.Hermes = window.Hermes || {};

(function() {
  'use strict';

  var H = window.Hermes;

  /**
   * morph 前跳过判定（true = 不要动这个节点）。
   * 1) 完全相同的节点直接跳过（流式高频路径的关键优化，避免无谓深比）；
   * 2) 已高亮的 <code>：hljs 异步把 innerHTML 换成带 <span> 的 HTML，而新渲染出的
   *    HTML 总是未上色版本。若照常 morph → 先掉色、data-highlighted 被清、再由
   *    scheduleIdleHighlight 异步上色 → 肉眼看到一次"闪"。文本一致即保留现状
   *    （文本变了才允许覆盖，保证正确性）。
   */
  function _skipMorph(fromEl, toEl) {
    if (fromEl.isEqualNode(toEl)) return true;
    if (fromEl.nodeName === 'CODE' && fromEl.hasAttribute('data-highlighted') &&
        fromEl.textContent === toEl.textContent) return true;
    return false;
  }

  /**
   * morphdom 封装。两种语义必须显式区分，混用会造成"差一层"的结构错位：
   *   _morph(el, fragmentHtml)              → el 的**子节点** 对 片段根节点（多根安全）
   *   _morph(el, rootHtml, { root: true })  → html 单根，**元素本身** 对元素 morph
   *
   * 历史翻车（P4 引入）：_applyStatic 传的是单根 `<div class="turn">`，却按片段语义比 →
   * morphdom 拿 .turn 的 children 对 [新 .turn]，于是第一个子元素（.turn-user）被就地
   * morph 成一个重复的 .turn（嵌套 → padding/margin 翻倍、data-key 重复），其余子元素
   * 被删除、新子树整棵重建（同步丢代码高亮、重启 CSS 动画）。表现为每次回复结束
   * 整块跳一下 + 右移 20px + 代码块闪一次。
   */
  function _morph(el, html, opts) {
    var asRoot = !!(opts && opts.root);
    if (!el) return;
    if (window.morphdom) {
      try {
        var tmp = document.createElement('div');
        tmp.innerHTML = html;
        var target = asRoot ? tmp.firstElementChild : tmp;
        if (!target) return;
        window.morphdom(el, target, {
          childrenOnly: !asRoot,
          onBeforeElUpdated: function(fromEl, toEl) {
            return !_skipMorph(fromEl, toEl);
          }
        });
        return;
      } catch (e) {
        // 降级：morph 失败时退回重建
      }
    }
    if (asRoot) {
      var t = document.createElement('div');
      t.innerHTML = html;
      if (t.firstElementChild) el.replaceWith(t.firstElementChild);
    } else {
      el.innerHTML = html;
    }
  }

  /**
   * 渲染上下文：让 session.js 派生的元素 id 带上**容器前缀**。
   * answer 块的 id 有两个互相牵制的要求：
   *   1) 必须全局唯一 —— 聊天区(#chat-messages)与会话区(#message-list)可能同时
   *      存在同一个 turn 的 DOM；
   *   2) 必须对**同一容器的两次渲染保持稳定** —— morphdom 用 id 当匹配键
   *      （getNodeKey），id 一变就把整棵 .step-answer-wrap 当新节点重建，
   *      已异步上色的代码块会掉色重上色（可见闪）。
   * 所以：id = ans-<容器id>-<turnKey>，两个要求同时满足。
   */
  function _withCtx(container, fn) {
    var prev = H.__renderContainerId;
    H.__renderContainerId = (container && container.id) || '';
    try { return fn(); } finally { H.__renderContainerId = prev; }
  }

  /** 解析单根 HTML 字符串 → 真实元素（.turn / .msg-bubble） */
  function _elFromHtml(html) {
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.firstElementChild;
  }

  /** 取会话的活跃流状态（live 累积器）；无活跃流 / 已结束 → null */
  function _getLive(sid) {
    if (!sid || !H.state || !H.state.activeStreams) return null;
    var s = H.state.activeStreams[sid];
    return (s && !s.finished) ? s : null;
  }

  // ------------------------------------------------------------
  // 流式结构签名：只反映"结构"，不含正文文本长度/内容。
  // running 工具的 preview 以长度计入（partialResult 更新触发 L2 展示）；
  // 非 running 工具计 result 存在性（结果出现/替换属结构变化）。
  // P: 前缀标记 partial step（message_end 物化时 P:A→A 翻转强制 L2）。
  // ------------------------------------------------------------
  function _liveStructSig(turn) {
    var live = turn.live || {};
    var parts = [];
    var steps = turn.steps || [];
    for (var i = 0; i < steps.length; i++) {
      var s = steps[i];
      if (s.system) { parts.push('sy:' + (s.system._compactionHtml ? 'h' : '-') + ':' + (s.system._isCompaction ? 'c' : '-')); continue; }
      if (s.orphan) { parts.push('or'); continue; }
      var tcs = s.toolCalls || [];
      var txt = s.assistant ? (s.assistant.content || '') : '';
      var thk = s.assistant ? (s.assistant.reasoning || '') : '';
      parts.push((s.partial ? 'P:' : 'A:') + tcs.length + '/' + (thk.trim() ? 1 : 0) + '/' + (txt.trim() ? 1 : 0));
      var trs = s.toolResults || [];
      for (var j = 0; j < tcs.length; j++) {
        var tc = tcs[j];
        var cid = tc.id || tc.toolCallId || tc.call_id || '';
        var rt = live.runningTools ? live.runningTools[cid] : null;
        var hasRes = false;
        for (var k = 0; k < trs.length; k++) {
          if ((trs[k].toolCallId || trs[k].tool_call_id) === cid) { hasRes = true; break; }
        }
        parts.push(cid + '|' + (tc.name || '') + '|' + (rt ? 'r' + (rt.preview ? rt.preview.length : 0) : (hasRes ? 'd' : 'p')));
      }
    }
    parts.push('ap=' + !!(live.approval && !live.approvalResolved));
    parts.push('ab=' + !!live.aborted);
    parts.push('er=' + !!live.error);
    return parts.join(';');
  }

  // ------------------------------------------------------------
  // 流式 turn 的 L3 微 patch：结构未变时只更新正文活跃块与思考气泡 body。
  // （长回复从 O(n) 降到 O(活跃块)；保留 DOM identity 消除重排闪烁）
  // 返回是否有文本内容变化。
  // ------------------------------------------------------------
  function _l3Patch(turnEl, turn, lastContent, lastReasoning) {
    var live = turn.live;
    if (!live) return false;
    var changed = false;
    var curContent = live.text || '';
    var curReasoning = live.reasoning || '';

    // 正文（.step-final.streaming-content .step-answer 内的 md-stable/md-active）
    if (lastContent !== curContent && live.text) {
      var _finalBody = turnEl.querySelector('.step-final.streaming-content .step-answer');
      if (_finalBody) {
        var _sfSplit = H.renderStreamingMarkdownSplit(live.text, 'sf');
        var _stableEl = _finalBody.querySelector('.md-stable');
        var _activeEl = _finalBody.querySelector('.md-active');
        if (_activeEl) {
          if (_sfSplit.stableChanged && _stableEl) _morph(_stableEl, _sfSplit.stableHtml);
          _morph(_activeEl, _sfSplit.activeHtml);
        } else {
          // 兼容旧 DOM（未拆分容器）
          _morph(_finalBody, _sfSplit.fullHtml);
        }
        changed = true;
      }
    }

    // 思考：时间线内思考面板（.ow-ep-think.ow-show）里的流式 md 容器
    // （与正文同构：只 patch 稳定段/活跃段，不整块重建 → 无重排闪烁）
    if (lastReasoning !== curReasoning && live.reasoning) {
      var _thinkBody = turnEl.querySelector('.ow-ep-think.ow-show .ow-ep-b-md');
      if (_thinkBody) {
        var _tmOff = _thinkBody.scrollHeight - _thinkBody.scrollTop - _thinkBody.clientHeight;
        var _tmSplit = H.renderStreamingMarkdownSplit(live.reasoning.trim(), 'tm');
        var _tmStable = _thinkBody.querySelector('.md-stable');
        var _tmActive = _thinkBody.querySelector('.md-active');
        if (_tmActive) {
          if (_tmSplit.stableChanged && _tmStable) _morph(_tmStable, _tmSplit.stableHtml);
          _morph(_tmActive, _tmSplit.activeHtml);
        } else {
          _morph(_thinkBody, _tmSplit.fullHtml);
        }
        if (_tmOff < 24) _thinkBody.scrollTop = _thinkBody.scrollHeight;
        changed = true;
      }
    }
    return changed;
  }

  // ------------------------------------------------------------
  // L3.5：结构未变但有 running 工具 → 只刷新实时耗时徽标，跳过 L2 全量 morphdom。
  // live timer 每秒触发一次：直接改 .ow-tl-dur-live 的 textContent，零结构重建。
  // ------------------------------------------------------------
  function _l35PatchDurations(turnEl, turn) {
    var live = turn.live;
    if (!live || !live.runningTools) return;
    var fmtDur = H.fmtTimelineDur;
    if (!fmtDur) return;
    var liveEls = turnEl.querySelectorAll('.ow-tl-dur-live');
    if (liveEls.length === 0) return;
    var now = Date.now();
    liveEls.forEach(function(el) {
      // 徽标所在的 .ow-tl-item / .ow-ep 均带 data-call-id（renderToolCard 输出）
      var item = el.closest('[data-call-id]');
      var cid = item ? item.getAttribute('data-call-id') : null;
      var rt = cid ? live.runningTools[cid] : null;
      if (rt && rt.startTime) {
        el.textContent = fmtDur((now - rt.startTime) / 1000);
      }
    });
  }

  // ------------------------------------------------------------
  // L2（结构变化）：重建一个 turn 的内容。
  //   live（turn.live 存在）→ 只重建 .turn-steps 子树；
  //   终态 → 整体重建 .turn 子节点（renderSingleTurnHTML）。
  // 两者都在重建前捕获、重建后恢复该 turn 的 UI 瞬态。
  // ------------------------------------------------------------

  /** 捕获 turn 内 UI 瞬态（展开面板/折叠回答/时间线锚点），供 L2 后恢复 */
  function _captureTurnUI(turnEl) {
    var openPanels = []; // { callId: string|null, index: number }
    var panels = turnEl.querySelectorAll('.ow-panels .ow-ep');
    // 流式思考面板（data-live-think）的开合由数据驱动（思考中展开 / 正文开始收起），
    // 不参与瞬态捕获，否则恢复时会把刚收起的思考面板又掀开。
    var pIdx = -1;
    panels.forEach(function(p) {
      if (p.hasAttribute('data-live-think')) return;
      pIdx++;
      if (p.classList.contains('ow-show')) {
        openPanels.push({ callId: p.getAttribute('data-call-id') || null, index: pIdx });
      }
    });
    var collapsedAnswers = []; // 折叠的 .step-answer-wrap 序号
    var answers = turnEl.querySelectorAll('.step-answer-wrap');
    answers.forEach(function(w, idx) {
      var a = w.querySelector('.step-answer.collapsible');
      if (a && a.classList.contains('collapsed')) collapsedAnswers.push(idx);
    });
    var ui = { openPanels: openPanels, collapsedAnswers: collapsedAnswers };

    var tl = turnEl.querySelector('.ow-tl');
    if (tl) {
      var tlOff = tl.scrollHeight - tl.scrollTop - tl.clientHeight;
      ui.tl = { stick: tlOff < 24, offset: tlOff };
    }
    return ui;
  }

  /** 恢复 turn 内 UI 瞬态 */
  function _restoreTurnUI(turnEl, ui) {
    if (!ui) return;
    var newPanels = [];
    turnEl.querySelectorAll('.ow-panels .ow-ep').forEach(function(p) {
      if (p.hasAttribute('data-live-think')) return; // 与捕获端同规则过滤，保证 index 对齐
      newPanels.push(p);
    });
    ui.openPanels.forEach(function(op) {
      var target = null;
      if (op.callId) {
        for (var i = 0; i < newPanels.length; i++) {
          if (newPanels[i].getAttribute('data-call-id') === op.callId) { target = newPanels[i]; break; }
        }
      }
      if (!target && op.index < newPanels.length) target = newPanels[op.index];
      if (target) target.classList.add('ow-show');
    });
    var answers = turnEl.querySelectorAll('.step-answer-wrap');
    ui.collapsedAnswers.forEach(function(idx) {
      var w = answers[idx];
      if (!w) return;
      var a = w.querySelector('.step-answer.collapsible');
      if (a) a.classList.add('collapsed');
    });
    if (ui.tl) {
      var tl = turnEl.querySelector('.ow-tl');
      if (tl) {
        if (ui.tl.stick) tl.scrollTop = tl.scrollHeight;
        else tl.scrollTop = Math.max(0, tl.scrollHeight - tl.clientHeight - ui.tl.offset);
      }
    }
  }

  /** 重建"流式 live"turn：morph .turn-steps（思考面板已在内，开合由数据驱动），保留用户气泡与外层属性 */
  function _applyStreaming(turnEl, turn) {
    var ui = _captureTurnUI(turnEl);
    var stepsHtml = '';
    try { stepsHtml = _withCtx(turnEl.parentNode, function () { return H.renderTurnStepsHTML(turn) || ''; }); } catch (e) { stepsHtml = ''; }
    var stepsEl = turnEl.querySelector('.turn-steps');
    if (stepsEl && stepsHtml) _morph(stepsEl, stepsHtml);
    _restoreTurnUI(turnEl, ui);
    if (!turnEl.hasAttribute('data-streaming')) turnEl.setAttribute('data-streaming', 'true');
  }

  /** 重建"终态"turn：整体 morph 子节点（renderSingleTurnHTML 决定 data-streaming） */
  function _applyStatic(turnEl, turn) {
    var ui = _captureTurnUI(turnEl);
    var html = '';
    try { html = _withCtx(turnEl.parentNode, function () { return H.renderSingleTurnHTML(turn) || ''; }); } catch (e) { html = ''; }
    if (html) _morph(turnEl, html, { root: true });
    // 终态 turn 无 live → 移除 data-streaming（renderSingleTurnHTML 不会输出它）
    if (turnEl.hasAttribute('data-streaming')) turnEl.removeAttribute('data-streaming');
    _restoreTurnUI(turnEl, ui);
    if (H.initCollapsible) {
      try { H.initCollapsible(turnEl); } catch (e) {}
    }
    if (H.scheduleIdleHighlight) {
      try { H.scheduleIdleHighlight(turnEl); } catch (e) {}
    }
  }

  // ------------------------------------------------------------
  // 单 turn 比对与更新（供 renderDiff 使用）
  // 返回 true = 发生了 DOM 更新
  // ------------------------------------------------------------
  function _updateTurn(container, entry, turn) {
    var sig = H.turnSig(turn);

    // ---- live 状态机（先于静态签名比对：running 工具即使签名不变也需每秒刷新耗时）----
    if (turn.live) {
      var struct = _liveStructSig(turn);
      var running = turn.live.runningTools && Object.keys(turn.live.runningTools).length > 0;
      var curContent = turn.live.text || '';
      var curReasoning = turn.live.reasoning || '';
      if (entry.live) {
        // 上次也是 live。优先级：结构变化 → L2；结构未变但有 running → L3.5（仅刷耗时）；
        // 仅文本变 → L3；全等 → 不动。
        if (entry.struct !== struct) {
          // 结构变化（新工具步/工具完成/正文开始或停止/思考→正文切换/partial 物化）→ L2 全量重建
          _applyStreaming(entry.el, turn);
          entry.struct = struct;
          entry.sig = sig;
          entry.lastContent = curContent;
          entry.lastReasoning = curReasoning;
          return true;
        }
        if (running) {
          // L3.5：结构未变但有 running 工具 → 只刷新 .ow-tl-dur-live 实时耗时，跳过 L2 morphdom。
          // running 期间可能并发 text_delta → 继续走 L3 文本 patch
          _l35PatchDurations(entry.el, turn);
          if (entry.lastContent !== curContent || entry.lastReasoning !== curReasoning) {
            _l3Patch(entry.el, turn, entry.lastContent, entry.lastReasoning);
            entry.lastContent = curContent;
            entry.lastReasoning = curReasoning;
          }
          entry.sig = sig;
          return true;
        }
        if (entry.lastContent !== curContent ||
            entry.lastReasoning !== curReasoning) {
          var changedText = _l3Patch(entry.el, turn, entry.lastContent, entry.lastReasoning);
          if (changedText) {
            entry.sig = sig;
            entry.lastContent = curContent;
            entry.lastReasoning = curReasoning;
            return true;
          }
          // 文本引用有差异但 L3 找不到目标 DOM（结构缺失等）→ 保守全量
          entry.struct = struct;
          entry.sig = sig;
          return false;
        }
        // 未变（如 live timer 空跑/重复 render）→ 不动 DOM
        entry.sig = sig;
        return false;
      }
      // 旧状态非 live → 新 live（罕见，直接按 live 渲染）
      _applyStreaming(entry.el, turn);
      entry.live = true;
      entry.struct = struct;
      entry.sig = sig;
      entry.lastContent = curContent;
      entry.lastReasoning = curReasoning;
      return true;
    }

    // ---- 终态 ----
    if (entry.sig === sig) return false;
    // live → final 过渡（流结束 finalize）与历史 turn 内容变化（reFetch 订正）都整 turn 重渲
    _applyStatic(entry.el, turn);
    entry.live = false;
    entry.sig = sig;
    entry.struct = null;
    entry.lastContent = null;
    entry.lastReasoning = null;
    return true;
  }

  // ------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------

  /** 全量渲染（切会话 / 首次 / 结构性大改后）。返回 true。 */
  var MAX_RENDERED_TURNS = 200; // 超长对话 DOM 上限：只渲染最近 N 个 turn，旧 turn 用占位保留滚动高度

  function renderFull(container, msgs, sid) {
    var allTurns = H.buildTurns(msgs, _getLive(sid));
    // 虚拟化：turns 超上限时只渲染最近 N 个，顶部插占位 div 保留滚动位置。
    // 占位高度用 contain-intrinsic-size 估算（每个 turn ~500px），避免滚动条跳变。
    // __rdx.map 只含已渲染 turn；renderDiff 的尾部追加逻辑天然兼容（占位不计入 map）。
    var turns, placeholderHeight = 0, droppedCount = 0;
    if (allTurns.length > MAX_RENDERED_TURNS) {
      droppedCount = allTurns.length - MAX_RENDERED_TURNS;
      turns = allTurns.slice(droppedCount);
      placeholderHeight = droppedCount * 500;
    } else {
      turns = allTurns;
    }
    var html = '';
    if (placeholderHeight > 0) {
      html += '<div class="turn-placeholder" data-dropped="' + droppedCount + '" style="height:' + placeholderHeight + 'px"></div>';
    }
    turns.forEach(function(turn) {
      try { html += _withCtx(container, function () { return H.renderSingleTurnHTML(turn) || ''; }); } catch (e) { console.warn('[render] renderSingleTurnHTML failed', e); }
    });
    container.innerHTML = html;

    var map = new Map();
    // 不依赖位置：按 data-key 索引根元素。单个 turn 渲染抛错/为空时不会产出元素，
    // 位置式 children[i] 会让后续 turn 错位映射到错误的 key（静默腐败）。
    // 改为查 [data-key]：渲染成功的 turn 精确匹配，失败的 turn 落空为 null（不波及他人）。
    var elByKey = Object.create(null);
    var children = container.children;
    for (var c = 0; c < children.length; c++) {
      var child = children[c];
      if (child.getAttribute) {
        var dk = child.getAttribute('data-key');
        if (dk != null && elByKey[dk] == null) elByKey[dk] = child;
      }
    }
    for (var i = 0; i < turns.length; i++) {
      var key = turns[i].key;
      var keyStr = String(key == null ? '' : key);
      var el = elByKey[keyStr] || null;
      var isLive = !!turns[i].live;
      var entry = {
        el: el,
        sig: H.turnSig(turns[i]),
        live: isLive,
        struct: isLive ? _liveStructSig(turns[i]) : null,
        lastContent: isLive ? (turns[i].live.text || '') : null,
        lastReasoning: isLive ? (turns[i].live.reasoning || '') : null,
      };
      map.set(key, entry);
    }
    if (H.initCollapsible) {
      try { H.initCollapsible(container); } catch (e) {}
    }
    if (H.scheduleIdleHighlight) {
      try { H.scheduleIdleHighlight(container); } catch (e) {}
    }
    container.__rdx = { sid: sid || null, map: map, seq: (container.__rdx && container.__rdx.seq ? container.__rdx.seq + 1 : 1), droppedCount: droppedCount };
    return true;
  }

  /**
   * 增量 reconcile（流式 / reFetch merge 等逐帧调用）。
   * - 会话切换 / key 前缀失配 / 有删除 → 自动全量回退。
   * - 返回 true 表示发生了 DOM 更新。
   */
  function renderDiff(container, msgs, sid) {
    var rdx = container.__rdx;
    if (!rdx || rdx.sid !== sid) {
      return renderFull(container, msgs, sid);
    }
    var allTurns = H.buildTurns(msgs, _getLive(sid));
    // 虚拟化对齐：只比对已渲染窗口（跳过 droppedCount 个旧 turn）。
    // 若总数未超上限 droppedCount=0，逻辑与全量路径一致。
    var dropped = rdx.droppedCount || 0;
    // 若需要渲染的窗口超出已渲染范围（dropped 变化或总数回落到上限下）→ 全量回退重算
    if (allTurns.length > MAX_RENDERED_TURNS && dropped !== allTurns.length - Math.min(allTurns.length, MAX_RENDERED_TURNS)) {
      return renderFull(container, msgs, sid);
    }
    var turns = dropped > 0 ? allTurns.slice(dropped) : allTurns;
    var oldKeys = [];
    rdx.map.forEach(function(v, k) { oldKeys.push(k); });
    var newKeys = turns.map(function(t) { return t.key; });

    // 只允许"尾部追加"的增量；前缀变动 / 出现删除 → 全量回退（结构大改路径）
    var tailAppend = newKeys.length >= oldKeys.length;
    if (tailAppend) {
      for (var i = 0; i < oldKeys.length; i++) {
        if (oldKeys[i] !== newKeys[i]) { tailAppend = false; break; }
      }
    }
    if (!tailAppend) {
      return renderFull(container, msgs, sid);
    }

    var changed = false;

    // 1) 已存在 turn：签名比对
    for (var t = 0; t < oldKeys.length; t++) {
      var turn = turns[t];
      var key = oldKeys[t];
      var entry = rdx.map.get(key);
      if (!entry) continue; // 不应发生（前缀一致）
      if (_updateTurn(container, entry, turn)) changed = true;
    }

    // 2) 尾部新增 turn：追加元素
    for (var a = oldKeys.length; a < newKeys.length; a++) {
      var nTurn = turns[a];
      var nKey = nTurn.key;
      var htmlStr = '';
      try { htmlStr = _withCtx(container, function () { return H.renderSingleTurnHTML(nTurn) || ''; }); } catch (e) { console.warn('[render] renderSingleTurnHTML failed', e); continue; }
      var nEl = _elFromHtml(htmlStr);
      if (!nEl) continue;
      container.appendChild(nEl);
      var nLive = !!nTurn.live;
      rdx.map.set(nKey, {
        el: nEl,
        sig: H.turnSig(nTurn),
        live: nLive,
        struct: nLive ? _liveStructSig(nTurn) : null,
        lastContent: nLive ? (nTurn.live.text || '') : null,
        lastReasoning: nLive ? (nTurn.live.reasoning || '') : null,
      });
      changed = true;
    }
    if (changed && H.initCollapsible) {
      // 新增/变化后统一处理折叠默认值（幂等）
      try { H.initCollapsible(container); } catch (e) {}
    }
    return changed;
  }

  /** 清空某容器的渲染状态（容器 DOM 被外部清空时调用） */
  function rendererReset(container) {
    if (container && container.__rdx) {
      container.__rdx = null;
    }
  }

  // ---- Exports ----
  window.Hermes.renderFull = renderFull;
  window.Hermes.renderDiff = renderDiff;
  window.Hermes.rendererReset = rendererReset;

})();
