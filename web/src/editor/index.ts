// web/src/editor/index.ts
// Orchestrator: boot the editor, wire the update listener, attach window.*
// functions for index.html onclick handlers. FIX #17: init error guard.
// FIX #22: global error handlers.

import { EditorView, ViewUpdate } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { state, viewGroup, setActiveGroup, getTabByPath, getActiveTab, type Tab } from "./state";
import { createEditorView, buildExtensions, clearOccurrences, scheduleOccurrenceHighlight } from "./cm";
import { setupShortcuts } from "./keymap";
import { loadRecents, doOpenFolder, doOpenFiles, saveCurrentFile, doNewFile, deleteCurrentFile, openScannedFile } from "./files";
import { renderTabsBar, switchToTab, addTab } from "./tabs";
import { renderTree } from "./filetree";
import { togglePreview, scheduleMdRender, updateFormatButtons, isMarkdownFile, syncPreviewPane } from "./preview";
import { formatSQL, formatJSON, minifyJSON, toggleEol, toggleTheme } from "./commands";
import { setSearchQuery, SearchQuery } from "@codemirror/search";
import { toggleSplitView, setupSplitDivider } from "./split";
import { toggleMinimap } from "./minimap";
import { saveRecovery, readTextFile, readCalendar } from "./io";
import { showCalendar, calEventClick, calPrevMonth, calNextMonth, calGoToday, calSelectDate, calSwitchView, calJumpDate } from "./calendar";
import { setupEditorContextMenu } from "./contextmenu";
import { restoreSession } from "./session";
import { recordMacroUpdate } from "./macros";
import { updateStatusBar, updateStatusCursor, updateEolLabel } from "./statusbar";
import { setupPasteImage } from "./paste-image";
import { installReliableCopy } from "./copy";
import { clipWebPage, clipScreenshot } from "./clip";
import { toast, $, escapeHtml } from "./ui";
import { setNoteFileProvider, buildLinkIndex, backlinksFor, type LinkEntry } from "./wikilink";
import { createGraphView, type GraphView } from "./graph";
import { createMindmapView, type MindmapView } from "./mindmap";
import {
  setupAiPanel,
  toggleAiPanel,
  sendAiMessage,
  newAiSession,
  deleteAiSession,
} from "./ai-panel";

/** Central update listener for the main EditorView. */
function onDocUpdate(u: ViewUpdate): void {
  // Macro recording (FIX #13) — consume first so it sees the originating tx.
  recordMacroUpdate(u);
  const g = viewGroup(u);

  if (u.docChanged) {
    const tab = g.tabs.find((t) => t.id === g.activeTabId);
    if (tab) {
      if (!tab.modified) {
        tab.modified = true;
        renderTabsBar(g.id);
        updateStatusBar();
      }
    }
    // Live markdown preview (debounced 300ms — FIX #5).
    if (state.previewVisible && isMarkdownFile()) scheduleMdRender();
    // Session save (debounced 500ms — FIX #12).
    _session.saveSession();
    // Crash-recovery snapshot (debounced 1s). Only buffers with a path —
    // untitled buffers have no stable key to restore under.
    if (tab) scheduleRecoverySave(tab);
    // 编辑后刷新同词高亮（120ms 防抖在 cm.ts 内）。
    if (u.view.hasFocus) scheduleOccurrenceHighlight(u.view);
  }
  if (u.selectionSet || u.focusChanged) {
    updateStatusCursor();
    // Focus routing: make this view's group the active one.
    if (u.view.hasFocus && g.id !== state.activeGroup) {
      setActiveGroup(g.id);
      syncPreviewPane(); // move preview pane to the newly active group
    }
    // 同词高亮：选中/移动光标后调度。选中非空时先清旧标记再重绘——
    // 避免上一轮的 Decoration.mark 与新原生选区叠加（“复制只复制一半”的根因）。
    // ⚠ 不能在这里同步 dispatch：CM6 在 update listener 执行期间 updateState≠Idle，
    //   同步 view.dispatch 会抛 “update is in progress” 且被 CM6 静默吞掉，
    //   后面的 schedule 永不执行。统一延迟到本次更新结束后（microtask）再操作。
    if (u.view.hasFocus) {
      const sel = u.view.state.selection.main;
      const hasSel = sel.from !== sel.to;
      queueMicrotask(() => {
        if (hasSel) clearOccurrences(u.view);
        scheduleOccurrenceHighlight(u.view);
      });
    }
  }
  // NOTE: occurrence highlights persist across transactions — the StateField
  // maps its decorations through changes (dec.map(tr.changes)) and the
  // debounced re-highlight overwrites the set on its own; editing feels
  // flicker-free while typed words still get re-highlighted on pause.
}

