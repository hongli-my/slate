# PLAN.smooth.md — 对话渲染「丝滑化」根治方案

> **状态：已全部落地并验证（2026-09）**。执行记录见 `REFACTOR.md` 的 "P6 完成记录"，
> 回归入口：`node scripts/chat-render-check.mjs`（20 断言，ALL GREEN）。
> 下文保留的是**先测后改**的方案与实测证据，作为后续改动的事实依据。

> 结论先行：这轮不是「再调调 CSS」，是渲染层有 2 个真 bug + 2 个架构性缺陷。
> 全部用**真实 index.html + 真实 chat.bundle.js + 无头 Chrome(CDP)** 实测复现（脚本在
> `/tmp/slate-jitter/`，只读不改仓库），不是靠读代码猜。

---

## 1. 实测证据

| # | 现象 | 实测数据 | 复现脚本 |
|---|---|---|---|
| E1 | 流结束瞬间 `.turn` 元素 **2 → 3**，`data-key="u-cur"` **重复 2 份** | `turnCount 2→3, nestedTurns 1, dupKey 2` | drive4/drive5 |
| E2 | 回复整体**右移 20px**、底部多 24px（流结束那一刻） | `turnLeft 244→264, bodyLeft 300→320` | drive4 |
| E3 | 流结束瞬间 `.turn-agent-body` / `.ow-tl` **整个 DOM 被重建** | body 节点 `NEW`、`hlPending 0→1` | drive3 |
| E4 | 代码块「已上色 → 变回纯文本 → 异步再上色」 | 重建后 `code.need-auto-highlight` 重新出现，下一帧才被 hljs 上色 | drive3 |
| E5 | 思考气泡出现时**正文宽度 760 → 634**（1280 窗口），流结束又 634 → 760 | `bodyWidthJumps: 760→634(think), 634→760(finalize)` | drive3 |
| E6 | 思考气泡在**整个正文阶段不消失**（带 spinner 的"思考中"一直挂在右侧） | `margins: [0,1,1,...1,0]`（只在 finalize 归零） | drive3 |
| E7 | 钉底本身没问题 | `maxScrollDev = 0`（渲染函数内同步钉底是有效的） | drive3 |

窗口宽度 1280（`src-tauri/tauri.conf.json` 默认 1280×820）时 E5 才暴露；
宽度 ≥1433 时正文已顶到 `max-width:760`，气泡出现不再挤压 —— 所以这个抖动"换个窗口大小就时有时无"。

---

## 2. 根因

### R1（严重）`_morph()` 单根语义错位 —— `web/chat/js/render.js:30`

```js
function _morph(el, html) {
  var tmp = document.createElement('div');
  tmp.innerHTML = html;
  morphdom(el, tmp, { childrenOnly: true, ... });   // ← el 的 children 对 tmp 的 children
}
```

多根片段（`.turn-steps` ← `renderTurnStepsHTML` 的双根）**语义正确**；
但 `_applyStatic` (`render.js:287`) 传的是**单根** `<div class="turn">…</div>`：

- `el.children` = `[.turn-user, .turn-time, .turn-agent]`
- `tmp.children` = `[新的 .turn]` ← 差了一层

morphdom 于是把 `.turn-user` **就地 morph 成一个重复的 `.turn`**，删掉 `.turn-time` / `.turn-agent`，
再把新子树整棵插进去。后果：

1. `.turn` 嵌套 1 层 → `padding:0 20px` + `margin-bottom:24px` **翻倍** → 每次流结束回复右移 20px（E2）；
2. 外层 `data-key` 与内层重复（E1）→ `renderDiff` 的 key 索引不再唯一；
3. 新 `.turn-agent` 是**新建节点** → 整块重建（E3/E4）；
4. `contains` 的 `content-visibility/contain: layout style` 叠两层。

> 已在运行时 monkeypatch 预验证修复效果（`realMorph(el, tmp.firstElementChild)`，drive6）：
> `turnCount` 保持 2、`nested 0`、`dupKey 1`、`turnLeft` 恒 244、**`bodyNodePreserved: true`**。
> 即：这一处改完，E1/E2/E3/E4 同时消失。

