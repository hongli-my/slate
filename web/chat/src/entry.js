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
import "../js/session.js";
import "../js/chat.js";
import "../js/gateway.js";
import "../js/shortcuts.js";
import "../js/admin.js";
import "../js/app.js";