// Debounced crash-recovery save. Each docChanged reschedules, so we only
// write to disk once editing pauses for 1s — cheap even on large files.
let recoveryTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleRecoverySave(tab: Tab): void {
  const path = tab.absPath;
  if (!path) return; // untitled buffers have no recovery key
  if (recoveryTimer) clearTimeout(recoveryTimer);
  recoveryTimer = setTimeout(() => {
    recoveryTimer = null;
    const view = state.view;
    if (!view) return;
    // Only snapshot if this tab is still open and still dirty (it may have
    // been saved / closed during the 1s window).
    const stillDirty = state.groups.some(
      (g) => g.activeTabId === tab.id && g.tabs.includes(tab) && tab.modified
    );
    if (!stillDirty) return;
    const content = view.state.doc.toString();
    void saveRecovery(path, content);
  }, 1000);
}

/** Listen for external file-change events from the Rust watcher and reload
 *  (unmodified) or warn (modified) per Sublime behavior. */
function setupFileWatcher(): void {
  const w = window as unknown as {
    __TAURI__?: { event?: { listen?: (ev: string, cb: (e: { payload: { path: string; mtimeMs: number } }) => void) => Promise<void> } };
  };
  const listen = w.__TAURI__?.event?.listen;
  if (typeof listen !== "function") return;
  listen("file-changed", (e) => {
    void onFileChanged(e.payload.path, e.payload.mtimeMs);
  }).catch(() => {
    /* ignore */
  });
}

async function onFileChanged(path: string, mtimeMs: number): Promise<void> {
  const tab = getTabByPath(path);
  if (!tab) return;
  if (mtimeMs === -2) {
    // Sentinel: file was deleted / moved on disk.
    toast(
      tab.modified
        ? `"${tab.name}" 已被外部删除（缓冲区仍有未保存内容）`
        : `"${tab.name}" 已被外部删除`
    );
    return;
  }
  if (tab.modified) {
    // Don't clobber unsaved edits — let the user decide (Cmd+S overwrite).
    toast(`"${tab.name}" 已被外部修改，Cmd+S 覆盖或放弃编辑`);
    return;
  }
  // Unmodified buffer — reload silently from disk.
  try {
    const r = await readTextFile(path);
    let content = r.text;
    const eol = content.includes("\r\n") ? "CRLF" : "LF";
    content = eol === "CRLF" ? content : content.replace(/\r\n/g, "\n");
    const g = state.groups.find((gg) => gg.tabs.includes(tab));
    if (!g) return;
    const view = g.view;
    if (view && g.activeTabId === tab.id) {
      // 内容与当前 doc 一致（多为自身保存触发的 mtime 变化）→ 跳过 reload，
      // 避免 dispatch 触发 docChanged 把刚保存的文件重新标为「已修改」，
      // 同时避免整段替换导致的编辑区/光标跳动。
      if (content === view.state.doc.toString()) {
        tab.mtimeMs = mtimeMs;
        return;
      }
      // Swap doc on the live view. Undo returns to the pre-reload state.
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: content } });
    } else if (state.buildExtensions && state.onUpdate) {
      // Background tab: skip reload if content is unchanged.
      if (tab.cmState && content === tab.cmState.doc.toString()) {
        tab.mtimeMs = mtimeMs;
        return;
      }
      tab.cmState = EditorState.create({ doc: content, extensions: state.buildExtensions(state.onUpdate) });
    }
    tab.mtimeMs = mtimeMs;
  } catch (err) {
    toast(`重新加载 "${tab.name}" 失败: ${(err as Error).message}`);
  }
}

