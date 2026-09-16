/* ============================================================
   Hermes WebUI - Stick-to-bottom 滚动控制器（零依赖）

   为什么需要它（旧实现的缺陷）：
   旧做法是"渲染函数里改了 DOM 就 scrollTop = scrollHeight" —— 只覆盖"渲染那一刻"。
   但流式期间大量长高发生在**渲染帧之后**：
     - hljs 异步上色（innerHTML 被替换，代码块高度变）
     - 图片/字体加载完成
     - 浏览器自身重排（表格、列表、数学式、content-visibility 进出视口）
   这些都会把视口留在半途，下一次渲染再钉一次 → 肉眼看到的"漂移-回弹"（不丝滑）。

   做法与理由（对齐 use-stick-to-bottom，StackBlitz/MIT，被 assistant-ui、AI SDK
   Elements 等采用）：
     1. ResizeObserver 观察**内容子元素**尺寸变化（比 scroll 事件更早、更准，
        连"内容变矮"也能感知）；
     2. 用 rAF **弹簧动画**（damping/stiffness/mass）逐帧渐近追底，而不是硬跳；
     3. targetScrollTop 用 scrollHeight - clientHeight，且距离 ≤1px 视为到位
        （规避 WebKit 亚像素导致的 1px 振荡）；
     4. 用户主动上滚/触摸/键盘上翻/正在选中文本 → 立刻解锁（escapedFromLock），
        **绝不抢用户滚动**；用户滚回底部附近 → 自动重新粘住；
     5. 写 scrollTop 前临时把 scroll-behavior 覆盖成 auto（防外部 CSS 的 smooth
        把程序化赋值变成异步动画，从而与我们的弹簧打架）。

   公开 API：
     H.createScrollAnchor(scroller, opts) → {
       el, kick(), pin(instant), scrollToBottom(), escape(),
       isAtBottom(), distance(), update(), onChange(cb), destroy()
     }
   ============================================================ */

window.Hermes = window.Hermes || {};

