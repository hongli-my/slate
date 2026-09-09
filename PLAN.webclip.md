# PLAN: 网页转笔记 / 截图转笔记（Clippings）

> 已与用户确认的决策：AI 整理走 **pi-bridge 已有对话接口**（不新增云端 OpenAI 通道）；
> 每次转笔记**新建一次性"剪藏会话"并保留**在会话历史（可回看）；按当前默认对话模型发送，
> 视觉失败/不支持时**清晰报错引导换模型**；v1 全带上微信配图本地化 + JS 渲染页检测提示（⚙ 可裁剪）。
> 产物：`当前打开的文件夹/Clippings/<title>.md`（Obsidian 兼容 front-matter），自动刷新树 + 开新 tab。

## 目标

编辑区（📄编辑器，`web/index.html` + `web/src/editor/*`）新增两个入口：

1. **📥 网页转笔记**：粘贴/输入 URL → Rust 抓正文 → 微信配图本地化 ⚙ → pi-bridge 对话接口整理 → Clippings 存盘 → 开 tab
2. **📷 截图转笔记**：系统交互截图（自动隐藏窗口）→ 图片发给 pi-bridge（视觉）→ 整理 → Clippings 存盘 → 开 tab

## 已验证事实（实现时直接采用，不要推翻）

- pi SDK `AgentSession.prompt(text, opts)` 的 `PromptOptions.images?: ImageContent[]` 原生支持图片；`steer/followUp` 亦然。（`piweb-bridge/node_modules/@earendil-works/pi-coding-agent/dist/core/agent-session.d.ts` L153-166）
- piweb-bridge HTTP 端点：`POST /sessions {working_dir}` → `{session_id}`（**阶段 1 扩展：body `clip: true` → 无工具剪藏会话 `createClipSession`，实现于 session-cache.ts**）；`POST /chat/stream {session_id, message}` SSE；`PATCH /sessions/:id {title}` 改名；`DELETE /sessions/:id`。**阶段 1 已加 images 透传。**
- SSE 事件契约（pi 原生透传，见 `web/chat/js/chat.js` L780-905 + `piweb-bridge/src/sse.ts`）：
  - `{type:'message_update', assistantMessageEvent:{type:'text_delta', delta}}` → 累积正文（要的）
  - `{type:'message_update', assistantMessageEvent:{type:'thinking_delta', delta}}` → 思考（忽略/当进度）
  - `{type:'error', error}` → 失败；`{type:'agent_settled'}` → 正常完成标记
  - `message_end`/`agent_end` 等无需处理；EOF 即结束
- CSP 已放行 `connect-src ... http://127.0.0.1:8643`（tauri.conf.json），编辑器 iframe 可直接 fetch。
- 窗口 label = `main`；productName = `Slate`（权限提示文案用）。
- `src-tauri/Cargo.lock` 已含 `base64`(×2) 与 `chrono`(×1) → Cargo.toml 直接声明复用，**不新增外部编译版本**。
- reqwest 现为 `default-features = false, features = ["json"]` → **必须补 TLS**：加 `"native-tls"`（macOS 系统库，无 rustls 编译负担）。
- tokio 现 `features = ["time"]` → 补 `"process"`（跑 `screencapture`）。
- Rust command 里用 `std::fs` 写文件不经 capability，无需改 capabilities。
- 参考移植源（**用 curl 拉到 /tmp 读，禁止全盘搜索**）：
  - `https://raw.githubusercontent.com/yueyezhufeng/dsh-markdown/main/src-tauri/src/fetch.rs`（342 行，全量移植对象）
  - `https://raw.githubusercontent.com/yueyezhufeng/dsh-markdown/main/src/components/AiPanel.tsx`（urlToNote/imageToNote 流程 + prompt 文案参考）
  - 许可证 Apache-2.0，注明出处。

## 改动清单

### A. Rust（新能力层）— 阶段 1

**`src-tauri/Cargo.toml`**
- `reqwest = { version="0.12", default-features=false, features=["json","native-tls"] }`
- `tokio = { version="1", features=["time","process"] }`
- 新增 `base64 = "0.22"`、`chrono = "0.4"`（均在 lock 中已有，确认版本后声明）

**`src-tauri/src/webclip.rs`（新文件）**
- `PageContent { url, title, text, images }`，`#[serde(rename_all="camelCase")]`
- `#[tauri::command] pub async fn fetch_page(url: String) -> Result<PageContent, String>`：照 dsh `fetch.rs` L17-57 + `extract_text/extract_tag/extract_meta/strip_block/decode_entities/extract_images`（L60-235）移植；UA=Safari；timeout 20s；60KB 截断；非 html/text content-type 报错。
- `#[tauri::command] pub async fn download_images(root_dir: String, urls: Vec<String>) -> Result<Vec<String>, String>`：**无 vault state**，根目录由前端传（当前打开文件夹）。保存 `{root}/attachments/{YYYY}/{MM}/clip-{ts}-{i}.{ext}`（chrono 本地时间），≥5KB 过滤，返回**相对 root_dir 的路径**列表。
- `#[tauri::command] pub async fn interactive_screenshot(app: tauri::AppHandle) -> Result<Option<String>, String>`：照 dsh L295-342。CGPreflight/CGRequestScreenCaptureAccess extern（`#[link(name="CoreGraphics", kind="framework")]`）；未授权返回含"系统设置 → 隐私与安全性 → 屏幕录制 → 允许 **Slate**，然后完全退出本应用（⌘Q）并重新打开 + 临时替代（⇧⌘⌃4 截图后 ⌘V 粘贴）的错误文案；隐藏 main 窗口 180ms → `screencapture -i -x <tmp>`（tokio::process::Command）→ 恢复+聚焦 → base64 → 删临时文件；Esc 取消返回 None。

