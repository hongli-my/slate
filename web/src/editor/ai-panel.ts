// web/src/editor/ai-panel.ts
// 编辑区内嵌 AI 助手面板（右侧滑出），与 pi-bridge sidecar 流式对话。
//
// 设计要点：
// - 会话懒创建 + 按当前目录缓存（切换文件夹自动重建普通会话）。
// - /chat/stream SSE 增量回调（text_delta → onText），不累积返回。
// - 选区文本作为上下文随用户问题一起发送。
// - busy 期间「发送」按钮变「停止」，点击即中止（AbortController + POST /abort）。
//
// 导出函数，由 index.ts 接线（覆盖 index.html 桩函数）：
//   setupAiPanel()    绑定 #aiInput 的 Cmd/Ctrl+Enter 发送快捷键 + 宽度拖拽手柄
//   toggleAiPanel()   打开/关闭面板
//   sendAiMessage()   发送输入框内容（busy 时改为中止当前流）
//   newAiSession()    新建会话（旧会话保留在历史，清空当前视图）
//   deleteAiSession() 删除当前会话（DELETE /sessions/:id，清空当前视图）

import { API_BASE, bridgeJson, parseSseFrame } from "./clip";
import { state, getActiveTab } from "./state";
import { toast, escapeHtml } from "./ui";
import { marked } from "marked";

// marked 全局选项（模块加载时设置一次；与 preview.ts 一致，gfm+breaks）。
marked.setOptions({ gfm: true, breaks: true });

// ---- 模块级状态 ----

/** 懒创建的会话 id 与创建时的目录（切换目录需重建）。 */
let sessionId: string | null = null;
let sessionDir: string | null = null;

/** busy 互斥 + 取消。busy 期间「发送」按钮文字为「停止」，点击即中止。 */
let busy = false;
let currentAbort: AbortController | null = null;
/** 当前流的会话 id（用于中止时 POST /abort）；流结束清空。 */
let currentSid: string | null = null;

/** assistant 气泡内 markdown 排版样式只注入一次。 */
let styleInjected = false;

// ---- 样式 ----

/** 注入一次性样式：assistant 气泡内 code/pre/列表/表格基础排版，user 气泡保留换行。 */
function injectPanelStyle(): void {
  if (styleInjected) return;
  styleInjected = true;
  const css = `
.ai-msg.user { white-space: pre-wrap; word-wrap: break-word; }
.ai-msg.assistant p { margin: 0 0 6px; }
.ai-msg.assistant p:last-child { margin-bottom: 0; }
.ai-msg.assistant ul, .ai-msg.assistant ol { margin: 0 0 6px; padding-left: 20px; }
.ai-msg.assistant li { margin: 2px 0; }
.ai-msg.assistant code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  background: rgba(0,0,0,0.28); padding: 1px 5px; border-radius: 3px; font-size: 12px;
}
.ai-msg.assistant pre {
  background: rgba(0,0,0,0.32); padding: 8px 10px; border-radius: 5px;
  overflow-x: auto; margin: 0 0 6px;
}
.ai-msg.assistant pre code { background: none; padding: 0; font-size: 12px; }
.ai-msg.assistant h1, .ai-msg.assistant h2, .ai-msg.assistant h3,
.ai-msg.assistant h4 { margin: 8px 0 4px; line-height: 1.3; }
.ai-msg.assistant h1 { font-size: 16px; }
.ai-msg.assistant h2 { font-size: 15px; }
.ai-msg.assistant h3 { font-size: 14px; }
.ai-msg.assistant a { color: #8ab4f8; }
.ai-msg.assistant blockquote {
  margin: 0 0 6px; padding: 2px 10px; border-left: 3px solid #666; color: #bbb;
}
.ai-msg.assistant table { border-collapse: collapse; margin: 0 0 6px; font-size: 12px; }
.ai-msg.assistant th, .ai-msg.assistant td { border: 1px solid #666; padding: 3px 7px; }
`;
  const el = document.createElement("style");
  el.textContent = css;
  document.head.appendChild(el);
}

