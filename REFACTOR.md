# Slate 对话架构根治方案

## 问题诊断（当前架构的 6 个根因）

1. **翻译层是最大复杂度来源**：前端是为 Hermes/OpenAI 协议写的（`window.Hermes`、`choice.delta.tool_calls`、`hermes.tool.*`），pi-bridge 的 `toHermesMessage()` 把 pi 原生 `content blocks` 翻译回 Hermes 的 `content:string + tool_calls + reasoning`。两套消息模型靠字符串字段名耦合。
2. **桌面壳几乎是空壳**：对话前端在 iframe 里走 HTTP+SSE 到 Bun sidecar，完全不用 Tauri IPC。WKWebView→HTTP→Bun→pi SDK→LLM，四层间接。所有"流式卡顿优化"（40ms 帧合并、4KB 子块、结构签名 diff）都在补这层网络化的坑。
3. **前端无构建无模块**：13 个 `<script src>` 顺序加载，靠 `window.Hermes` 挂载，循环依赖靠运行时侥幸，`streamAssistantMsg` 结构散落 4 文件无定义。
4. **两套数据模型 + 双端缓存**：流式表示（`_toolSteps`/`content` 字符串）≠ 持久化表示（pi content blocks），靠 `finalizeStreamingTurn()` 合成 + `backgroundReFetch()` 覆盖。前端 LRU + 后端 LRU + 忙锁 + watchdog + `_settledReceived` 全是补丁。
5. **手撸 vdom 渲染**：`renderCurrentChat` 用结构签名 `_lastSig` + stable/active markdown 拆段 + morphdom 手做增量。每加一种事件都要维护签名字段。
6. **后端 god-server**：pi-bridge.ts 1343 行单文件，会话/SSE/模型/subagent/扩展/cron 全混在一个 fetch handler 里。

## 目标架构

```
┌─────────────────────────────────────────────┐
│  Slate.app (WKWebView)                      │
│  chat/index.html                            │
│   └─ <script type="module" src="./chat.bundle.js"> │
│      web/chat/src/ (TS + esbuild 打包)      │
│        ├─ api.ts        # fetch 封装        │
│        ├─ state.ts      # 单一 state        │
│        ├─ types.ts      # pi 原生类型       │
│        ├─ render.ts     # 认 content blocks │
│        ├─ chat.ts       # 讂 pi 原生事件    │
│        └─ app.ts        # 入口              │
└──────────────┬──────────────────────────────┘
               │ HTTP+SSE (127.0.0.1:8643)
               ▼
┌─────────────────────────────────────────────┐
│  pi-bridge sidecar (Bun)                    │
│  piweb-bridge/src/                          │
│    ├─ server.ts        # Bun.serve + 路由   │
│    ├─ config.ts        # modelRuntime 等    │
│    ├─ session-cache.ts # LRU + ensureSession│
│    ├─ sse.ts           # 透传 pi 事件       │
│    └─ routes/          # sessions/chat/...  │
│        （无 toHermesMessage，无 transformEvent）│
└──────────────┬──────────────────────────────┘
               │ 进程内
               ▼
        pi-coding-agent SDK
```

## 新契约（pi 原生，零翻译）

### 消息：`GET /sessions/:id/messages` → `AgentMessage[]`

```ts
type AgentMessage =
  | { role: "user"; content: string | (Text|Image)[]; timestamp: number }
  | { role: "assistant"; content: (Text|Thinking|ToolCall)[];
      usage: Usage; stopReason: StopReason; timestamp: number; ... }
  | { role: "toolResult"; toolCallId: string; toolName: string;
      content: (Text|Image)[]; isError: boolean; timestamp: number }

type Text      = { type: "text"; text: string }
type Thinking  = { type: "thinking"; thinking: string }
type ToolCall  = { type: "toolCall"; id: string; name: string; arguments: Record<string,any> }
```

### SSE：`POST /chat/stream` → pi 原生 `AgentSessionEvent`

