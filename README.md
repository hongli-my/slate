# Slate

本地桌面工作台——编辑器 + OTel 观测，摆脱浏览器。

## 背景

openresty 项目下原有两个编辑器实现和一组本地工具服务：

- **docs**（`nginx/html/docs/editor.html`）：单文件、CodeMirror 5（CDN）、VS Code 风格、纯客户端无后端。早期原型，风格简洁。
- **scribe**（`nginx/html/scribe/`）：TypeScript + esbuild 打包、Milkdown + CodeMirror 6、完整 Lua 后端。生产级重写。
- **127.0.0.1 工作台首页**：5 个 tab（OneTab / OTel / 编辑器 / PI / 代码），iframe 懒加载保活。
- **OTel 观测**：Lua + FFI SQLite 后端，OpenCode 插件上报 span，前端纯 HTML 渲染 session/trace/timeline。

长期通过浏览器访问 `127.0.0.1` 使用这些工具，痛点：

1. 浏览器快捷键劫持（Cmd+W 关错 tab、Cmd+T 干扰）
2. 混在几十个浏览器 tab 里，没有「工具」的心理定位
3. 无法全局热键呼出

## 需求

- 本地桌面 app，双击即用，独立程序身份（dock 图标、Cmd+Tab 切换）
- 编辑器：保留 docs 的 UI 风格，原生文件读写（非浏览器 File System Access API）
- OTel 观测：session 列表 + 详情 + timeline 甘特图，直接读 SQLite 不依赖 openresty
- 全局热键随时呼出
- 可离线（CDN 资源后续本地化）

## 目标

| 优先级 | 能力 | 状态 |
|--------|------|------|
| P0 | 原生壳 + 全局热键 + 窗口拖动 | ✅ |
| P0 | 编辑器（原生文件 API） | ✅ |
| P0 | OTel 观测（Rust 直读 SQLite） | ✅ |
| P1 | OneTab（浏览器标签管理） | 占位 |
| P1 | AI 对话 | 占位 |
| P2 | CDN 资源本地化（离线） | 待做 |
| P2 | 性能优化（OTel 加载慢） | 进行中 |

## 实现方式

### 技术栈

- **Tauri v2.11**（Rust 壳 + WKWebView）
- **前端**：纯 HTML/CSS/JS，零框架；CodeMirror 5（CDN）
- **后端**：Rust + rusqlite（bundled SQLite），Tauri command IPC
- **插件**：tauri-plugin-global-shortcut / tauri-plugin-dialog / tauri-plugin-fs / tauri-plugin-log

### 目录结构

```
slate/
├─ web/                       # 前端静态资源（frontendDist）
│  ├─ index.html             # 侧边栏壳：44px 窄边栏 + iframe 视图切换
│  ├─ editor.html            # 代码编辑器（docs 风格，Tauri fs API）
│  ├─ dashboard.css
│  └─ otel/                  # OTel 前端（从 openresty 移植）
│     ├─ index.html          # session 列表页
│     ├─ session.html        # session 详情页（timeline 甘特图）
│     └─ assets/{app,session,utils}.js + style.css
└─ src-tauri/
   ├─ Cargo.toml             # tauri 2 + rusqlite(bundled) + 4 个 plugin
   ├─ tauri.conf.json        # 窗口/CSP/图标配置
   ├─ capabilities/default.json
   ├─ icons/                 # 1024 源图生成的全套图标
   └─ src/
      ├─ main.rs
      ├─ lib.rs              # 菜单 + 全局热键 + invoke_handler 注册
      └─ otel.rs             # OTel 数据层（4 个 Tauri command）
```

### 架构

```
┌─────────────────────────────────────┐
│           Slate.app 窗口            │
│  ┌─────────┬─────────────────────┐  │
│  │ 侧边栏  │    iframe 视图区     │  │
│  │ 44px    │                     │  │
│  │ 📄编辑器 │  editor.html        │  │
│  │ 📑OneTab │  (Tauri fs API)    │  │
│  │ 🔍OTel  │  otel/index.html   │  │
│  │ 💬对话  │  (invoke → Rust)   │  │
│  │ ⚙️设置  │                     │  │
│  └─────────┴─────────────────────┘  │
│  顶部 32px drag-region（红绿灯让位） │
└─────────────────────────────────────┘
         │ Tauri IPC (invoke)
         ▼
┌─────────────────────────────────────┐
│            Rust 后端                │
│  lib.rs: 菜单 / 全局热键 / 路由     │
│  otel.rs: 4 个 command              │
│    ├─ otel_stats()    全局统计      │
│    ├─ otel_sessions()  session 列表 │
│    ├─ otel_session()   单 session   │
│    └─ otel_spans()    BFS 跨 trace  │
│         │ rusqlite (只读)           │
│         ▼                           │
│    ~/openresty/.../otel.db (917MB)  │
│    ~/.local/share/opencode/*.db     │
│      (跨库查 session title)         │
└─────────────────────────────────────┘
```

### 关键实现点

**编辑器原生文件 API**：editor.html 原用 File System Access API（Chromium 专属，WKWebView 不支持），改造为 Tauri dialog + fs 插件。iframe 内 `window.__TAURI__` 需从主 frame 重定向。

**OTel 后端 Rust 重写**：完整翻译 Lua `db.lua` 的查询逻辑——70 行 SESSION_SUMMARY_SQL（GROUP BY 聚合 + parent_session_id 三重 COALESCE）、BFS 跨 trace 递归、JSON 提取 prompt/response/tool_calls。DB 路径硬编码指向 openresty 下的 otel.db（只读）。

**窗口拖动**：`titleBarStyle: Overlay` 沉浸式，顶部 32px 手动 `startDragging()` / 双击 `toggleMaximize()`。需 capability `core:window:allow-start-dragging`。

**全局热键**：`Cmd+Shift+E` 呼出/聚焦窗口，tauri-plugin-global-shortcut v2。

### 数据来源

- **OTel span**：OpenCode 插件 `opencode-plugin-otel-viewer` POST 到 openresty `/otel/api/ingest`，写入 otel.db。Slate 只读不写。
- **Session title**：跨库查 `~/.local/share/opencode/opencode.db` 的 `session` 表。

## 构建

```bash
cd ~/ai-home/slate
bunx tauri dev      # 开发
bunx tauri build    # 产物在 src-tauri/target/release/bundle/macos/Slate.app
```

环境：Rust stable / Tauri CLI 2.11 / Node 22 / Xcode CLT。