### R2（严重）思考气泡：层级找错 + 挤压正文 —— `render.js:247` / `session.js:223` / `chat.css:550`

- `.turn-margin` 被渲染成 **`.turn-agent` 的子元素**（`session.js:564`），
  而 `_syncThinkingMargin` 只在 **`.turn` 的直接子元素**里找它（`render.js:253 turnEl.children`）→
  **永远找不到 → 思考结束/正文开始时不删除**（E6），只在整 turn 重渲时被顺手带走。
- `.turn-agent` 是 flex row，`.turn-agent-body{flex:1;max-width:760px}` + `.turn-margin{width:clamp(280px,24vw,400px)}`
  → 气泡出现 = 正文可用宽度少 280~400px → **整篇正文重排**（E5）。
  在 1280 窗口实测 -126px；在 1101~1432 区间都存在；≤1100 走 media query 折行（`chat.css:581`）反而没事。

### R3 代码块高亮在流式期反复「丢失→重上色」—— `render.js:295/437` + `markdown.js:366`

`scheduleIdleHighlight` 每次 turn 变化都跑，hljs 是**异步** `codeEl.innerHTML=…`；
而流结束的整块重建（R1）把已上色的 `<code>` 换成未上色 `<code>` → 先掉色再上色 = 一次明显闪烁（E4）。
（`hljs` 会给已高亮元素加 `data-highlighted="yes"`，这给了我们一个廉价的"别动它"判定。）

### R4（架构）钉底是「渲染函数里一次性赋值」，覆盖不了渲染之后的异步长高 —— `chat.js:160`

`renderCurrentChat()` → `if (changed && atBottom) _pinToBottom()`。
但**帧后**还会长高：hljs 上色、图片/字体加载、`details`/面板展开、`.ow-tl` 内容变化……
每次都会把视口留在半途，下一次渲染再钉一次 → **漂移-回弹**（这就是"不够丝滑"的来源之一）。
`maxScrollDev=0` 只说明"渲染那一刻"是齐的，不说明帧后不漂。

### R5 流式路径上还挂着 CSS transition —— `chat.css:215` / `chat.css:131`

`.step-final{transition:border-left-color .18s,opacity .15s}`：live→static 去掉 `.streaming-content`
会触发一次 180ms 的边框色渐变；`.step-body{transition:max-height .2s}` 若被类切换触发就是内容滑一下。

---

## 3. 借鉴开源实现（这次重点）

| 参考 | 关键做法 | 我们怎么用 |
|---|---|---|
| **use-stick-to-bottom**（StackBlitz, MIT, zero-dep；AI SDK Elements / assistant-ui 在用） | ① `ResizeObserver` 监听**内容**变化，② rAF **弹簧动画**（damping .7 / stiffness .05 / mass 1.25）追底，③ `targetScrollTop = scrollHeight - 1 - clientHeight`（`-1` 防亚像素 1px 振荡），④ 用户上滚/选中文本 → `escapedFromLock` 立即解锁不再抢滚动，⑤ 赋值 scrollTop 前临时把 `scroll-behavior` 覆盖成 `auto`，⑥ 区分"动画触发的 scroll 事件"与"用户滚动"（不做 debounce） | **直接移植 R4 的解法**：新增 `scroll-anchor.js`（~90 行 vanilla，零依赖）。ResizeObserver+rAF 追底 → 帧后长高也自动跟齐，且弹簧收尾不"啪"一下 |
| **streamdown**（Vercel） | 块级解析 + `remend` 修复未闭合标记 + **memoized rendering**（"Performance optimized - Memoized rendering for efficient updates"） | 我们已有 `md-stable`/`md-active` + 块级缓存 + remend（同源）。补上"**块一旦稳定就冻结**"，让 L3 只碰活跃块（并把异步高亮挡在稳定块外） |
| **opencode desktop**（Electron + **SolidJS** + `@opencode-ai/app`/`ui`） | 细粒度响应式：每个 message part 的 DOM **建一次**，后续只 patch 那个 text 节点，**没有 diff、没有全量重渲** | 长期方向参照；短期用"keyed element-map + 块冻结 + 单根 morph 修正"逼近同效果（我们的 turn/step 元素映射已经是这个思路，R1 是它被破坏的原因） |
| Vercel `ai-chatbot` / Lobe Chat / assistant-ui（已知实践） | 消息组件 memo + 流式节流；`react-virtuoso` 的 `followOutput` + 距底阈值；"用户滚上去就停止自动滚动，回底按钮再接管" | 佐证 P0/P1 的方向：**渲染粒度**与**滚动控制**分开、**不做逐 token 动画** |