后端只做两件事：
1. **帧合并**：`text_delta`/`thinking_delta` 攒 40ms 一帧（性能）
2. **体积裁剪**：`agent_end.messages` 剥离（可达数 MB，前端用 `message_end` 即可）

其余事件原样透传。前端认 `assistantMessageEvent.partial`（累积 AssistantMessage）作为流式状态。

### 流结束 = 真相

`message_end` 事件携带完整 `AgentMessage`（pi 原生），前端采信 usage。流式 content/thinking 已通过 `text_delta`/`thinking_delta` 累积。`backgroundReFetch` 保留作为过渡——用 DB 的 pi 原生消息替换前端 streaming msg（`content:string + _toolSteps`），确保后续渲染格式统一。后端 `busySessions` 是唯一忙锁。

## 分阶段执行

| 阶段 | 内容 | 状态 |
|------|------|------|
| **P1 后端根治** | pi-bridge.ts → `src/` 多模块；删翻译层；透传 pi 原生 | ✅ 完成 |
| **P2 前端契约适配** | 认 content blocks；删 Hermes 分支/合成/reFetch | ✅ 完成 |
| **P3 前端工程化** | esbuild 打包；TS 类型；消除全局脚本 | ⏳ 打包待做 |
| **P4 渲染层** | preact vdom 替换手撸结构签名 | 后续 |
| **P5 传输层** | Tauri IPC 替代 HTTP+SSE（需 pi SDK 进前端进程） | 长期 |

## 完成总结（P1+P2）

### 后端改动
- `pi-bridge.ts` 1343 行单体 → 10 个模块（`src/config.ts` / `session-cache.ts` / `sse.ts` / `schedules.ts` / `agents.ts` / `routes/sessions.ts` / `routes/chat.ts` / `routes/models.ts` / `server.ts` + 入口）
- **删除 `toHermesMessage()`** — `GET /sessions/:id/messages` 直接返回 pi 原生 `AgentMessage[]`
- **删除 `transformEvent()`** — SSE 透传 pi 原生 `AgentSessionEvent`，仅做体积裁剪（剥离 `agent_end.messages` / `turn_end.message` / `message_update.partial`）
- 忙锁统一在 `sse.ts` 的 `busySessions`，优雅退出 `gracefulShutdown`

### 前端改动
- **chat.js**：删除 ~210 行 Hermes/OpenAI 兼容 SSE 分支（`hermes.tool.*` / `choice.delta.*` / `approval.request` / `hermes.subagent.*`）；删除 `extractToolArgs`/`extractToolResult`；`toolcall_end` 不再构建 Hermes `tool_calls`，改为同步 `_toolSteps`；`message_end` 只取 usage；`tool_execution_end` push `{role:'toolResult',toolCallId}`；`finalizeStreamingTurn` 删除 `_toolSteps→tool_calls` 合成
- **session.js**：新增 `extractAssistantParts()`（从 pi content blocks 提取 text/thinking/toolCalls）；新增 `_extractContentText()`（blocks→string）；`groupIntoTurns` 认 pi 原生 assistant(`content:blocks[]`) + `toolResult`(`role:'toolResult'`) + `compactionSummary` + user(`content:string|blocks`)；`renderToolCard` 认 pi 字段 `tc.name`/`tc.arguments`/`tc.id`；`parseToolResult` 处理 blocks 数组 content；认 `toolResult.isError`

### 验证结果
- 后端启动正常，`/messages` 返回 pi 原生 content blocks ✓
- 81 个 assistant 消息正确提取 toolCalls/text ✓
- 80/81 toolCall↔toolResult 匹配 ✓
- 80/80 toolResult.content(blocks) 提取成功 ✓
- JS 语法检查通过 ✓

## P4/P5 暂不做的原因