(function () {
  'use strict';

  var H = window.Hermes;

  // 追流式增长：要"静定"（不过冲、不弹跳）；damping=1 表示临界阻尼
  var STREAM_SPRING = { damping: 1.0, stiffness: 0.18, mass: 1 };
  // 用户点"回到底部"：要一点"顺滑收尾"的感觉
  var CLICK_SPRING = { damping: 0.7, stiffness: 0.08, mass: 1.1 };
  var NEAR_BOTTOM_PX = 70;   // 距底阈值（与 use-stick-to-bottom 的 STICK_TO_BOTTOM_OFFSET_PX 一致）
  var AT_BOTTOM_PX = 1;      // ≤1px 视为已到底（防亚像素振荡）
  var FRAME_MS = 1000 / 60;

  function createScrollAnchor(scroller, opts) {
    opts = opts || {};
    var streamSpring = opts.spring || STREAM_SPRING;
    var locked = opts.initial !== false;   // 是否自动追底
    var escaped = false;                   // 用户是否主动脱离
    var velocity = 0;
    var accumulated = 0;
    var lastTick = 0;
    var rafId = 0;
    var spring = streamSpring;
    var lastScrollTop = scroller.scrollTop;
    var ownWrite = null;                   // 我们自己写入的 scrollTop（用于区分用户滚动）
    var lastWriteAt = 0;                   // 上次自己写 scrollTop 的时刻
    var lastResizeAt = 0;                  // 上次内容尺寸变化的时刻
    var gestureUntil = 0;                  // 用户手势（指针按下/滚轮/按键）有效期
    var onChangeCbs = [];

    function nowMs() {
      return (window.performance && performance.now) ? performance.now() : Date.now();
    }

    function targetTop() {
      return Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    }
    function distance() {
      return targetTop() - scroller.scrollTop;
    }
    function isAtBottom() {
      return !escaped && distance() <= NEAR_BOTTOM_PX;
    }
    function notify() {
      var v = isAtBottom();
      for (var i = 0; i < onChangeCbs.length; i++) {
        try { onChangeCbs[i](v); } catch (e) {}
      }
    }

    function writeScrollTop(top) {
      var prev = scroller.style.scrollBehavior;
      if (scroller.ownerDocument.defaultView.getComputedStyle(scroller).scrollBehavior !== 'auto') {
        scroller.style.scrollBehavior = 'auto';
      }
      scroller.scrollTop = top;
      ownWrite = scroller.scrollTop;
      lastWriteAt = nowMs();
      if (prev) scroller.style.scrollBehavior = prev;
    }

    function tick() {
      rafId = 0;
      if (!locked) return;
      var now = nowMs();
      var dt = lastTick ? Math.min(4, (now - lastTick) / FRAME_MS) : 1;
      lastTick = now;
      var diff = distance();
      if (diff <= AT_BOTTOM_PX) {   // 到位 → 停下；后续长高由 ResizeObserver 再次唤醒
        velocity = 0;
        accumulated = 0;
        lastTick = 0;
        return;
      }
      velocity = (spring.damping * velocity + spring.stiffness * diff) / spring.mass;
      accumulated += velocity * dt;
      var step = Math.floor(accumulated);
      // 单帧上限：首屏/切会话的巨量长高一次到位，避免弹簧爬行几十帧
      if (step > 800) step = 800;
      if (step >= 1) {
        writeScrollTop(scroller.scrollTop + step);
        accumulated -= step;
      }
      if (distance() > AT_BOTTOM_PX) {
        rafId = requestAnimationFrame(tick);
      } else {
        velocity = 0;
        accumulated = 0;
        lastTick = 0;
      }
    }
    function kick(newSpring) {
      if (newSpring) spring = newSpring;
      if (!locked || rafId) return;
      lastTick = 0;
      rafId = requestAnimationFrame(tick);
    }

    // --- ResizeObserver：观测内容子元素（turn）尺寸变化 ---
    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () {
        // 标记"刚发生尺寸变化"：紧随其后的 scroll 事件可能是浏览器的 scroll-anchoring /
        // clamp 修正，不是用户意图，期间的向上位移不得当作"用户上滚"。
        lastResizeAt = nowMs();
        if (locked) kick();
      });
    }
    function update() {
      if (!ro) return;
      ro.disconnect();
      var kids = scroller.children;
      for (var i = 0; i < kids.length; i++) ro.observe(kids[i]);
    }

    // --- 用户意图检测（wheel/touch/keydown/scroll 方向） ---
    function escape() {
      if (!escaped) {
        escaped = true;
        lastTick = 0;
        velocity = 0;
        notify();
      }
      locked = false;
    }
    function relock() {
      escaped = false;
      locked = true;
      lastScrollTop = scroller.scrollTop;
      notify();
      kick();
    }

    function onWheel(e) {
      // 只要用户往上滚（含触控板惯性），立刻交还控制权
      gestureUntil = nowMs() + 800;
      if (e.deltaY < 0 && scroller.scrollHeight > scroller.clientHeight) escape();
    }
    function onPointerDown() { gestureUntil = nowMs() + 2500; }   // 拖滚动条/点击折叠按钮等
    function onTouchStart() { gestureUntil = nowMs() + 2500; escape(); }
    function onKeyDown(e) {
      var k = e.key;
      if (k === 'PageUp' || k === 'ArrowUp' || k === 'Home' || k === 'PageDown' || k === 'ArrowDown' || k === 'End') {
        // 上下翻页都先解除锁定：交给用户（滚到底部附近时会自动重新粘住）
        gestureUntil = nowMs() + 2500;
        escape();
      }
    }
    function onScroll() {
      var now = nowMs();
      var top = scroller.scrollTop;
      var prev = lastScrollTop;
      lastScrollTop = top;
      // 1) 是我们自己写的（容差 2px 吸 WebKit 亚像素）→ 忽略
      if (ownWrite !== null && Math.abs(top - ownWrite) < 2) { ownWrite = null; return; }
      ownWrite = null;
      // 2) 向下滚：回到离底 70px 内 → 重新粘住。**不受 resize 门控影响**（流式期
      //    ResizeObserver 每帧都在触发，若也门控这里就永远无法重新粘住）。
      //    期间 escaped 仍为 true 时不动（没到阈值就继续让用户看）。
      if (top > prev + 1) {
        if (escaped && distance() <= NEAR_BOTTOM_PX) relock();
        return;
      }
      // 3) 向上位移：刚写过 / 刚发生尺寸变化时，scrollTop 可能是浏览器 clamp 或
      //    scroll-anchoring 修正，不是用户意图 → 忽略；只有近期有用户手势才认定为上滚。
      if (now - lastWriteAt < 120) return;
      if (now - lastResizeAt < 200) return;
      if (top < prev - 1) {
        if (now < gestureUntil) escape();
        return;
      }
      if (locked && distance() <= NEAR_BOTTOM_PX && !rafId) kick();
    }

    scroller.addEventListener('wheel', onWheel, { passive: true });
    scroller.addEventListener('pointerdown', onPointerDown, { passive: true });
    scroller.addEventListener('touchstart', onTouchStart, { passive: true });
    scroller.addEventListener('keydown', onKeyDown);
    scroller.addEventListener('scroll', onScroll, { passive: true });

    var api = {
      el: scroller,
      kick: function () { kick(streamSpring); },
      /**
       * 同步钉底：渲染函数里刚写完 DOM（内容已长高）时立即对齐，
       * 保证本帧 paint 就在底部（不留"先画到错位置、下一帧才追"的抖）。
       * 用户已脱离（locked=false）时不做任何事。
       */
      sync: function () {
        if (!locked) return;
        if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
        velocity = 0;
        accumulated = 0;
        writeScrollTop(targetTop());
      },
      isLocked: function () { return locked; },
      /** 粘底并立即/动画到位（instant=true 用于发送消息、切会话） */
      pin: function (instant) {
        escaped = false;
        locked = true;
        spring = streamSpring;
        if (instant) {
          if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
          velocity = 0;
          accumulated = 0;
          writeScrollTop(targetTop());
          notify();
        } else {
          kick();
        }
      },
      /** 用户点"回到底部"：带回弹感的弹簧追底 */
      scrollToBottom: function () {
        escaped = false;
        locked = true;
        lastScrollTop = scroller.scrollTop;
        notify();
        kick(CLICK_SPRING);
      },
      /** 程序化跳转（搜索定位等）：主动放弃自动追底，别把用户拽回来 */
      escape: escape,
      /* 注：escape 后用 scrollToBottom()/pin() 重新粘住 */
      isAtBottom: isAtBottom,
      distance: distance,
      update: function () { update(); if (locked) kick(); },
      onChange: function (cb) { onChangeCbs.push(cb); cb(isAtBottom()); },
      destroy: function () {
        if (rafId) cancelAnimationFrame(rafId);
        if (ro) ro.disconnect();
        scroller.removeEventListener('wheel', onWheel);
        scroller.removeEventListener('pointerdown', onPointerDown);
        scroller.removeEventListener('touchstart', onTouchStart);
        scroller.removeEventListener('keydown', onKeyDown);
        scroller.removeEventListener('scroll', onScroll);
        onChangeCbs = [];
      }
    };
    update();
    return api;
  }

  H.createScrollAnchor = createScrollAnchor;
  H.SCROLL_NEAR_BOTTOM_PX = NEAR_BOTTOM_PX;

})();
