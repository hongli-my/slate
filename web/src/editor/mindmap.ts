// web/src/editor/mindmap.ts
// 思维导图视图模块 — 基于 markmap 渲染 Markdown 标题/列表层级为导图。
// markmap-view 仅支持从左到右的树状布局（tree-right），布局 select 中的
// tree-down/radial/organic 为预留 UI，选中时回退到 tree-right 并提示。

import { Transformer } from "markmap-lib/no-plugins";
import { Markmap } from "markmap-view";
import type { IPureNode } from "markmap-common";
import { toast } from "./ui";

export interface MindmapView {
  /** 解析 markdown 并渲染导图（每次重新 transform + setData + fit）。 */
  render(markdown: string): void;
  /** 销毁 markmap 实例、解绑工具栏事件与 ResizeObserver。 */
  destroy(): void;
}

// markmap 默认 options（CSS 内联 embedGlobalCSS，离线可用）。
const MM_OPTIONS = {
  duration: 300,
  initialExpandLevel: -1,
  zoom: true,
  pan: true,
  embedGlobalCSS: true,
  fitRatio: 0.95,
  maxInitialScale: 2,
};

// 模块级 Transformer 单例（缓存复用，避免每次 render 重建 markdown-it 实例）。
let transformer: Transformer | null = null;
function getTransformer(): Transformer {
  if (!transformer) transformer = new Transformer();
  return transformer;
}

/** 去除围栏代码块（``` 或 ~~~），避免代码内容干扰标题/列表层级解析。 */
function stripFencedCode(md: string): string {
  return md.replace(/^[ \t]*(```|~~~)[^\n]*\n[\s\S]*?^[ \t]*\1[ \t]*$/gm, "");
}

/** 解析后的 root 是否为空（无内容且无子节点）。 */
function isEmptyRoot(root: IPureNode): boolean {
  const noContent = !root.content || root.content.trim() === "";
  const noChildren = !root.children || root.children.length === 0;
  return noContent && noChildren;
}

/** 从 d3 应用在 g 元素上的 transform 字符串中读取当前 scale。 */
function readScale(transformAttr: string | null): number | null {
  if (!transformAttr) return null;
  const m = /scale\(([\d.]+)\)/.exec(transformAttr);
  return m ? parseFloat(m[1]) : null;
}

export function createMindmapView(container: HTMLElement): MindmapView {
  const svg = container.querySelector<SVGSVGElement>("#mindmapSvg");
  const emptyEl = container.querySelector<HTMLElement>("#mindmapEmpty");
  const layoutSelect = container.querySelector<HTMLSelectElement>("#mindmapLayout");
  const zoomInBtn = container.querySelector<HTMLElement>("#mmZoomIn");
  const zoomOutBtn = container.querySelector<HTMLElement>("#mmZoomOut");
  const fitBtn = container.querySelector<HTMLElement>("#mmFit");

  // 深色主题：markmap globalCSS 中 `.markmap-dark .markmap` 变量需作用在 svg 祖先上。
  container.classList.add("markmap-dark");

  let mm: Markmap | null = null;
  let currentScale = 1;

  /** 设置 svg 尺寸跟随容器。 */
  function resizeSvg(): void {
    if (!svg) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w > 0 && h > 0) {
      svg.setAttribute("width", String(w));
      svg.setAttribute("height", String(h));
    }
  }

  /** 同步 currentScale 到 markmap 实际渲染的 scale（fit 之后调用）。 */
  function syncScale(): void {
    if (!mm) return;
    const s = readScale(mm.g.attr("transform"));
    if (s != null && Number.isFinite(s)) currentScale = s;
  }

  function showEmpty(show: boolean): void {
    if (emptyEl) emptyEl.hidden = !show;
    if (svg) svg.style.display = show ? "none" : "";
  }

  // ===== 工具栏事件 =====
  const onZoomIn = () => {
    if (!mm) return;
    currentScale = currentScale * 1.25;
    mm.rescale(currentScale);
  };
  const onZoomOut = () => {
    if (!mm) return;
    currentScale = currentScale * 0.8;
    mm.rescale(currentScale);
  };
  const onFit = () => {
    if (!mm) return;
    mm.fit().then(syncScale, () => {});
  };
  const onLayoutChange = () => {
    const v = layoutSelect?.value ?? "tree-right";
    if (v !== "tree-right") {
      // markmap 仅支持 tree-right，回退渲染并提示。
      toast("markmap 仅支持树状（向右）布局");
      console.warn(`[mindmap] layout "${v}" not supported, falling back to tree-right`);
    }
  };

  zoomInBtn?.addEventListener("click", onZoomIn);
  zoomOutBtn?.addEventListener("click", onZoomOut);
  fitBtn?.addEventListener("click", onFit);
  layoutSelect?.addEventListener("change", onLayoutChange);

  // ===== 尺寸响应 =====
  let rafId = 0;
  const ro = new ResizeObserver(() => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      resizeSvg();
    });
  });
  ro.observe(container);
  resizeSvg();

  // ===== render =====
  function render(markdown: string): void {
    if (!svg) return;
    const cleaned = stripFencedCode(markdown ?? "").trim();
    if (!cleaned) {
      showEmpty(true);
      return;
    }
    const { root } = getTransformer().transform(cleaned);
    if (!root || isEmptyRoot(root)) {
      showEmpty(true);
      return;
    }
    showEmpty(false);
    resizeSvg();
    if (!mm) {
      mm = Markmap.create(svg, MM_OPTIONS, root);
      // 创建后 fit 一次并同步 scale。
      mm.fit().then(syncScale, () => {});
    } else {
      mm.setData(root).then(() => {
        mm?.fit().then(syncScale, () => {});
      }, () => {});
    }
  }

  function destroy(): void {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    ro.disconnect();
    zoomInBtn?.removeEventListener("click", onZoomIn);
    zoomOutBtn?.removeEventListener("click", onZoomOut);
    fitBtn?.removeEventListener("click", onFit);
    layoutSelect?.removeEventListener("change", onLayoutChange);
    try {
      mm?.destroy();
    } catch (e) {
      console.warn("[mindmap] destroy failed", e);
    }
    mm = null;
    container.classList.remove("markmap-dark");
  }

  return { render, destroy };
}