**`src-tauri/src/lib.rs`**：`mod webclip;` + `generate_handler!` 注册 3 个 command。

### B. piweb-bridge（对话通道透传 images + 无工具剪藏会话）— 阶段 1

**`piweb-bridge/src/session-cache.ts`**：新增 `export async function createClipSession(cwd: string): Promise<AgentSession>`
- 与 `createSession` 同构，但 `createAgentSession` 传 **`allowedToolNames: []`**（纯问答，不跑工具）。
- 复用同一 sessionCache LRU / idToPath 维护与持久化（会话保留可回看）。复用 `deleteSession` 清理路径。

**`piweb-bridge/src/routes/chat.ts`**：`POST /chat/stream` 的 body 增加可选 `images?: string[]`（dataURL 数组），调用 `sseResponse(session, message, sid, images)`。

**`piweb-bridge/src/sse.ts`**：`sseResponse(session, message, lockSid?, images?)` — prompt 时把 images 解析为 `ImageContent[]` 传入 `session.prompt(msg, { images })`。ImageContent 精确形状：实现前先 `grep` pi-ai 包内定义（在 `piweb-bridge/node_modules/@earendil-works/pi-ai` 下找 `ImageContent`，勿全盘搜）。

**验证**：`cargo check`（在 src-tauri）零错误；piweb-bridge 无 tsconfig，用 `bun build src/server.ts --target=bun` 做语法把关（不做类型检查，靠人工 review）。

### C. 编辑区前端 — 阶段 2

**`web/src/editor/io.ts`**：加 3 个 guarded invoke（照现有模式）：
- `fetchPage(url)` → `{url,title,text,images}`
- `downloadImages(rootDir, urls)` → `string[]`
- `interactiveScreenshot()` → base64 string | null（null=取消）

**`web/src/editor/clip.ts`（新）**：
- `const API_BASE = "http://127.0.0.1:8643"`
- SSE 消费（内置 ~50 行）：`fetch(API_BASE+"/chat/stream", {method:"POST", body: JSON.stringify({session_id, message, images}), signal})` → ReadableStream reader + TextDecoder → 按 `\n\n` 切帧、`data: ` 前缀、JSON.parse → 累积 `text_delta`；`error` 事件抛错；`agent_settled`/EOF 收尾。busy 409 时提示稍后重试。
- `clipWebPage(url)`：busy 互斥 → `fetchPage` → JS 页检测（`docs.qq.com|shimo.im|feishu.cn|notion.so|yuque.com` 或 `text 去空白 < 120`）→ toast 提示"改用 📷 截图"并终止（⚙ 可保留）→ 有图则 `downloadImages(currentDir, images)`（失败忽略）→ `POST /sessions {working_dir: state.currentDirPath}` → 发消息 = 整理指令（照 dsh system prompt 中文文案 + "直接输出 Markdown 正文，不要解释，不要使用任何工具"，正文 ≤30000 字符）→ 收满正文 → 空正文自动重试一次（更强指令）→ front-matter + 存盘。
- `clipScreenshot()`：busy 互斥 → `interactiveScreenshot()` → null 则静默返回 → 建会话 → 发"把图片整理为中文 Markdown 笔记（表格转 md 表格…）"+ `images:[dataUrl]` → 同上的收尾/重试/存盘。空输出重试一次。
- 存盘：目录 `{currentDir}/Clippings/`；文件名 = 标题（网页：`page.title`；截图：正文首个 `## xxx` 或"图片笔记 yyyy-MM-dd"）sanitize（`/\\:*?"<>|` → 空）；同名冲突 `file_stat` 探测加 `-2`、`-3`…；front-matter（网页）：`title/source/author/published/created/description/tags:["clippings"]` + 若有本地化配图加 `## 配图` 节；截图：`created/tags:["image-note"]`。写盘用现有 `save_file_atomic`。
- 成功后：`renderTree()` 刷新 + `addTab` 打开新文件 + `PATCH /sessions/:id` 命名（`🌐 <title>` / `🖼 <title>`）+ toast 结果（含相对路径）。全程 progress toast（抓取中/AI 整理中/保存成功）。返回/异常统一 toast 错误。
- 取消：Clip 期间允许（AbortController）——仅前端丢弃结果，会话保留在历史（已知限制，v1 不做服务端中止）。

**`web/src/editor/index.ts`**：暴露 `window.clipWebPage` / `window.clipScreenshot` + busy 置灰按钮。
**`web/index.html`**（+ 内联 css 或 editor.css）：顶部工具区加 📥 / 📷 按钮（作用于当前 active group 的文件夹；无打开文件夹时点击提示"先打开文件夹"）。

### 验收（每阶段）

1. `cargo check`（src-tauri）通过
2. `bun run build`（esbuild，root）产出无错（editor bundle）
3. 代码 review：diff 只含计划内文件；无死代码；错误文案中文；注释简洁（沿用仓库中文注释风格）
4. 手动冒烟留给用户（tauri dev 交互），但 worker 需自查逻辑闭环

## 边界与铁律

- 只在 cwd `/Users/honglichang/ai-home/slate` 内搜索/改动；参考 dsh 源码用给定 URL `curl` 到 `/tmp` 后 `read`。
- 不做计划外改动；有未批准决策 → 停下回报，不要自作主张。
- 不新增第三方 JS 依赖（SSE 自写）；Rust 只新增 base64/chrono 两个已在 lock 的依赖。
- 改完跑对应编译验证，汇报 `git diff --stat` + 关键片段。
