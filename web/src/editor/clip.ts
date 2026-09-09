// web/src/editor/clip.ts
// 网页转笔记 / 截图转笔记（Clippings）编排。
//
// 流程（AI 整理走 pi-bridge「已有对话接口」，见 PLAN.webclip.md）：
//   网页：抓正文（Rust fetch_page）→ 微信配图本地化（download_images）→
//         新建无工具「剪藏会话」→ /chat/stream 流式整理 → 存 Clippings/ → 开 tab
//   截图：macOS 交互截图（interactive_screenshot）→ 图片随消息发给视觉模型 →
//         同上整理 / 存盘
//
// 会话每次都新建并保留（可在对话历史回看）；产物 Obsidian 兼容 front-matter。

import { state, basename } from "./state";
import { toast } from "./ui";
import { addTab, switchToTab } from "./tabs";
import { renderTree, buildTree } from "./filetree";
import { addRecent } from "./files";
import {
  saveFileAtomic,
  fileStat,
  watchTrack,
  fetchPage,
  downloadImages,
  interactiveScreenshot,
  mkdirDir,
} from "./io";

export const API_BASE = "http://127.0.0.1:8643";

/** 网页正文（去空白）低于该阈值视为 JS 渲染空壳，提示改用截图。 */
const JS_RENDERED_HOSTS = /docs\.qq\.com|shimo\.im|feishu\.cn|notion\.so|yuque\.com/i;
const MIN_TEXT_CHARS = 120;

// ---- busy 互斥 + 取消（仅前端丢弃结果，会话保留在历史） ----
let clipBusy = false;
let clipAbort: AbortController | null = null;

function setBusy(b: boolean): void {
  clipBusy = b;
  for (const id of ["btnClipUrl", "btnClipShot"]) {
    const btn = document.getElementById(id) as HTMLButtonElement | null;
    if (btn) btn.classList.toggle("busy", b);
  }
}

function cancelClip(msg: string): void {
  clipAbort?.abort();
  clipAbort = null;
  toast(msg);
}

/** 顶层入口（index.html onclick）：📥 网页转笔记 */
export async function clipWebPage(): Promise<void> {
  if (!state.currentDirPath) {
    toast("先打开一个文件夹才能转笔记");
    return;
  }
  if (clipBusy) {
    cancelClip("已取消网页转笔记（会话保留在历史）");
    return;
  }
  const url = await askUrl();
  if (!url) return;
  const ac = new AbortController();
  clipAbort = ac;
  setBusy(true);
  try {
    await runWebPageClip(url, ac.signal);
  } catch (e) {
    if (!ac.signal.aborted) toast("网页转笔记失败: " + errMsg(e), 5000);
  } finally {
    clipAbort = null;
    setBusy(false);
  }
}

