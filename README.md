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
- **对话引擎**：[piweb-bridge](./piweb-bridge)（本仓库子目录）编译为单二进制，作为 Tauri sidecar 随 app 打包；app 启动自动拉起，设置页可管理

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
├─ piweb-bridge/              # 对话引擎源码（已迁入本仓库，独立依赖）
│  ├─ pi-bridge.ts            # 桥接服务（HTTP/SSE + pi SDK）
│  ├─ start.sh                # 独立运行启动脚本（dev 用；sidecar 模式由 Rust 拉起）
│  ├─ package.json            # pi SDK + croner 依赖
│  └─ README.md               # piweb-bridge 详细文档
├─ scripts/
│  └─ build-pi-bridge.sh      # 编译 pi-bridge sidecar + 签名（tauri build 自动调用）
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

### 前置环境

- Rust stable（≥ 1.77.2，实测 1.97.1）
- Tauri CLI 2.11（实测 2.11.4）
- Bun 1.4（实测 1.4.0）
- Xcode Command Line Tools（`codesign` / `xcrun`）

> tauri CLI 若以 node shebang 脚本安装（`#!/usr/bin/env node`）而系统无 node，用 `bunx tauri ...` 调用；bun 自带 node 兼容 shim，`bun run build`（esbuild）亦可直接执行，无需单独装 node。

### 一、安装前端依赖

slate 前端依赖（CodeMirror 6 等）未提交，首次构建须安装：

```bash
cd ~/ai-home/slate
bun install          # 67 packages → node_modules/，esbuild 才能解析 @codemirror/*
```

> `editor.bundle.js` 虽已提交到 `web/vendor/`，但 `tauri build` 的 `beforeBuildCommand` 会重新跑 `bun run build`（esbuild），缺 node_modules 会报 `Could not resolve "@codemirror/view"`。

### 二、编译 pi-bridge sidecar

piweb-bridge 源码已迁入本仓库 `piweb-bridge/`，构建脚本 `scripts/build-pi-bridge.sh` 一键完成：安装依赖 → `bun build --compile` → 拷入 `src-tauri/binaries/pi-bridge-<triple>` → macOS ad-hoc 签名 + JIT entitlements。

`tauri build` 的 `beforeBuildCommand` 已自动串联此脚本（`bun run build && bun run build:pi-bridge`），**生产打包无需手动执行**。仅 `tauri dev` 在全新 clone（sidecar 二进制尚未生成）时需先手动跑一次：

```bash
cd ~/ai-home/slate
bun run build:pi-bridge     # 产物 ~71MB（含 Bun runtime + pi SDK），自动签名
```

跨平台编译用环境变量覆盖宿主默认：

| 环境变量 | 说明 | 示例 |
|---------|------|------|
| `PI_BRIDGE_TARGET` | bun `--target` | `bun-darwin-x64` |
| `PI_BRIDGE_TRIPLE` | rust target triple（决定 sidecar 文件名） | `x86_64-apple-darwin` |

> ⚠️ `--bytecode` 与 top-level await 不兼容（pi-bridge.ts:38），脚本未加。macOS 签名同时规避 [tauri#11992](https://github.com/tauri-apps/tauri/issues/11992)——sidecar 在 `beforeBuildCommand` 阶段预先签好，bundler 直接复用。

### 三、构建 app

```bash
cd ~/ai-home/slate
bunx tauri dev       # 开发（热重载，先跑 bun run build:watch）
bunx tauri build     # 生产打包
```

`tauri build` 依次执行：`bun run build`（esbuild → `web/vendor/editor.bundle.js`）→ `bun run build:pi-bridge`（sidecar 编译 + 签名）→ `cargo build --release` → bundle。实测 cargo 编译 ~40s（命中缓存），全流程约 1.5 分钟。

### 产物

```
src-tauri/target/release/bundle/
├─ macos/Slate.app                          ~89MB  ← 可直接双击运行
└─ dmg/Slate_0.1.0_aarch64.dmg              ~37MB  ← 分发安装包
```

app bundle 内嵌：`Contents/MacOS/app`（Rust 主进程）+ `Contents/MacOS/pi-bridge`（sidecar）。

拷到桌面运行：

```bash
cp -R src-tauri/target/release/bundle/macos/Slate.app ~/Desktop/
cp    src-tauri/target/release/bundle/dmg/Slate_0.1.0_aarch64.dmg ~/Desktop/
open ~/Desktop/Slate.app
```

### macOS 签名与分发

- **本地开发**：ad-hoc 签名（`signingIdentity: "-"`）+ `Entitlements.plist`（JIT 权限），本机可直接跑。
- **分发**：需 Apple Developer ID 签名 + 公证 + staple。CI 走 [tauri-action](https://github.com/tauri-apps/tauri-action)，设 `APPLE_SIGNING_IDENTITY` / `APPLE_ID` / `APPLE_PASSWORD` / `APPLE_TEAM_ID` 环境变量自动完成。
- **已知坑**：[tauri#11992](https://github.com/tauri-apps/tauri/issues/11992) sidecar 签名顺序偶致公证失败，解法是在 `beforeBuildCommand` 阶段预先 `codesign` 签名 sidecar——已由 `scripts/build-pi-bridge.sh` 自动完成。
