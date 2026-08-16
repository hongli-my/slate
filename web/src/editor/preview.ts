// web/src/editor/preview.ts
// Markdown preview using marked + highlight.js (core + selective language
// registration to keep the bundle small). FIX #5: 300ms render debounce.
// Post-processes code blocks with copy buttons + heading fold (ported).

import { marked } from "marked";
import hljs from "highlight.js/lib/core";
import { state, getActiveTab } from "./state";
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

export function updateFormatButtons(): void {
  const tab = getActiveTab();
  const showFmt = tab ? isSQLFile() : false;
  const showJson = tab ? isJsonFile() : false;
  const showPreview = tab ? isMarkdownFile() : false;
  const fmt = document.getElementById("btnFormat");
  const fmtJ = document.getElementById("btnFormatJson");
  const pv = document.getElementById("btnPreviewFloat");
  if (fmt) fmt.style.display = showFmt ? "block" : "none";
  if (fmtJ) fmtJ.style.display = showJson ? "block" : "none";
  if (pv) pv.style.display = showPreview ? "block" : "none";
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
  if (isMarkdownFile()) renderMarkdownPreview();
  else {
    const pane = $("previewPane");
    if (pane) pane.innerHTML = '<div style="padding:40px;text-align:center;color:#666;">预览仅支持 Markdown 文件</div>';
  }
}

function renderMarkdownPreview(): void {
  const pane = $("previewPane");
  if (!pane || !state.previewVisible) return;
  const view = state.view;
  if (!view) return;
  const content = view.state.doc.toString();
  ensureMarked();
  try {
    // marked v18 dropped the `highlight` option, so render plain HTML then
    // highlight each <pre><code> block with hljs.highlightElement (robust).
    const html = marked.parse(content) as string;
    pane.innerHTML = html;
    pane.querySelectorAll("pre code").forEach((el) => {
      const codeEl = el as HTMLElement;
      // marked emits class="language-xxx"; use it to pick the language.
      const langClass = Array.from(codeEl.classList).find((c) => c.startsWith("language-"));
      const lang = langClass ? langClass.slice("language-".length) : "";
      try {
        if (lang && hljs.getLanguage(lang)) {
          codeEl.textContent = hljs.highlight(codeEl.textContent || "", { language: lang }).value;
        } else {
          const res = hljs.highlightAuto(codeEl.textContent || "");
          codeEl.textContent = res.value;
        }
        codeEl.classList.add("hljs");
      } catch {
        /* leave as-is */
      }
    });
    addCodeCopyButtons(pane);
    addHeadingFold(pane);
  } catch {
    pane.innerHTML = '<p style="color:#f44;">渲染失败</p>';
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
  const pane = $("previewPane");
  const btn = document.getElementById("btnPreviewFloat");
  if (state.previewVisible) {
    if (isMarkdownFile()) renderMarkdownPreview();
    else pane.innerHTML = '<div style="padding:40px;text-align:center;color:#666;">预览仅支持 Markdown 文件</div>';
    pane.style.display = "block";
    if (btn) {
      btn.classList.add("active");
      btn.innerHTML = "&#9998; 编辑";
    }
    const mm = document.getElementById("minimap");
    if (mm) mm.classList.remove("visible");
  } else {
    pane.style.display = "none";
    if (btn) {
      btn.classList.remove("active");
      btn.innerHTML = "&#128065; 预览";
    }
    const mm = document.getElementById("minimap");
    if (mm && state.minimapOn) mm.classList.add("visible");
  }
}

/** Exported to allow paste-image handler to trigger preview refresh. */
export function _refreshMd(): void {
  if (state.previewVisible && isMarkdownFile()) scheduleMdRender();
}
