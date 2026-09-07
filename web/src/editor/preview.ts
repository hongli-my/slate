// web/src/editor/preview.ts
// Markdown preview using marked + highlight.js (core + selective language
// registration to keep the bundle small). FIX #5: 300ms render debounce.
// Post-processes code blocks with copy buttons + heading fold (ported).

import { marked } from "marked";
import hljs from "highlight.js/lib/core";
import { state, getActiveTab, getActiveView, groupElId } from "./state";
import { $ } from "./ui";

// Register ~20 common languages (FIX: bundle shrink from 2.9MB -> ~700KB).
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import go from "highlight.js/lib/languages/go";
import rust from "highlight.js/lib/languages/rust";
import java from "highlight.js/lib/languages/java";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import sql from "highlight.js/lib/languages/sql";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import shell from "highlight.js/lib/languages/shell";
import yaml from "highlight.js/lib/languages/yaml";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import markdown from "highlight.js/lib/languages/markdown";
import php from "highlight.js/lib/languages/php";
import ruby from "highlight.js/lib/languages/ruby";
import lua from "highlight.js/lib/languages/lua";
import diff from "highlight.js/lib/languages/diff";
import plaintext from "highlight.js/lib/languages/plaintext";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("go", go);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("java", java);
hljs.registerLanguage("c", c);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("shell", shell);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("php", php);
hljs.registerLanguage("ruby", ruby);
hljs.registerLanguage("lua", lua);
hljs.registerLanguage("diff", diff);
hljs.registerLanguage("plaintext", plaintext);

let markedConfigured = false;
function ensureMarked(): void {
  if (markedConfigured) return;
  markedConfigured = true;
  marked.setOptions({
    gfm: true,
    breaks: true,
  });
}

export function isMarkdownFile(): boolean {
  const tab = getActiveTab();
  return !!tab && /\.(md|markdown)$/i.test(tab.name);
}

export function isSQLFile(): boolean {
  const tab = getActiveTab();
  return !!tab && /\.sql$/i.test(tab.name);
}

export function isJsonFile(): boolean {
  const tab = getActiveTab();
  return !!tab && /\.json$/i.test(tab.name);
}

export function updateFormatButtons(groupId?: 0 | 1): void {
  // Per-group: each group's toolbar buttons reflect THAT group's active tab
  // (not the global active group), so both panes show the right actions.
  const groups: (0 | 1)[] = groupId != null ? [groupId] : [0, 1];
  for (const gi of groups) {
    const g = state.groups[gi];
    const tab = g.tabs.find((t) => t.id === g.activeTabId) ?? null;
    const showFmt = tab ? /\.(sql)$/i.test(tab.name) : false;
    const showJson = tab ? /\.(json)$/i.test(tab.name) : false;
    const showPreview = tab ? /\.(md|markdown)$/i.test(tab.name) : false;
    const fmt = document.getElementById(groupElId("btnFormat", gi));
    const fmtJ = document.getElementById(groupElId("btnFormatJson", gi));
    const minJ = document.getElementById(groupElId("btnMinifyJson", gi));
    const pv = document.getElementById(groupElId("btnPreviewFloat", gi));
    if (fmt) fmt.style.display = showFmt ? "block" : "none";
    if (fmtJ) fmtJ.style.display = showJson ? "block" : "none";
    if (minJ) minJ.style.display = showJson ? "block" : "none";
    if (pv) pv.style.display = showPreview ? "block" : "none";
  }
  // Keep preview button labels in sync with the global preview state.
  updatePreviewButton();
}

/** Sync each group's preview button label/class with the global previewVisible
 *  state. Only the active group shows the "编辑" (editing) label; the inactive
 *  group resets to "预览". Called on preview toggle and on group/focus switch. */
export function updatePreviewButton(): void {
  for (const gi of [0, 1] as const) {
    const btn = document.getElementById(groupElId("btnPreviewFloat", gi));
    if (!btn) continue;
    if (gi === state.activeGroup && state.previewVisible) {
      btn.classList.add("active");
      btn.innerHTML = "&#9998; 编辑";
    } else {
      btn.classList.remove("active");
      btn.innerHTML = "&#128065; 预览";
    }
  }
}

let mdTimer: ReturnType<typeof setTimeout> | null = null;
export function scheduleMdRender(): void {
  if (mdTimer) clearTimeout(mdTimer);
  mdTimer = setTimeout(() => {
    mdTimer = null;
    renderMarkdownPreview();
  }, 300); // FIX #5: 300ms debounce (was 120ms)
}

export function refreshPreviewIfVisible(): void {
  if (!state.previewVisible) return;
  syncPreviewPane();
}