// ---- 会话 / 流式 ----

/** 懒创建/复用普通会话；切换目录则重建。 */
async function ensureSession(): Promise<string> {
  const dir = state.currentDirPath ?? null;
  if (sessionId !== null && sessionDir === dir) return sessionId;
  const r = await bridgeJson("/sessions", {
    body: { working_dir: state.currentDirPath || undefined, clip: false },
  });
  const sid =
    (r.session_id as string | undefined) ||
    ((r.session as { id?: string } | undefined)?.id ?? "");
  if (!sid) throw new Error("创建对话会话失败");
  sessionId = sid;
  sessionDir = dir;
  return sid;
}

/** POST /chat/stream，SSE 解析，text_delta 调 onText；收到 error 事件抛错。
 *  409 = 引擎忙；网络错误带中文提示。signal 用于 AbortController 取消 fetch。 */
async function streamChat(
  sid: string,
  message: string,
  onText: (delta: string) => void,
  signal: AbortSignal
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(API_BASE + "/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sid, message }),
      signal,
    });
  } catch (e) {
    if (signal.aborted) throw e;
    throw new Error(
      "对话引擎未连接（" + API_BASE + "），请先在 设置 → 对话引擎 启动引擎后重试"
    );
  }
  if (res.status === 409) throw new Error("对话引擎忙，请稍后重试");
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(
      `对话引擎错误 HTTP ${res.status}${txt ? ": " + txt.slice(0, 120) : ""}`
    );
  }
  if (!res.body) throw new Error("对话引擎无响应体");

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx = buf.indexOf("\n\n");
    while (idx !== -1) {
      const frame = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const ev = parseSseFrame(frame);
      if (ev) {
        if (ev.type === "message_update") {
          const ae = ev.assistantMessageEvent as
            | { type?: string; delta?: string }
            | null;
          if (ae && ae.type === "text_delta" && typeof ae.delta === "string") {
            onText(ae.delta);
          }
        } else if (ev.type === "error") {
          throw new Error(typeof ev.error === "string" ? ev.error : "AI 回复出错");
        }
      }
      idx = buf.indexOf("\n\n");
    }
  }
}

// ---- 渲染 / DOM ----

/** 追加一条消息气泡，返回该元素并滚动 #aiMessages 到底部。 */
function appendMessage(role: "user" | "assistant", html: string): HTMLElement {
  const box = document.getElementById("aiMessages");
  const el = document.createElement("div");
  el.className = "ai-msg " + role;
  el.innerHTML = html;
  if (box) {
    box.appendChild(el);
    box.scrollTop = box.scrollHeight;
  }
  return el;
}

/** 渲染 markdown 为 HTML 字符串（marked 同步配置下返回 string）。 */
function renderMd(md: string): string {
  return marked.parse(md) as string;
}

/** busy 状态切换：输入框禁用、按钮文字「发送」↔「停止」。 */
function setBusy(b: boolean): void {
  busy = b;
  const input = document.getElementById("aiInput") as HTMLTextAreaElement | null;
  // 发送按钮无 id（只有 .ai-send class），用 querySelector 取。
  const btn = document.querySelector<HTMLButtonElement>("#aiPanel .ai-send");
  if (input) input.disabled = b;
  if (btn) btn.textContent = b ? "停止" : "发送";
}

/** 中止当前流：AbortController.abort() + POST /abort（fire-and-forget）。 */
function abortCurrent(): void {
  currentAbort?.abort();
  const sid = currentSid;
  if (sid) {
    void bridgeJson("/abort", { body: { session_id: sid } }).catch(() => {});
  }
}

// ---- 新建 / 删除会话 ----

/** 清空消息列表 DOM。 */
function clearMessages(): void {
  const box = document.getElementById("aiMessages");
  if (box) box.innerHTML = "";
}