// Lazy require wrapper wrapper removed; _session is imported directly below.
import * as _session from "./session";

// ---- Wikilink subsystem wiring ----
// linkIndex caches all [[source → target]] pairs across the vault. Rebuilt
// asynchronously on vault load; updated incrementally when a file is saved.
let linkIndex: LinkEntry[] = [];
let linkIndexTimer: ReturnType<typeof setTimeout> | null = null;

/** Register the note-file provider (for [[ ]] autocomplete) and the preview
 *  click handler (for wikilink navigation). Called once during initEditor. */
function setupWikilink(): void {
  // Provider: lazily reads state.scannedFiles on each completion request.
  // Returns markdown filenames without extension, deduplicated.
  setNoteFileProvider(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const f of state.scannedFiles) {
      if (!/\.(md|markdown)$/i.test(f.name)) continue;
      const title = f.name.replace(/\.(md|markdown)$/i, "");
      if (!seen.has(title)) { seen.add(title); out.push(title); }
    }
    return out;
  });

  // Wikilink click navigation in preview pane (event delegation).
  // previewPane is group0's preview; previewPane1 is group1's.
  for (const id of ["previewPane", "previewPane1"]) {
    const pane = document.getElementById(id);
    if (!pane) continue;
    pane.addEventListener("click", (e) => {
      const link = (e.target as HTMLElement | null)?.closest("a.wikilink") as HTMLElement | null;
      if (!link) return;
      const target = link.dataset.target;
      if (!target) return;
      e.preventDefault();
      void openWikilinkTarget(target);
    });
  }

  // Rebuild link index when a vault is loaded.
  window.addEventListener("slate:vault-loaded", () => { void rebuildLinkIndex(); });
  // Refresh backlinks panel when the active tab changes.
  window.addEventListener("slate:tab-switched", () => { refreshBacklinks(); });
}

/** Rebuild the full-vault link index by reading all .md file contents.
 *  Debounced 500ms so rapid folder switches don't trigger redundant reads. */
async function rebuildLinkIndex(): Promise<void> {
  if (linkIndexTimer) clearTimeout(linkIndexTimer);
  return new Promise((resolve) => {
    linkIndexTimer = setTimeout(async () => {
      linkIndexTimer = null;
      const mdFiles = state.scannedFiles.filter(f => /\.(md|markdown)$/i.test(f.path));
      const files: { path: string; content: string }[] = [];
      for (const f of mdFiles) {
        try {
          const r = await readTextFile(f.absPath);
          files.push({ path: f.path, content: r.text });
        } catch { /* skip unreadable */ }
      }
      linkIndex = buildLinkIndex(files);
      refreshBacklinks();
      resolve();
    }, 500);
  });
}