共同结论（三家都一致）：
1. 滚动由**独立控制器（RO + rAF）**负责，不在渲染函数里赋值；
2. 只重建**变化的那一块**，已完成的块冻结；
3. **不在流式路径做过渡/动画**（类切换导致的 transition 就是闪）。

---

## 4. Todo（已全部执行完）

| 级别 | 项 | 涉及文件 | 验收 |
|---|---|---|---|
| P0-1 | `_morph` 区分「片段 childrenOnly」与「单根元素 morph」；`_applyStatic` 走元素对元素 | `render.js:30/287` | 无嵌套 `.turn`、无重复 `data-key`、finalize 前后 `.turn-agent-body` 节点身份不变 |
| P0-2 | `_syncThinkingMargin` 到 `.turn-agent` 层级查找（插入/移除都正确） | `render.js:247` | 正文/工具一开始，气泡立即消失 |
| P0-3 | 思考气泡不再挤压正文宽度（浮在右侧空白 / 不够宽则折到正文下方） | `chat.css:550` + `session.js:223` | 全程 `.turn-agent-body` 宽度恒定 |
| P0-4 | 保住代码高亮：morphdom `onBeforeElUpdated` 跳过已高亮 `<code>`；流式期不触发 idle highlight | `render.js:30/295/437` | finalize 前后 `code[data-highlighted]` 不闪、`need-auto-highlight` 计数不回升 |
| P1-5 | 引入 stick-to-bottom 控制器替换 `_pinToBottom` 一次性赋值（保留回底按钮 + 用户上滚解锁 + 选中保护） | 新增 `web/chat/js/scroll-anchor.js`、`chat.js:156` | 帧后长高（模拟异步上色/图片）滚动偏差 ≤1px；用户上滚后不抢滚动 |
| P1-6 | 去掉流式路径上的 transition（只在用户交互动作上保留） | `chat.css:131/215` | 类切换不再出现 180ms/200ms 渐变 |
| P2-7 | `content-visibility:auto + contain-intrinsic-size:auto 500px` 策略复核（长历史滚动时高度估算是否抖） | `chat.css:13` | 长会话滚动无跳变（用测量决定，不拍脑袋） |
| P2-8 | 回归防护：把本次无头检查固化为 `scripts/chat-render-check.mjs`（零新依赖，用系统 Chrome + CDP） | 新增脚本 | 一条命令抓住 E1~E6，防再次回归 |

P0 全部是**局部最小改动**（约 60 行），P1-5 是新增文件（约 90 行 vanilla 移植）。

---

## 5. 当时的拍板项（已按下述选择执行）

- **Q1 思考气泡形态 → 选 B**：去掉独立气泡，思考在时间线内就地展开（与 deepseek/chatgpt 一致）。
  实测依据：右栏气泡在 1280 窗口会把正文挤到 634px（默认窗口宽度下每次回答重排两次）。
- **Q2 headless 回归脚本 → 加**：`scripts/chat-render-check.mjs`（零新依赖，用系统 Chrome + CDP），
  `npm run check:chat` 一命令跑完。
- **Q3 是否换渲染内核 → 暂不换**：先把「块级冻结 + 结构同构 + 滚动控制器」做满（本轮已做），
  现在流式期已达到“零全量重渲 + 零节点重建 + 零滚动偏差”；若以后仍有余量需求再评估。