/** Ensure only the active group's preview pane is visible (when previewVisible),
 *  and render its content. Hides the other group's pane. Called on tab/group
 *  switches and focus changes so the preview always follows the active editor. */
export function syncPreviewPane(): void {
  for (const gi of [0, 1] as const) {
    const p = $(groupElId("previewPane", gi));
    if (p) p.style.display = "none";
  }
  if (!state.previewVisible) return;
  const pane = $(groupElId("previewPane", state.activeGroup));
  if (!pane) return;
  if (isMarkdownFile()) {
    renderMarkdownPreview();
  } else {
    // 非 Markdown：隐藏 TOC，内容区显示提示。
    const { content: mdContent, toc } = ensurePreviewLayout(pane);
    toc.style.display = "none";
    mdContent.innerHTML = '<div style="padding:40px;text-align:center;color:#666;">预览仅支持 Markdown 文件</div>';
  }
  // pane 永远用 flex：.md-content flex:1 占满 + 可滚动，.md-toc 由 buildToc
  // 控制显隐（无标题或非 md 时 display:none，content 自动占满）。
  // 之前用 display:block 会导致 .md-content 的 flex:1 失效，高度变成 auto，
  // 内容被 pane 的 overflow:hidden 裁剪且无法滚动。
  pane.style.display = "flex";
  updatePreviewButton();
}

/** Ensure the preview pane has the .md-content + .md-toc child structure.
 *  Creates them once (idempotent) so re-renders just update innerHTML. */
function ensurePreviewLayout(pane: HTMLElement): { content: HTMLElement; toc: HTMLElement } {
  let content = pane.querySelector<HTMLElement>(".md-content");
  let toc = pane.querySelector<HTMLElement>(".md-toc");
  if (!content || !toc) {
    pane.innerHTML = "";
    if (!content) {
      content = document.createElement("div");
      content.className = "md-content";
      pane.appendChild(content);
    }
    if (!toc) {
      toc = document.createElement("div");
      toc.className = "md-toc";
      pane.appendChild(toc);
    }
  }
  return { content, toc };
}

/** Build the right-side TOC from headings. Each heading gets an id so TOC
 *  items can scrollIntoView it. Indent by heading level. */
function buildToc(container: HTMLElement, tocEl: HTMLElement): void {
  const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
  tocEl.innerHTML = "";
  if (headings.length === 0) {
    tocEl.style.display = "none";
    return;
  }
  tocEl.style.display = "";
  const title = document.createElement("div");
  title.className = "md-toc-title";
  title.textContent = "大纲";
  tocEl.appendChild(title);
  headings.forEach((h, i) => {
    const level = parseInt(h.tagName[1], 10);
    const id = "md-heading-" + i;
    (h as HTMLElement).id = id;
    const item = document.createElement("div");
    item.className = "md-toc-item";
    item.style.paddingLeft = ((level - 1) * 12) + "px";
    item.textContent = h.textContent || "";
    item.title = h.textContent || "";
    item.onclick = () => {
      const target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      tocEl.querySelectorAll(".md-toc-item").forEach((el) => el.classList.remove("active"));
      item.classList.add("active");
    };
    tocEl.appendChild(item);
  });
}

function renderMarkdownPreview(): void {
  const pane = $(groupElId("previewPane", state.activeGroup));
  if (!pane || !state.previewVisible) return;
  const view = getActiveView();
  if (!view) return;
  const content = view.state.doc.toString();
  ensureMarked();
  const { content: mdContent, toc } = ensurePreviewLayout(pane);
  try {
    // marked v18 dropped the `highlight` option, so render plain HTML then
    // highlight each <pre><code> block with hljs.highlightElement (robust).
    const html = marked.parse(content) as string;
    mdContent.innerHTML = html;
    // Build TOC from headings (adds ids for scroll-to). Must run BEFORE
    // addHeadingFold, which rewrites heading innerHTML but preserves the id.
    buildToc(mdContent, toc);
    // On very large markdown docs, hljs.highlightElement on every code block
    // can block the main thread for hundreds of ms. Cap to the first 200
    // blocks; the rest render as plain (still readable) code.
    const HIGHLIGHT_LIMIT = 200;
    let highlighted = 0;
    mdContent.querySelectorAll("pre code").forEach((el) => {
      const codeEl = el as HTMLElement;
      if (highlighted >= HIGHLIGHT_LIMIT) return;
      // marked emits class="language-xxx"; use it to pick the language.
      const langClass = Array.from(codeEl.classList).find((c) => c.startsWith("language-"));
      const lang = langClass ? langClass.slice("language-".length) : "";
      try {
        if (lang && hljs.getLanguage(lang)) {
          codeEl.innerHTML = hljs.highlight(codeEl.textContent || "", { language: lang }).value;
        } else {
          const res = hljs.highlightAuto(codeEl.textContent || "");
          codeEl.innerHTML = res.value;
        }
        codeEl.classList.add("hljs");
      } catch {
        /* leave as-is */
      }
      highlighted++;
    });
    addCodeCopyButtons(mdContent);
    addHeadingFold(mdContent);
  } catch {
    mdContent.innerHTML = '<p style="color:#f44;">渲染失败</p>';
    toc.innerHTML = "";
  }
}

