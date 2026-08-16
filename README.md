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
| P1 | AI 对话（内嵌 pi-bridge sidecar） | ✅ |
| P1 | 设置页（对话引擎管理） | ✅ |
| P2 | CDN 资源本地化（离线） | 待做 |
| P2 | 性能优化（OTel 加载慢） | 进行中 |

## 实现方式

### 技术栈

- **Tauri v2.11**（Rust 壳 + WKWebView）
- **前端**：纯 HTML/CSS/JS，零框架；编辑器 CodeMirror 6（esbuild 打包）
- **后端**：Rust + rusqlite（bundled SQLite），Tauri command IPC
- **插件**：tauri-plugin-global-shortcut / tauri-plugin-dialog / tauri-plugin-fs / tauri-plugin-log / tauri-plugin-shell（sidecar 进程管理）
- **对话引擎**：[piweb-bridge](../piweb-bridge) 编译为单二进制，作为 Tauri sidecar 随 app 打包；app 启动自动拉起，设置页可管理

### 目录结构

```
slate/
├─ web/                       # 前端静态资源（frontendDist）
│  ├─ index.html             # 侧边栏壳：44px 窄边栏 + iframe 视图切换 + 设置页
│  ├─ settings.js            # 设置页逻辑（对话引擎管理：start/stop/restart + 日志）
│  ├─ dashboard.css
│  ├─ src/                   # 编辑器源码（CodeMirror 6 + esbuild 打包）
│  ├─ vendor/                # editor.bundle.js（构建产物）
│  ├─ otel/                  # OTel 前端（从 openresty 移植）
│  │  ├─ index.html          # session 列表页
│  │  ├─ session.html        # session 详情页（timeline 甘特图）
│  │  └─ assets/{app,session,utils}.js + style.css
│  └─ chat/                  # 对话前端（Hermes/Pi WebUI，纯前端薄客户端）
│     ├─ index.html          # 装载 13 个 JS 模块
│     └─ js/                 # state/api/session/chat/gateway/router/admin ...
└─ src-tauri/
   ├─ Cargo.toml             # tauri 2 + rusqlite(bundled) + 5 个 plugin + reqwest + tokio
   ├─ tauri.conf.json        # 窗口/CSP/图标/externalBin/macOS entitlements
   ├─ Entitlements.plist     # macOS JIT 权限（bun JSC 在 hardened runtime 下需要）
   ├─ capabilities/default.json  # core/dialog/fs + shell sidecar 权限
   ├─ binaries/              # sidecar 二进制（构建产物，gitignore）
   │  └─ pi-bridge-<triple>  #   由 piweb-bridge 编译拷入
   ├─ icons/                 # 1024 源图生成的全套图标
   └─ src/
      ├─ main.rs
      ├─ lib.rs              # 菜单 + 全局热键 + invoke_handler + setup 拉起 sidecar
      ├─ pi_bridge.rs        # pi-bridge sidecar 生命周期管理（spawn/健康检查/重启/4 command）
      ├─ otel.rs             # OTel 数据层（4 个 Tauri command）
      ├─ fs_ops.rs           # 文件操作（4 个 command）
      └─ recents.rs          # 最近文件（3 个 command）
```

### 架构

```
┌─────────────────────────────────────┐
│           Slate.app 窗口            │
│  ┌─────────┬─────────────────────┐  │
│  │ 侧边栏  │    iframe 视图区     │  │
│  │ 44px    │                     │  │
│  │ 📄编辑器 │  editor (CM6)      │  │
│  │ 📑OneTab │  (Tauri fs API)    │  │
│  │ 🔍OTel  │  otel/index.html   │  │
│  │ 💬对话  │  chat/index.html   │  │
│  │ ⚙️设置  │  settings.js       │  │
│  └─────────┴─────────────────────┘  │
│  顶部 32px drag-region（红绿灯让位） │
└──────────────┬──────────────────────┘
       Tauri IPC │        HTTP+SSE (8643)
  invoke ────────┼──────────────────────────┐
                 ▼                          ▼
┌────────────────────────────┐  ┌─────────────────────────┐
│        Rust 后端           │  │  pi-bridge sidecar      │
│  lib.rs 菜单/热键/路由     │  │  (bun-compile 单二进制) │
│  pi_bridge.rs sidecar 管理  │──│  import pi SDK 进程内   │
│   ├─ start_bridge  spawn  │  │  驱动 AgentSession      │
│   ├─ stop_bridge   kill   │  │  Bun.serve :8643        │
│   ├─ restart_bridge        │  │  ~40 REST 端点 + SSE    │
│   └─ bridge_status         │  └─────────────────────────┘
│  otel.rs 4 command         │        │ 进程内调用
│  fs_ops/recents 7 command  │        ▼
│         │ rusqlite (只读)  │  ┌─────────────────────────┐
│         ▼                  │  │  @earendil-works/       │
│    otel.db / opencode.db   │  │  pi-coding-agent        │
└────────────────────────────┘  └─────────────────────────┘
```