- **P4 vdom**：当前 morphdom + 结构签名虽丑但能跑，且 P2 统一 content blocks 后渲染逻辑会大幅简化，vdom 的边际收益下降。先看 P2 后的复杂度再决定。
- **P5 Tauri IPC**：pi SDK 是 TS 库需 Bun 运行时，无法直接进 WKWebView。需先把 pi SDK 拆成"纯前端可 import"的形态，或用隐藏 webview 跑 SDK。工程量大且与 pi SDK 上游耦合，留作长期。

## P4 完成记录（2026-09-08）—— 渲染层根治重构

> 更新结论：P4 **未采用 preact vdom**，改为「纯函数 view-model + keyed element-map morphdom 单一渲染管线」。
> 理由：真实 bug 根因在数据形态分裂/流结束拆消息改数组/无稳定身份/三套 DOM 写路径并存，
> 不在缺框架；preact 反而与 thinking 气泡、时间线钉底、面板展开态等命令式 post-render 维护打架。

### 架构（相对上表 P4 设想的变化）
- **新增 `web/chat/js/view-model.js`**（纯函数，node 可单测）：`buildTurns(msgs)` 统一分组 + 稳定 key
  （`_localId || id || 序号/hash`）；`decomposeStreaming` 把流式残留归一化为与 DB 持久化形态等价
  的 steps；`turnSig` 廉价结构签名。**流结束不再 splice 拆消息**（根治 R1），残留消息直接渲染。
- **新增 `web/chat/js/render.js`**：keyed element-map reconciler，`container.__rdx` 持有 turnKey→元素
  快照；L1 全量（切会话）/ L2 单 turn 子树 morph / L3 流式正文微 patch（md-stable/md-active/tm-body）；
  每 turn UI 瞬态（展开面板按 data-call-id、折叠、时间线锚点）只在 L2 时捕获/恢复；结构性大改
  （删除/压缩/全量加载）自动回退全量。chat 模式与 view 模式共用该管线（renderMessages 保留签名）。
- **SSE 不再 push toolResult**（结果只存 `_toolSteps[].result`，reFetch 后 DB 提供），消除双写。
- 删除：`finalizeStreamingTurn`（DOM 旁路 + 拆消息）、`renderStreamingStepsHTML`、`renderThinkingBlock`、
  `renderStreamingText`、`_lastSig` 手拼签名机、view 模式展开状态保存的幽灵逻辑、Hermes 旧协议残留、
  🔧 工具开关与编辑重发（用户批准删除）。`_localId` 由 sendMessage/SSE 合成推送统一分配。
- 修正隐藏 bug：pi thinking block 正文在 `.thinking` 字段，旧 `extractAssistantParts` 读 `.text`
  导致**历史思考内容丢失**；新实现读 `.thinking ?? .text`。
- 保留公开契约：`renderMessages(messages, container)` / `renderCurrentChat()` / `groupIntoTurns`
  （委托 buildTurns）；CSS 类名/DOM 结构/事件委托/URL 深链/REST+SSE 协议全不变。

### 关键坑（morphdom）
**morphdom 字符串模式只取第一个根节点**（`template.content.childNodes[0]`），而 `.turn-steps` 的
HTML 是双根（`.ow-tools` 时间线 + `.step-final` 正文）→ childrenOnly morph 时正文块被静默丢弃，
表现为"流式回复只到最后才显示"。修复：`_morph` 先解析进包裹 `<div>` 再以元素对元素 morph
（多根/单根均安全，保留 DOM identity）。任何继续使用 morphdom(字符串) 的子树更新都要警惕多根。

### 验证
- `scripts/chat-smoke.mjs` 58 断言（含流式残留↔持久化形态等价、压缩孤儿跳过、key 稳定性、
  turnSig 敏感性、remnant≡persisted 签名门），`bun run scripts/chat-smoke.mjs` 全绿。
- 15 模块装载序契约 39 导出全在、已删符号不导出。
- 无头浏览器连真实 sidecar E2E：长文本流式逐帧出现、思考→工具→正文、中途 Stop 保留内容、
  重历史 view 渲染（264 消息/252 工具项）无错；桌面 release 打包启动冒烟通过。
