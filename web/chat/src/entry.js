/**
 * chat entry — 依赖初始化 + 业务模块按序加载。
 *
 * 打包为 chat.bundle.js，替代 index.html 里 5 个 CDN 依赖 + 13 个 <script>。
 * 业务模块（web/chat/js/*.js）是 IIFE 挂 window.Hermes，彼此通过 window.Hermes
 * 通信，import 顺序即原 <script> 加载顺序，务必保持一致。
 *
 * 关键：deps.js 必须作为第一条 import（ESM import 先于本模块体求值），
 * 先挂好 window.marked / window.hljs / window.DOMPurify / window.morphdom /
 * window.remend，再求值业务模块（markdown.js 顶层 initMarked() 用裸全局名）。
 */

import "./deps.js";

// ---- 业务模块（IIFE 挂 window.Hermes，顺序 = 原 <script> 顺序）----
import "../js/state.js";
import "../js/api.js";
import "../js/project-manager.js";
import "../js/session-manager.js";
import "../js/router.js";
import "../js/markdown.js";
import "../js/eventsource-parser.js";
import "../js/view-model.js"; // 纯函数 view-model（分组/分解/签名），在 session/render 之前
import "../js/session.js";
import "../js/render.js";       // keyed element-map reconciler（依赖 view-model + session 构建器）
import "../js/scroll-anchor.js"; // stick-to-bottom 滚动控制器（ResizeObserver+rAF 弹簧，chat.js 使用）
import "../js/chat.js";
import "../js/gateway.js";
import "../js/shortcuts.js";
import "../js/admin.js";
import "../js/app.js";

// ---- 全局错误兜底（最小恢复提示）----
// ESM 静态 import 无法 try/catch：任一业务模块 eval 抛错会级联失败 → 白屏。
// ESM 语义下所有 import 先于本模块体求值，故此监听器在全部模块加载后才注册，
// 可捕获 DOMContentLoaded 延迟的 init() 抛错及运行期未捕获错误，渲染最小恢复提示，
// 避免用户面对白屏无从下手。（同步求值期级联仍会白屏，受 ESM 语义限制无法在此拦截。）
window.addEventListener('error', function (e) {
  // 资源加载错误（img/script 404 等）e.error 为 null，忽略以免误覆盖整屏
  if (!e.error) return;
  if (document.getElementById('hermes-fatal-overlay')) return;
  var msg = String(e.error.message || e.error).replace(/</g, '&lt;').slice(0, 500);
  var box = document.createElement('div');
  box.id = 'hermes-fatal-overlay';
  box.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(18,18,22,0.94);color:#eee;font-family:system-ui,-apple-system,sans-serif;z-index:99999;text-align:center;padding:24px';
  box.innerHTML = '<div><div style="font-size:36px;margin-bottom:10px">⚠️</div>'
    + '<div style="font-size:15px;font-weight:600;margin-bottom:6px">应用初始化失败，请刷新或重启</div>'
    + '<div style="font-size:12px;color:#9aa0a6;max-width:340px;line-height:1.5;word-break:break-all">' + msg + '</div></div>';
  if (document.body) document.body.appendChild(box);
  else document.documentElement.appendChild(box);
});