function addCodeCopyButtons(container: HTMLElement): void {
  const pres = container.querySelectorAll("pre");
  pres.forEach((pre) => {
    const btn = document.createElement("button");
    btn.className = "code-copy-btn";
    btn.textContent = "复制";
    btn.onclick = (e) => {
      e.stopPropagation();
      const code = pre.querySelector("code");
      const text = code ? code.textContent || "" : pre.textContent || "";
      navigator.clipboard
        .writeText(text)
        .then(() => {
          btn.textContent = "已复制";
          btn.classList.add("copied");
          setTimeout(() => {
            btn.textContent = "复制";
            btn.classList.remove("copied");
          }, 1500);
        })
        .catch(() => {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          btn.textContent = "已复制";
          btn.classList.add("copied");
          setTimeout(() => {
            btn.textContent = "复制";
            btn.classList.remove("copied");
          }, 1500);
        });
    };
    (pre as HTMLElement).style.position = "relative";
    pre.appendChild(btn);
  });
}

function addHeadingFold(container: HTMLElement): void {
  const children = Array.from(container.childNodes);
  const headingTags = new Set(["H1", "H2", "H3", "H4", "H5", "H6"]);
  const headings: { node: HTMLElement; level: number }[] = [];
  children.forEach((node) => {
    if (node.nodeType === 1 && headingTags.has((node as HTMLElement).tagName)) {
      headings.push({ node: node as HTMLElement, level: parseInt((node as HTMLElement).tagName[1], 10) });
    }
  });
  if (headings.length === 0) return;
  for (let i = headings.length - 1; i >= 0; i--) {
    const h = headings[i];
    const hNode = h.node;
    const hLevel = h.level;
    const sectionContent: Node[] = [];
    let next = hNode.nextSibling;
    while (next) {
      if (next.nodeType === 1 && headingTags.has((next as HTMLElement).tagName)) {
        if (parseInt((next as HTMLElement).tagName[1], 10) <= hLevel) break;
      }
      sectionContent.push(next);
      next = next.nextSibling;
    }
    if (sectionContent.length === 0) continue;
    const section = document.createElement("div");
    section.className = "md-section";
    sectionContent.forEach((n) => section.appendChild(n));
    hNode.after(section);
    const arrow = document.createElement("span");
    arrow.className = "md-fold-arrow";
    arrow.textContent = "\u25BC";
    const titleText = hNode.innerHTML;
    hNode.innerHTML = "";
    hNode.className = "md-heading";
    hNode.appendChild(arrow);
    const textSpan = document.createElement("span");
    textSpan.innerHTML = titleText;
    hNode.appendChild(textSpan);
    hNode.onclick = () => {
      const collapsed = section.classList.toggle("collapsed");
      arrow.classList.toggle("collapsed", collapsed);
    };
  }
}

export function togglePreview(): void {
  state.previewVisible = !state.previewVisible;
  if (state.previewVisible) {
    syncPreviewPane();
    const mm = document.getElementById("minimap");
    if (mm) mm.classList.remove("visible");
  } else {
    // Hide all preview panes.
    for (const gi of [0, 1] as const) {
      const p = $(groupElId("previewPane", gi));
      if (p) p.style.display = "none";
    }
    const mm = document.getElementById("minimap");
    if (mm && state.minimapOn) mm.classList.add("visible");
  }
  updatePreviewButton();
}

/** 退出预览模式（切到非 markdown 文件时自动调用，避免预览 pane 遮挡编辑器）。 */
export function exitPreview(): void {
  if (!state.previewVisible) return;
  state.previewVisible = false;
  for (const gi of [0, 1] as const) {
    const p = $(groupElId("previewPane", gi));
    if (p) p.style.display = "none";
  }
  const mm = document.getElementById("minimap");
  if (mm && state.minimapOn) mm.classList.add("visible");
  updatePreviewButton();
}

/** Exported to allow paste-image handler to trigger preview refresh. */
export function _refreshMd(): void {
  if (state.previewVisible && isMarkdownFile()) scheduleMdRender();
}