/** 重置会话状态：下次发送时懒新建（ensureSession 见 sessionId===null 即重建）。 */
function resetSession(): void {
  sessionId = null;
  sessionDir = null;
}

/** 新建会话：中止当前流、清空当前视图、下次发送重建新会话（旧会话保留在历史）。 */
export function newAiSession(): void {
  if (busy) abortCurrent();
  resetSession();
  clearMessages();
}

/** 删除当前会话：中止当前流、DELETE 后端会话、清空视图。无会话时仅清空视图。 */
export async function deleteAiSession(): Promise<void> {
  if (busy) abortCurrent();
  const sid = sessionId;
  resetSession();
  clearMessages();
  if (sid) {
    try {
      await bridgeJson("/sessions/" + sid, { method: "DELETE" });
      toast("已删除会话");
    } catch (e) {
      toast("删除会话失败: " + (e instanceof Error ? e.message : String(e)), 5000);
    }
  }
}

// ---- 当前文件上下文 ----

/** 读取当前活动 tab 的文件名/路径与正文，作为上下文附加到问题。
 *  无打开文件时返回 null。正文过长截断到 MAX_CONTENT 字符，避免撑爆 token。 */
const MAX_CONTENT = 30000;

/** localStorage 键：是否自动附加当前文件上下文（默认开，值为 "0" 表示关）。 */
const AI_PREF_ATTACH_FILE = "slate.ai.attachFile";

/** 是否启用「自动附当前文件上下文」（设置页开关控制，默认开）。 */
function attachFileEnabled(): boolean {
  return localStorage.getItem(AI_PREF_ATTACH_FILE) !== "0";
}

function buildFileContext(): string | null {
  const tab = getActiveTab();
  if (!tab) return null;
  const name = tab.name;
  const path = tab.path || name;
  let content = "";
  if (state.view) {
    content = state.view.state.doc.toString();
    if (content.length > MAX_CONTENT) {
      content = content.slice(0, MAX_CONTENT) + "\n…（正文过长，已截断）";
    }
  }
  return `<当前文件：${path}>\n正文内容：\n${content || "（空文件）"}\n</当前文件>`;
}

/** 更新面板底部「当前文件」指示行（#aiContext）。 */
function updateAiContextIndicator(): void {
  const el = document.getElementById("aiContext");
  if (!el) return;
  const tab = getActiveTab();
  if (tab) {
    el.textContent = "📄 " + (tab.path || tab.name);
    el.hidden = false;
  } else {
    el.hidden = true;
  }
}

// ---- 导出 ----

/** 发送输入框内容；busy 时改为中止当前流。 */
export async function sendAiMessage(): Promise<void> {
  // busy 期间按钮已变「停止」→ 点击即中止（不开始新对话）。
  if (busy) {
    abortCurrent();
    return;
  }

  const input = document.getElementById("aiInput") as HTMLTextAreaElement | null;
  if (!input) return;
  const raw = input.value.trim();
  if (!raw) return;
  input.value = "";

  // 读取当前选区作为上下文（非空选区才附加）。
  let message = raw;
  if (state.view) {
    const sel = state.view.state.selection.main;
    if (sel.from !== sel.to) {
      const selText = state.view.state.sliceDoc(sel.from, sel.to);
      if (selText) {
        message = `${raw}\n\n<选中的文档片段>\n${selText}\n</选中的文档片段>`;
      }
    }
  }
  // 附加当前打开文件（文件名 + 正文），让 AI 知道在针对哪个文件提问。
  // 受设置页「自动附当前文件」开关控制（默认开）。
  const fileCtx = attachFileEnabled() ? buildFileContext() : null;
  if (fileCtx) {
    message += `\n\n${fileCtx}`;
  }

  injectPanelStyle();
  // user 气泡：纯文本转义（white-space:pre-wrap 保留换行）。
  appendMessage("user", escapeHtml(raw));
  const assistantEl = appendMessage("assistant", "思考中…");

  const ac = new AbortController();
  currentAbort = ac;
  setBusy(true);

  let full = "";
  try {
    currentSid = await ensureSession();
    await streamChat(
      currentSid,
      message,
      (delta) => {
        full += delta;
        assistantEl.innerHTML = renderMd(full);
        const box = document.getElementById("aiMessages");
        if (box) box.scrollTop = box.scrollHeight;
      },
      ac.signal
    );
    // 流结束：补渲染最终结果（空则提示）。
    if (full.trim()) {
      assistantEl.innerHTML = renderMd(full);
    } else {
      assistantEl.innerHTML = '<em style="opacity:.7">（无内容）</em>';
    }
  } catch (e) {
    if (ac.signal.aborted) {
      // 用户主动停止：在已有内容后补「（已停止）」。
      assistantEl.innerHTML = full.trim()
        ? renderMd(full) + '<p><em style="opacity:.7">（已停止）</em></p>'
        : '<em style="opacity:.7">（已停止）</em>';
    } else {
      const msg = e instanceof Error ? e.message : String(e);
      assistantEl.innerHTML =
        '<span style="color:#f66">' + escapeHtml(msg) + "</span>";
      toast(msg, 5000);
    }
  } finally {
    currentAbort = null;
    currentSid = null;
    setBusy(false);
  }
}