**对话引擎 sidecar 集成**：piweb-bridge 用 `bun build --compile` 编译为单二进制（~71MB，含 Bun runtime + pi SDK），作为 Tauri externalBin sidecar 随 app 打包。app `setup` 钩子异步 spawn、`RunEvent::Exit` 时 kill；`pi_bridge.rs` 负责健康检查（轮询 /health）、崩溃自动重启（3s 退避）、端口/env 注入。设置页通过 invoke 调 start/stop/restart/status 四个 command，并订阅 `pi-bridge://log|ready|error|terminated` 事件实时显示状态与日志。对话前端（chat/）零改动，仍走 HTTP+SSE 到 127.0.0.1:8643。

**macOS 签名**：bun 用 JavaScriptCore 需 JIT，hardened runtime 下须配 `Entitlements.plist`（allow-jit / allow-unsigned-executable-memory / disable-library-validation / allow-dyld-environment-variables），否则进程被内核直接 kill。

### 关键实现点

**编辑器原生文件 API**：editor.html 原用 File System Access API（Chromium 专属，WKWebView 不支持），改造为 Tauri dialog + fs 插件。iframe 内 `window.__TAURI__` 需从主 frame 重定向。

**OTel 后端 Rust 重写**：完整翻译 Lua `db.lua` 的查询逻辑——70 行 SESSION_SUMMARY_SQL（GROUP BY 聚合 + parent_session_id 三重 COALESCE）、BFS 跨 trace 递归、JSON 提取 prompt/response/tool_calls。DB 路径硬编码指向 openresty 下的 otel.db（只读）。

**窗口拖动**：`titleBarStyle: Overlay` 沉浸式，顶部 32px 手动 `startDragging()` / 双击 `toggleMaximize()`。需 capability `core:window:allow-start-dragging`。

**全局热键**：`Cmd+Shift+E` 呼出/聚焦窗口，tauri-plugin-global-shortcut v2。

### 数据来源

- **OTel span**：OpenCode 插件 `opencode-plugin-otel-viewer` POST 到 openresty `/otel/api/ingest`，写入 otel.db。Slate 只读不写。
- **Session title**：跨库查 `~/.local/share/opencode/opencode.db` 的 `session` 表。

## 构建

### 前置：编译 pi-bridge sidecar

piweb-bridge 需先编译为单二进制并拷入 sidecar 目录（文件名按 target triple 命名）：

```bash
cd ~/ai-home/piweb-bridge
bun install
bun build --compile --minify --sourcemap --target=bun-darwin-arm64 ./pi-bridge.ts --outfile pi-bridge
mkdir -p ~/ai-home/slate/src-tauri/binaries
cp pi-bridge ~/ai-home/slate/src-tauri/binaries/pi-bridge-aarch64-apple-darwin
```

> ⚠️ `--bytecode` 与 top-level await 不兼容（pi-bridge.ts:38），不要加。其他平台替换 `--target` 与文件名后缀（如 `bun-darwin-x64` → `pi-bridge-x86_64-apple-darwin`）。

### 构建 app

```bash
cd ~/ai-home/slate
cargo tauri dev      # 开发（热重载）
cargo tauri build    # 产物在 src-tauri/target/release/bundle/macos/Slate.app
```

环境：Rust stable / Tauri CLI 2.11 / Bun 1.4 / Xcode CLT。

### macOS 签名与分发

- **本地开发**：ad-hoc 签名（`signingIdentity: "-"`）+ `Entitlements.plist`（JIT 权限），本机可直接跑。
- **分发**：需 Apple Developer ID 签名 + 公证 + staple。CI 走 [tauri-action](https://github.com/tauri-apps/tauri-action)，设 `APPLE_SIGNING_IDENTITY` / `APPLE_ID` / `APPLE_PASSWORD` / `APPLE_TEAM_ID` 环境变量自动完成。
- **已知坑**：[tauri#11992](https://github.com/tauri-apps/tauri/issues/11992) sidecar 签名顺序偶致公证失败，解法是 `beforeBuildCommand` 阶段预先 `codesign` 手动签名 sidecar。