/** 顶层入口（index.html onclick）：📷 截图转笔记 */
export async function clipScreenshot(): Promise<void> {
  if (!state.currentDirPath) {
    toast("先打开一个文件夹才能转笔记");
    return;
  }
  if (clipBusy) {
    cancelClip("已取消截图转笔记（会话保留在历史）");
    return;
  }
  const ac = new AbortController();
  clipAbort = ac;
  setBusy(true);
  try {
    const b64 = await interactiveScreenshot();
    if (b64 == null) return; // 用户按 Esc 取消（无错误提示）
    const dataUrl = "data:image/png;base64," + b64;
    const dir = state.currentDirPath!;
    toast("连接对话引擎…", 4000);
    const sid = await createClipSession(dir);
    toast("⏳ 视觉模型整理中…（无响应请到设置切换支持图片的模型）", 60000);
    const system =
      "把图片内容整理为一篇结构清晰的中文 Markdown 笔记：表格逐行转为 Markdown 表格、列表转列表、标题层级合理；" +
      "保留全部关键信息；首行用「## 主题」概括；直接输出 Markdown 正文，不要解释，不要使用任何工具。";
    let full = await sseChatStream(sid, system, [dataUrl], ac.signal);
    if (!full.trim()) {
      toast("首次输出为空，自动重试…", 4000);
      full = await sseChatStream(
        sid,
        system +
          "\n\n【重要】最终回复正文（content）必须包含完整的 Markdown 笔记内容；不要只写在思考过程里；不要使用任何工具。",
        [dataUrl],
        ac.signal
      );
    }
    if (!full.trim()) {
      throw new Error(
        "视觉模型未返回内容：当前对话模型可能不支持图片输入，请到 设置 → 对话引擎 切换支持视觉的模型后重试。"
      );
    }
    const titleM = /^##\s+(.+)$/m.exec(full);
    const title = (titleM?.[1] ?? "图片笔记 " + new Date().toLocaleDateString()).slice(0, 60);
    const today = new Date().toISOString().slice(0, 10);
    const fm = `---\ncreated: ${today}\ntags:\n  - "image-note"\n---\n\n`;
    const body = fm + full.trim() + "\n";
    await saveAndOpen(dir, sid, title, body, "🖼 ");
    toast(`✅ 截图已转笔记：Clippings/${sanitizeFile(title)}.md`, 4000);
  } catch (e) {
    if (!ac.signal.aborted) toast("截图转笔记失败: " + errMsg(e), 6000);
  } finally {
    clipAbort = null;
    setBusy(false);
  }
}