/** 打开/关闭面板（覆盖 index.html 桩函数）。打开时聚焦输入框。 */
export function toggleAiPanel(): void {
  const panel = document.getElementById("aiPanel");
  if (!panel) return;
  if (panel.hidden) {
    panel.hidden = false;
    // 强制 reflow：让浏览器先以 translateX(100%) 布局面板，再加 open class
    // 触发过渡。requestAnimationFrame 在 WKWebView 里可能早于首次布局执行，
    // 导致面板停留在屏幕外，直到外部 reflow（如点击编辑器）才「突然靠右出现」。
    void panel.offsetHeight;
    panel.classList.add("open");
    updateAiContextIndicator();
    const input = document.getElementById("aiInput") as HTMLTextAreaElement | null;
    // 过渡结束后再聚焦，避免 focus 触发的 reflow 干扰 transform 过渡。
    setTimeout(() => input?.focus(), 280);
  } else {
    panel.classList.remove("open");
    setTimeout(() => {
      panel.hidden = true;
    }, 250);
  }
}

/** 左缘拖拽手柄：调整面板宽度（min 260 / max 72vw）。 */
function setupAiResizer(): void {
  const panel = document.getElementById("aiPanel");
  const handle = document.getElementById("aiResizer");
  if (!panel || !handle) return;
  let dragging = false;
  let startX = 0;
  let startW = 0;
  handle.addEventListener("mousedown", (e: MouseEvent) => {
    dragging = true;
    startX = e.clientX;
    startW = panel.offsetWidth;
    handle.classList.add("dragging");
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
  function onMove(e: MouseEvent) {
    if (!dragging) return;
    // 面板右缘固定，左缘向左拖动 → 变宽；向右拖动 → 变窄。
    const w = startW - (e.clientX - startX);
    const maxW = Math.round(window.innerWidth * 0.72);
    if (w >= 260 && w <= maxW) panel.style.width = w + "px";
  }
  function onUp() {
    dragging = false;
    handle.classList.remove("dragging");
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  }
}

/** 绑定 #aiInput 的 Cmd+Enter / Ctrl+Enter 发送快捷键。 */
export function setupAiPanel(): void {
  const input = document.getElementById("aiInput");
  if (input) {
    input.addEventListener("keydown", (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void sendAiMessage();
      }
    });
  }
  setupAiResizer();
  updateAiContextIndicator();
  // 切换 tab 时刷新「当前文件」指示行（与 backlinks 同用 slate:tab-switched）。
  window.addEventListener("slate:tab-switched", updateAiContextIndicator);
}