/** Update the backlinks panel DOM for the currently active tab. */
function refreshBacklinks(): void {
  const panel = document.getElementById("backlinksPanel");
  const list = document.getElementById("backlinksList");
  const count = document.getElementById("backlinksCount");
  if (!panel || !list || !count) return;

  const tab = getActiveTab();
  if (!tab || !/\.(md|markdown)$/i.test(tab.name)) {
    panel.hidden = true;
    return;
  }
  const title = tab.name.replace(/\.(md|markdown)$/i, "");
  const links = backlinksFor(title, linkIndex);
  if (links.length === 0) {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  count.textContent = String(links.length);
  // All three fields derive from .md file contents — escape before innerHTML
  // (a note named foo"><img src=x onerror=...>.md would inject HTML).
  list.innerHTML = links.map(l => {
    const sourcePath = escapeHtml(l.sourcePath);
    const source = escapeHtml(l.source);
    const target = escapeHtml(l.target);
    return `<div class="backlink-item" data-path="${sourcePath}" style="padding:4px 8px;cursor:pointer;border-radius:3px;">` +
      `<span style="color:#8ab4f8;font-size:13px;">${source}</span>` +
      `<span style="color:#888;font-size:12px;margin-left:6px;">→ [[${target}]]</span>` +
      `</div>`;
  }).join("");
  // Click a backlink → open that file.
  list.querySelectorAll<HTMLElement>(".backlink-item").forEach(item => {
    item.addEventListener("mouseenter", () => { item.style.background = "#4a4a4a"; });
    item.addEventListener("mouseleave", () => { item.style.background = ""; });
    item.addEventListener("click", () => {
      const path = item.dataset.path;
      if (path) void openFileByPath(path);
    });
  });
}

/** Open a file by its path (used by backlink clicks). Searches scannedFiles
 *  for a match; if found, opens it via openScannedFile. */
async function openFileByPath(relPath: string): Promise<void> {
  const ref = state.scannedFiles.find(f => f.path === relPath);
  if (ref) {
    await openScannedFile(ref);
    return;
  }
  toast(`找不到文件: ${relPath}`);
}

/** Open or create the target of a [[wikilink]] click in the preview pane. */
async function openWikilinkTarget(target: string): Promise<void> {
  // Try to find a .md file whose basename (sans extension) matches the target.
  const match = state.scannedFiles.find(f => {
    const base = f.name.replace(/\.(md|markdown)$/i, "");
    return base === target;
  });
  if (match) {
    await openScannedFile(match);
    return;
  }
  // No matching file — create a new untitled tab with the wikilink name.
  const name = target + ".md";
  addTab(name, name, `# ${target}\n\n`, null, "utf-8", "LF", null, state.activeGroup, false);
  toast(`已创建新笔记: ${name}`);
}

/** Toggle backlinks panel visibility (overrides the index.html stub). */
function toggleBacklinks(): void {
  const panel = document.getElementById("backlinksPanel");
  if (!panel) return;
  if (panel.hidden) {
    refreshBacklinks();
  } else {
    panel.classList.toggle("collapsed");
  }
}

// ---- Graph & Mindmap views ----
let graphView: GraphView | null = null;
let mindmapView: MindmapView | null = null;

/** Create graph/mindmap instances and wire them into #view-graph / #view-mindmap.
 *  Called once during initEditor. The instances are lazy-rendered via
 *  window.initGraph / window.initMindmap (triggered by switchView). */
function setupGraphAndMindmap(): void {
  const graphContainer = document.getElementById("view-graph");
  if (graphContainer) {
    graphView = createGraphView(graphContainer, {
      onNodeClick: (id) => { void openWikilinkTarget(id); },
    });
  }
  const mmContainer = document.getElementById("view-mindmap");
  if (mmContainer) {
    mindmapView = createMindmapView(mmContainer, {
      onNodeClick: (line) => { gotoMindmapLine(line); },
    });
  }
}

/** 导图节点点击 → 切回编辑器视图并定位到对应行。 */
function gotoMindmapLine(line: number): void {
  const view = state.view;
  if (!view) return;
  // 切回编辑器视图（switchView 是 index.html 内联脚本的全局函数）。
  const sw = (window as unknown as Record<string, unknown>).switchView;
  if (typeof sw === "function") (sw as (n: string) => void)("editor");
  const ln = Math.max(1, Math.min(line, view.state.doc.lines));
  const lineObj = view.state.doc.line(ln);
  view.dispatch({
    selection: { anchor: lineObj.from },
    scrollIntoView: true,
  } as never);
  view.focus();
}

/** Current note's basename without extension (for graph local mode + backlinks). */
function currentNoteName(): string | undefined {
  const tab = getActiveTab();
  if (!tab || !/\.(md|markdown)$/i.test(tab.name)) return undefined;
  return tab.name.replace(/\.(md|markdown)$/i, "");
}

/** Render the knowledge graph (called by switchView when entering graph view). */
function initGraph(): void {
  if (!graphView) return;
  graphView.render(linkIndex, currentNoteName());
}

/** Render the mindmap from the current document (called by switchView). */
function initMindmap(): void {
  if (!mindmapView) return;
  const md = state.view?.state.doc.toString() ?? "";
  mindmapView.render(md);
}

/** Mount the editor into #editorPane and boot all subsystems. */
export async function initEditor(): Promise<void> {
  try {
    const pane = $("editorPane");
    if (!pane) throw new Error("#editorPane not found");

    // Wire the update callback + extension factory into state BEFORE creating
    // the view, so per-tab states built later share the same compartments.
    state.onUpdate = onDocUpdate;
    state.buildExtensions = buildExtensions;

    const view = createEditorView(pane, 0, onDocUpdate);
    view.dom.style.display = "none";

    setupResizer();
    setupShortcuts();
    setupPasteImage(view);
    installReliableCopy();
    setupEditorContextMenu();
    setupSplitDivider();
    setupGroupActivation();
    setupFileWatcher();
    setupWikilink();
    setupGraphAndMindmap();
    setupAiPanel();
    updateFormatButtons();

    await loadRecents();
    await restoreSession();

    // Hide the loading/empty placeholders appropriately.
    if (state.openTabs.length === 0) {
      $("emptyState").style.display = "flex";
    }
    // Expose window.* handlers (formatJSON, etc.) + __slate for debugging.
    exposeGlobals();
  } catch (err) {
    // FIX #17: init error guard — surface the failure in the editor pane.
    console.error("Slate init failed:", err);
    const pane = $("editorPane");
    if (pane) {
      pane.innerHTML =
        '<div style="padding:40px;color:#f66;font-family:monospace;">' +
        "Slate 编辑器初始化失败:<br>" +
        escapeHtml(String((err as Error).message || err)) +
        "</div>";
    }
  }
}

// ---- Sidebar resizer (ported from editor.js) ----
function setupResizer(): void {
  const resizer = document.getElementById("resizer");
  const sidebar = document.getElementById("sidebar");
  if (!resizer || !sidebar) return;
  let dragging = false;
  let startX = 0;
  let startW = 0;
  resizer.addEventListener("mousedown", (e) => {
    dragging = true;
    startX = e.clientX;
    startW = sidebar.offsetWidth;
    resizer.classList.add("dragging");
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
  function onMove(e: MouseEvent) {
    if (!dragging) return;
    const w = startW + e.clientX - startX;
    if (w >= 140 && w <= 500) sidebar.style.width = w + "px";
  }
  function onUp() {
    dragging = false;
    resizer.classList.remove("dragging");
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  }
}

// ---- Group activation router ----
// Any mousedown inside an editor group (editor, tabs, buttons, empty area)
// makes that group the active one. This ensures toolbar buttons (format /
// preview) operate on the group they belong to, not the previously focused one.
function setupGroupActivation(): void {
  const area = document.getElementById("editorArea");
  if (!area) return;
  area.addEventListener("mousedown", (e) => {
    const grp = (e.target as HTMLElement | null)?.closest(".editor-group") as HTMLElement | null;
    if (!grp) return;
    const gid = grp.dataset.group;
    if (gid !== "0" && gid !== "1") return;
    const g = Number(gid) as 0 | 1;
    if (state.activeGroup !== g) {
      setActiveGroup(g);
      syncPreviewPane();
    }
  }, true);
}

// ---- Export functions to window for index.html onclick handlers ----
/** 测试入口：读 macOS 日历（EventKit）并 toast 展示未来 7 天事件数。 */
export async function testCalendar(): Promise<void> {
  try {
    const data = await readCalendar(7);
    const evs = data.events;
    const rems = data.reminders;
    if (!evs.length && !rems.length) {
      toast("📅 未来 7 天无日历事件 / 提醒事项");
      return;
    }
    const today = evs.filter((e) => e.start.startsWith(new Date().toISOString().slice(0, 10)));
    const lines = [
      `📅 未来 7 天：${evs.length} 个事件 · ${rems.length} 条提醒`,
      ...today.slice(0, 3).map((e) => `  · ${e.start.slice(11, 16)} ${e.title}`),
      ...rems.slice(0, 2).map((r) => `  ☐ ${r.title}`),
    ];
    toast(lines.join("\n"));
    console.log("[cal-bridge] 日历数据:", data);
  } catch (e) {
    toast("📅 读取日历失败: " + (e as Error).message);
    console.error("[cal-bridge] 失败:", e);
  }
}

export function exposeGlobals(): void {
  const w = window as unknown as Record<string, unknown>;
  w.doOpenFolder = doOpenFolder;
  w.doOpenFiles = doOpenFiles;
  w.saveCurrentFile = saveCurrentFile;
  w.doNewFile = doNewFile;
  w.deleteCurrentFile = deleteCurrentFile;
  w.togglePreview = togglePreview;
  w.formatSQL = formatSQL;
  w.formatJSON = formatJSON;
  w.minifyJSON = minifyJSON;
  w.toggleEol = toggleEol;
  w.toggleTheme = toggleTheme;
  // 调试：读 macOS 日历（EventKit）。用法：await readCalendar(7)
  w.readCalendar = readCalendar;
  w.calEventClick = calEventClick;
  w.showCalendar = showCalendar;
  w.calPrevMonth = calPrevMonth;
  w.calNextMonth = calNextMonth;
  w.calGoToday = calGoToday;
  w.calSelectDate = calSelectDate;
  w.calSwitchView = calSwitchView;
  w.calJumpDate = calJumpDate;
  // 测试入口：状态栏 📅 按钮 → 读 macOS 日历并 toast 展示
  w.testCalendar = testCalendar;
  w.toggleSplitView = toggleSplitView;
  w.toggleMinimap = toggleMinimap;
  // 网页转笔记 / 截图转笔记（存到当前文件夹 Clippings/）。
  w.clipWebPage = clipWebPage;
  w.clipScreenshot = clipScreenshot;
  // Wikilink: backlinks panel toggle (overrides index.html stub).
  w.toggleBacklinks = toggleBacklinks;
  // Graph & mindmap: lazy-render hooks called by switchView.
  w.initGraph = initGraph;
  w.initMindmap = initMindmap;
  // AI 助手面板（覆盖 index.html 桩函数）。
  w.toggleAiPanel = toggleAiPanel;
  w.sendAiMessage = sendAiMessage;
  w.newAiSession = newAiSession;
  w.deleteAiSession = deleteAiSession;
  // Expose for debugging.
  w.__slate = state;
  // Debug helper: trigger an in-file search so tests can verify highlight clearing.
  w.setSearch = (q: string) => {
    if (state.view) {
      state.view.dispatch({ effects: setSearchQuery.of(new SearchQuery({ search: q })) });
    }
  };
}

// FIX #22: global error handlers -> toast.
export function setupGlobalErrorHandlers(): void {
  window.addEventListener("error", (e) => {
    console.error("Unhandled error:", e.error || e.message);
    toast("发生错误: " + (e.message || "unknown"), 4000);
  });
  window.addEventListener("unhandledrejection", (e) => {
    console.error("Unhandled promise rejection:", e.reason);
    const msg = e.reason instanceof Error ? e.reason.message : String(e.reason);
    toast("Promise 未捕获: " + msg, 4000);
  });
}

export { EditorView, addTab, switchToTab, renderTree, toast, clearOccurrences };