/** 网页转笔记主体。 */
async function runWebPageClip(url: string, signal: AbortSignal): Promise<void> {
  const dir = state.currentDirPath!;

  // 先抓取并校验（JS 渲染页/无效 URL 直接终止，不产生空会话）。
  toast("⏳ 抓取网页中…", 6000);
  const page = await fetchPage(url);
  const isJsRendered =
    JS_RENDERED_HOSTS.test(url) || page.text.replace(/\s+/g, "").length < MIN_TEXT_CHARS;
  if (isJsRendered) {
    throw new Error(
      "该页面由 JavaScript 动态渲染（腾讯文档/飞书/Notion 等），无法直接抓取正文。\n\n改用 📷 截图转笔记：视觉模型会把截图识别成 Markdown 笔记。"
    );
  }

  // 微信配图自动本地化（下载失败不阻断主流程）。
  let localImages: string[] = [];
  if (page.images.length) {
    localImages = await downloadImages(dir, page.images).catch(() => []);
  }

  const title = page.title || url;
  // 数据就绪后再建会话，避免抓取失败时留下空会话。
  toast("连接对话引擎…", 4000);
  const sid = await createClipSession(dir);
  toast(`⏳ AI 整理中…（${title.slice(0, 40)}）`, 60000);
  const system =
    "你是网页内容整理器。把网页文本整理为结构清晰的中文 Markdown 笔记：" +
    "1) 首行是「## 网页标题」；2) 接着 1-2 句摘要；3) 正文按逻辑分节（###），保留关键事实、数据、表格与列表；" +
    "4) 剔除广告、导航、版权等噪音；5) 直接输出 Markdown 正文，不要解释，不要使用任何工具。";
  const userText =
    `来源：${url}\n标题：${page.title || ""}\n\n网页文本：\n` + page.text.slice(0, 30000);
  let full = await sseChatStream(sid, `${system}\n\n${userText}`, undefined, signal);
  if (!full.trim()) {
    toast("首次输出为空，自动重试…", 4000);
    full = await sseChatStream(
      sid,
      `${system}\n\n${userText}\n\n【重要】最终回复必须只包含完整 Markdown 正文（首行以 ## 开头）；不要解释，不要使用任何工具。`,
      undefined,
      signal
    );
  }
  if (!full.trim()) throw new Error("模型未返回内容，请检查对话引擎设置或稍后重试。");

  const today = new Date().toISOString().slice(0, 10);
  // Collapse all whitespace (incl. \n) to single spaces — a <title> with a
  // newline would produce malformed YAML front-matter. Same normalization as
  // descRaw below.
  const cleanTitle = (page.title || url).replace(/\s+/g, " ").replace(/"/g, "'").trim();
  const descRaw = page.text.replace(/\s+/g, " ").trim().slice(0, 100) || page.title || "";
  const fm = [
    "---",
    `title: "${cleanTitle}"`,
    `source: "${url.replace(/"/g, "'")}"`,
    "author:",
    "published:",
    `created: ${today}`,
    `description: "${descRaw.replace(/"/g, "'")}"${page.text.length > 100 ? "…" : ""}`,
    "tags:",
    '  - "clippings"',
    "---",
    "",
  ].join("\n");
  let body = fm + full.trim();
  if (localImages.length) {
    body +=
      "\n\n## 配图\n\n" +
      localImages.map((rel, i) => `![${i + 1}](${encodeURI(rel)})`).join("\n\n") +
      "\n";
  }
  const { fileName } = await saveAndOpen(dir, sid, cleanTitle, body, "🌐 ");
  const imgNote = localImages.length ? `（配图 ${localImages.length} 张已本地化）` : "";
  toast(`✅ 已保存：Clippings/${fileName} ${imgNote}`, 4000);
}

/** 存盘 + 开 tab + 刷新树 + 会话命名。 */
async function saveAndOpen(
  dir: string,
  sid: string,
  title: string,
  content: string,
  sessionPrefix: "🌐 " | "🖼 "
): Promise<{ absPath: string; fileName: string; relPath: string }> {
  const clippingsDir = dir + "/Clippings";
  await mkdirDir(clippingsDir);
  const { absPath, fileName } = await resolveUniqueName(clippingsDir, sanitizeFile(title) + ".md");
  await saveFileAtomic(absPath, content);
  const stat = await fileStat(absPath).catch(() => null);

  const relPath = "Clippings/" + fileName;
  // 增量插入文件树（避免整树重扫的耗时与滚动抖动）。
  if (!state.scannedFiles.some((f) => f.absPath === absPath)) {
    state.scannedFiles.push({ name: fileName, path: relPath, absPath });
    state.scannedFiles.sort((a, b) => a.path.localeCompare(b.path));
    state.folderTree = buildTree(state.scannedFiles, basename(dir));
  }
  // Dedup: if a tab for this absPath is already open, switch to it instead of
  // opening a second tab (matches files.ts open-files behavior). The file was
  // just (re)written to disk; the watcher will reload the existing tab's
  // buffer if it is unmodified.
  const existing = state.openTabs.find((t) => t.absPath === absPath);
  if (existing) {
    switchToTab(existing.id);
  } else {
    addTab(
      fileName,
      relPath,
      content,
      absPath,
      "utf-8",
      "LF",
      stat?.mtimeMs ?? null,
      state.activeGroup,
      false
    );
  }
  renderTree();
  void watchTrack(absPath).catch(() => {});
  void renameSession(sid, sessionPrefix + title.slice(0, 40)).catch(() => {});
  void addRecent("file", absPath, fileName).catch(() => {});
  return { absPath, fileName, relPath };
}

// ---- pi-bridge HTTP（复用对话接口，契约见 PLAN） ----

/** 通用 bridge JSON 请求。 */
export async function bridgeJson(
  path: string,
  opts: { method?: string; body?: unknown; signal?: AbortSignal } = {}
): Promise<Record<string, unknown>> {
  let res: Response;
  try {
    res = await fetch(API_BASE + path, {
      method: opts.method || "POST",
      headers: { "Content-Type": "application/json" },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch (e) {
    if (opts.signal?.aborted) throw e;
    throw new Error("对话引擎未连接（" + API_BASE + "），请先在 设置 → 对话引擎 启动引擎后重试");
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`对话引擎错误 HTTP ${res.status}${txt ? ": " + txt.slice(0, 120) : ""}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("json") ? ((await res.json().catch(() => ({}))) as Record<string, unknown>) : {};
}

/** 新建无工具「剪藏」会话（body.clip=true → createClipSession）。 */
async function createClipSession(workingDir: string): Promise<string> {
  const r = await bridgeJson("/sessions", { body: { working_dir: workingDir, clip: true } });
  const sid = (r.session_id as string | undefined) || ((r.session as { id?: string } | undefined)?.id ?? "");
  if (!sid) throw new Error("创建对话会话失败");
  return sid;
}

/** 会话改名（保留在历史里可辨识）。 */
function renameSession(sid: string, title: string): Promise<Record<string, unknown>> {
  return bridgeJson(`/sessions/${sid}`, { method: "PATCH", body: { title } });
}

/** 逐行解析 SSE 帧（pi 原生事件透传，见 PLAN「已验证事实」）。 */
export function parseSseFrame(frame: string): Record<string, unknown> | null {
  // Normalize CRLF → LF so line-splitting works for servers using \r\n.
  frame = frame.replace(/\r\n/g, "\n");
  let data = "";
  for (const line of frame.split("\n")) {
    if (line.startsWith("data:")) data += line.slice(5).trimStart();
  }
  if (!data) return null;
  try {
    return JSON.parse(data) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** POST /chat/stream 并累积 text_delta，返回完整 AI 正文。 */
async function sseChatStream(
  sid: string,
  message: string,
  images: string[] | undefined,
  signal: AbortSignal
): Promise<string> {
  let res: Response;
  try {
    res = await fetch(API_BASE + "/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sid, message, images }),
      signal,
    });
  } catch (e) {
    if (signal.aborted) throw e;
    throw new Error("对话引擎未连接（" + API_BASE + "），请先在 设置 → 对话引擎 启动引擎后重试");
  }
  if (res.status === 409) throw new Error("对话引擎忙，请稍后重试");
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`对话引擎错误 HTTP ${res.status}${txt ? ": " + txt.slice(0, 120) : ""}`);
  }
  if (!res.body) throw new Error("对话引擎无响应体");

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let text = "";
  // Idle timeout: if pi-bridge stalls mid-stream (TCP open, no bytes), abort
  // the reader and surface a timeout instead of hanging until manual cancel.
  // Reset on every successful read; cleared in `finally`.
  const IDLE_TIMEOUT = 60000;
  let idleTimedOut = false;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  const resetIdle = (): void => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      idleTimedOut = true;
      // reader.cancel() releases the stream lock and rejects the pending
      // reader.read() below. We do NOT abort `signal` (the caller's), so the
      // timeout error still surfaces as a toast rather than a silent cancel.
      void reader.cancel("idle-timeout").catch(() => {});
    }, IDLE_TIMEOUT);
  };
  resetIdle();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      resetIdle();
      buf += dec.decode(value, { stream: true });
      // Normalize CRLF → LF so \n\n frame splitting works for \r\n\r\n servers.
      buf = buf.replace(/\r\n/g, "\n");
      let idx = buf.indexOf("\n\n");
      while (idx !== -1) {
        const frame = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        const ev = parseSseFrame(frame);
        if (ev) {
          if (ev.type === "message_update") {
            const ae = ev.assistantMessageEvent as { type?: string; delta?: string } | null;
            if (ae && ae.type === "text_delta" && typeof ae.delta === "string") text += ae.delta;
          } else if (ev.type === "error") {
            throw new Error(typeof ev.error === "string" ? ev.error : "AI 回复出错");
          }
        }
        idx = buf.indexOf("\n\n");
      }
    }
  } catch (e) {
    if (idleTimedOut) throw new Error("对话引擎响应超时");
    throw e;
  } finally {
    if (idleTimer) clearTimeout(idleTimer);
  }
  return text;
}

// ---- 文件命名 / 模态 ----

/** 文件名非法字符替换（`/\:*?"<>|` → `-`），避免嵌套路径/系统保留字。
 *  亦剥离控制字符（含换行）、首尾点/空格，并规避 Windows 保留名
 *  (CON/PRN/AUX/NUL/COM1-9/LPT1-9) — macOS 无此限制但利于跨设备同步。 */
function sanitizeFile(s: string): string {
  const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
  let out = s
    .replace(/[\x00-\x1f]/g, "") // control chars incl. newline
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) // 80-char cap (unchanged)
    .replace(/^\.+/, "") // no leading dots
    .replace(/[\s.]+$/, ""); // no trailing dots/spaces
  // Check the stem (without extension) against Windows reserved names.
  const stem = out.replace(/\.[^.]*$/, "");
  if (stem && RESERVED.test(stem)) out = "_" + out;
  return out || "未命名";
}

/** 同名冲突探测：已存在则追加 `-2`、`-3`… 再返回。 */
async function resolveUniqueName(
  dir: string,
  baseName: string
): Promise<{ absPath: string; fileName: string }> {
  const m = /^(.*?)(\.(?:md|markdown))$/i.exec(baseName);
  const stem = m ? m[1] : baseName;
  const ext = m ? m[2] : "";
  for (let n = 1; ; n++) {
    const fileName = (n === 1 ? stem : `${stem}-${n}`) + ext;
    const absPath = dir + "/" + fileName;
    const st = await fileStat(absPath).catch(() => null);
    if (!st) return { absPath, fileName };
  }
}

/** 简单 URL 输入模态（返回 null 表示取消；dataset.slateModal 屏蔽全局快捷键）。 */
function askUrl(): Promise<string | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.dataset.slateModal = "1";
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.45);" +
      "display:flex;align-items:center;justify-content:center;z-index:10001;";
    const dlg = document.createElement("div");
    dlg.style.cssText =
      "background:#4b4b4b;border:1px solid #666;border-radius:8px;padding:18px 20px;" +
      "min-width:420px;max-width:520px;box-shadow:0 8px 28px rgba(0,0,0,0.5);" +
      "color:#e0e0e0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;";
    dlg.innerHTML =
      '<h3 style="margin:0 0 8px;font-size:15px;font-weight:600;">📥 网页转笔记</h3>' +
      '<p style="margin:0 0 12px;font-size:12px;color:#aaa;line-height:1.5;">' +
      "粘贴网页链接，AI 整理成 Markdown 存入 <b>当前文件夹/Clippings/</b>。<br>" +
      "JS 动态渲染页（飞书/腾讯文档等）请改用 📷 截图转笔记。</p>" +
      '<input type="text" id="clipUrlInput" placeholder="https://…"' +
      ' style="width:100%;padding:7px 10px;border-radius:4px;border:1px solid #666;' +
      'background:#3c3c3c;color:#eee;font-size:13px;outline:none;font-family:inherit;" />' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;">' +
      '<button data-act="cancel" style="padding:6px 16px;border-radius:4px;cursor:pointer;font-size:13px;' +
      'background:transparent;border:1px solid #666;color:#ccc;font-family:inherit;">取消</button>' +
      '<button data-act="ok" style="padding:6px 16px;border-radius:4px;cursor:pointer;font-size:13px;' +
      'background:#5a8a5a;border:1px solid #7ab87a;color:#fff;font-family:inherit;">转笔记</button>' +
      "</div>";
    overlay.appendChild(dlg);
    document.body.appendChild(overlay);
    const input = dlg.querySelector("#clipUrlInput") as HTMLInputElement;
    const done = (val: string | null) => {
      document.removeEventListener("keydown", onKey);
      overlay.remove();
      resolve(val);
    };
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        done(null);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const v = input.value.trim();
        done(v ? v : null);
      }
    }
    document.addEventListener("keydown", onKey);
    dlg.querySelector('[data-act="ok"]')?.addEventListener("click", () => {
      const v = input.value.trim();
      done(v ? v : null);
    });
    dlg.querySelector('[data-act="cancel"]')?.addEventListener("click", () => done(null));
    overlay.addEventListener("mousedown", (e) => {
      if (e.target === overlay) done(null);
    });
    input.focus();
  });
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
