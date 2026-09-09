// web/src/editor/graph.ts
// Knowledge-graph view: a vanilla-JS force-directed graph rendered on a
// <canvas>. Consumes the wikilink LinkEntry index produced elsewhere and
// lays notes out with a classic repulsion / spring / gravity simulation.
//
// No framework, no React — just DOM + Canvas 2D. The module exports a small
// factory (createGraphView) returning a GraphView handle that index.ts wires
// into the #view-graph container.

import type { LinkEntry } from "./wikilink";

// ---- Public API (index.ts wires against this exactly) ----

export interface GraphView {
  /** Rebuild graph data from `links` and (re)start the render loop.
   *  Pass `currentFile` (basename, with or without extension) to enable
   *  direction filtering and local mode anchoring. */
  render(links: LinkEntry[], currentFile?: string): void;
  /** Tear down: cancel rAF, detach listeners, disconnect ResizeObserver. */
  destroy(): void;
}

export function createGraphView(
  container: HTMLElement,
  opts?: { onNodeClick?: (nodeId: string) => void }
): GraphView {
  return new GraphViewImpl(container, opts || {});
}

// ---- Internals ----

const MD_EXT_RE = /\.(md|markdown)$/i;

/** Reduce a file name/path to the canonical node id: basename without
 *  .md/.markdown extension. Targets in LinkEntry are already extension-less,
 *  but sources carry ".md"; this normalises both sides. */
function nodeIdOf(name: string): string {
  const base = name.split("/").pop() || name;
  return base.replace(MD_EXT_RE, "");
}

interface GNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Pinned position (while dragging). When non-null the node is fixed at
   *  (fx, fy) and ignores simulation forces. */
  fx: number | null;
  fy: number | null;
}

interface GEdge {
  from: string;
  to: string;
}

type DirFilter = "all" | "outgoing" | "incoming" | "bidirectional";
type Mode = "full" | "local";

// Simulation / visual constants (tuned for a typical <500-node vault).
const LINK_DISTANCE = 90;     // ideal spring length
const SPRING_K = 0.035;       // spring stiffness along edges
const REPEL_K = 2600;         // Coulomb repulsion constant
const GRAVITY_K = 0.025;      // pull toward canvas center
const DAMPING = 0.82;         // velocity decay per tick
const ALPHA_DECAY = 0.985;    // cooling
const ALPHA_MIN = 0.004;      // below this the simulation is "cold"
const MAX_SPEED = 30;         // velocity clamp to avoid blow-ups
const NODE_R = 7;             // draw radius
const HIT_R = 13;             // pointer hit radius (world units)
const CLICK_THRESH = 4;       // px movement under which a press is a "click"

// Colour palette (dark canvas, see editor.css #view-graph bg #3a3a3a).
const COL_BG = "#3a3a3a";
const COL_NODE = "#8ab4f8";
const COL_NODE_CURRENT = "#ffd166";
const COL_NODE_PINNED = "#ffffff";
const COL_EDGE = "rgba(180,180,180,0.45)";
const COL_EDGE_HILITE = "rgba(255,209,102,0.7)";
const COL_LABEL = "#d8d8d8";
const COL_LABEL_DIM = "rgba(216,216,216,0.55)";

class GraphViewImpl implements GraphView {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private empty: HTMLElement;
  private dirSelect: HTMLSelectElement;
  private refreshBtn: HTMLElement;
  private onNodeClick?: (nodeId: string) => void;

  // Graph data (full, unfiltered).
  private allNodes: GNode[] = [];
  private allEdges: GEdge[] = [];
  private nodeById = new Map<string, GNode>();
  /** "from→to" presence set, for bidirectional detection. */
  private edgeSet = new Set<string>();

  // Last inputs (so toolbar actions can re-render).
  private lastLinks: LinkEntry[] = [];
  private lastCurrent?: string;

  // View state.
  private mode: Mode = "full";
  private dir: DirFilter = "all";
  private curId?: string;

  // Camera (world point under canvas centre + zoom).
  private view = { x: 0, y: 0, scale: 1 };

  // Simulation.
  private alpha = 0;
  private rafId: number | null = null;
  private running = false;

  // Pointer interaction.
  private dragging: GNode | null = null;
  private panning = false;
  private downX = 0;
  private downY = 0;
  private downNode: GNode | null = null;
  private lastPx = 0;
  private lastPy = 0;
  private moved = false;

  // Cached visible sets (recomputed per render / filter change).
  private visibleNodes = new Set<string>();
  private visibleEdges: GEdge[] = [];

  // Cleanup registry.
  private cleanups: (() => void)[] = [];
  private ro: ResizeObserver | null = null;
  private destroyed = false;

  constructor(container: HTMLElement, opts: { onNodeClick?: (nodeId: string) => void }) {
    this.container = container;
    this.onNodeClick = opts.onNodeClick;

    const canvas = container.querySelector<HTMLCanvasElement>("#graphCanvas");
    const empty = container.querySelector<HTMLElement>("#graphEmpty");
    const dirSelect = container.querySelector<HTMLSelectElement>("#graphDirFilter");
    const refreshBtn = container.querySelector<HTMLElement>("#graphRefreshBtn");
    if (!canvas || !empty || !dirSelect || !refreshBtn) {
      throw new Error("createGraphView: graph container missing required elements");
    }
    this.canvas = canvas;
    this.empty = empty;
    this.dirSelect = dirSelect;
    this.refreshBtn = refreshBtn;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("createGraphView: 2D context unavailable");
    this.ctx = ctx;

    this.bindToolbar();
    this.bindCanvas();
    this.bindResize();
  }

  // ---- Event wiring ----

  private bindToolbar(): void {
    const modeBtns = this.container.querySelectorAll<HTMLElement>(".graph-mode-btn");
    const onMode = (e: Event) => {
      const btn = e.currentTarget as HTMLElement;
      const m = btn.getAttribute("data-graph-mode") as Mode | null;
      if (!m || m === this.mode) return;
      this.mode = m;
      modeBtns.forEach((b) => b.classList.toggle("active", b === btn));
      this.render(this.lastLinks, this.lastCurrent);
    };
    modeBtns.forEach((b) => {
      b.addEventListener("click", onMode);
      this.cleanups.push(() => b.removeEventListener("click", onMode));
    });

    const onDir = () => {
      this.dir = this.dirSelect.value as DirFilter;
      this.render(this.lastLinks, this.lastCurrent);
    };
    this.dirSelect.addEventListener("change", onDir);
    this.cleanups.push(() => this.dirSelect.removeEventListener("change", onDir));

    const onRefresh = () => {
      // Re-render from cached inputs; reheats the simulation for a fresh layout.
      this.render(this.lastLinks, this.lastCurrent);
    };
    this.refreshBtn.addEventListener("click", onRefresh);
    this.cleanups.push(() => this.refreshBtn.removeEventListener("click", onRefresh));
  }

  private bindCanvas(): void {
    const c = this.canvas;
    const onDown = (e: MouseEvent) => this.onPointerDown(e);
    const onMove = (e: MouseEvent) => this.onPointerMove(e);
    const onUp = (e: MouseEvent) => this.onPointerUp(e);
    const onWheel = (e: WheelEvent) => this.onWheel(e);
    const onDbl = (e: MouseEvent) => this.onDblClick(e);

    c.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    c.addEventListener("wheel", onWheel, { passive: false });
    c.addEventListener("dblclick", onDbl);

    this.cleanups.push(
      () => c.removeEventListener("mousedown", onDown),
      () => window.removeEventListener("mousemove", onMove),
      () => window.removeEventListener("mouseup", onUp),
      () => c.removeEventListener("wheel", onWheel),
      () => c.removeEventListener("dblclick", onDbl)
    );
  }

  private bindResize(): void {
    const resize = () => {
      this.resizeCanvas();
      this.requestRedraw();
    };
    window.addEventListener("resize", resize);
    this.cleanups.push(() => window.removeEventListener("resize", resize));

    if (typeof ResizeObserver !== "undefined") {
      this.ro = new ResizeObserver(resize);
      this.ro.observe(this.container);
    }
  }

  // ---- Sizing / coordinates ----

  private resizeCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = w + "px";
    this.canvas.style.height = h + "px";
  }

  private cssW(): number {
    return this.container.clientWidth || 1;
  }
  private cssH(): number {
    return this.container.clientHeight || 1;
  }

  /** screen (CSS px, canvas-relative) → world coords. */
  private screenToWorld(sx: number, sy: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const px = sx - rect.left;
    const py = sy - rect.top;
    return {
      x: (px - this.cssW() / 2) / this.view.scale + this.view.x,
      y: (py - this.cssH() / 2) / this.view.scale + this.view.y,
    };
  }

  // ---- Render entry (rebuild + restart) ----

  render(links: LinkEntry[], currentFile?: string): void {
    if (this.destroyed) return;
    this.lastLinks = links || [];
    this.lastCurrent = currentFile;
    this.curId = currentFile ? nodeIdOf(currentFile) : undefined;
    this.dir = (this.dirSelect.value as DirFilter) || "all";

    // Build nodes + edges from the link index.
    const ids = new Set<string>();
    const edges: GEdge[] = [];
    const edgeSet = new Set<string>();
    for (const l of this.lastLinks) {
      const from = nodeIdOf(l.source);
      const to = l.target; // already extension-less
      if (!from || !to) continue;
      ids.add(from);
      ids.add(to);
      edges.push({ from, to });
      edgeSet.add(from + "\u0000" + to);
    }
    this.edgeSet = edgeSet;

    // Reuse cached positions across renders (smooth filter/mode switches);
    // new nodes spawn near the centre with a little jitter.
    const prev = this.nodeById;
    const next = new Map<string, GNode>();
    const cx = this.cssW() / 2;
    const cy = this.cssH() / 2;
    for (const id of ids) {
      const old = prev.get(id);
      if (old) {
        next.set(id, old);
      } else {
        const a = Math.random() * Math.PI * 2;
        const r = 40 + Math.random() * 60;
        next.set(id, {
          id,
          x: cx + Math.cos(a) * r,
          y: cy + Math.sin(a) * r,
          vx: 0,
          vy: 0,
          fx: null,
          fy: null,
        });
      }
    }
    this.allNodes = Array.from(next.values());
    this.nodeById = next;
    this.allEdges = edges;

    this.resizeCanvas();
    this.applyVisibility();
    this.reheat();
  }

  // ---- Visibility / filtering ----

  /** Recompute visibleNodes / visibleEdges from mode + dir filter. */
  private applyVisibility(): void {
    const cur = this.curId;
    let nodes = this.allNodes;
    let edges = this.allEdges;

    // Local mode: BFS up to 2 hops from current node (both directions).
    if (this.mode === "local" && cur && this.nodeById.has(cur)) {
      const reach = new Set<string>([cur]);
      const adj = this.buildAdjacency();
      // hop 1
      const frontier = [cur];
      for (let depth = 0; depth < 2; depth++) {
        const next: string[] = [];
        for (const id of frontier) {
          const nbrs = adj.get(id);
          if (!nbrs) continue;
          for (const n of nbrs) {
            if (!reach.has(n)) {
              reach.add(n);
              next.push(n);
            }
          }
        }
        if (!next.length) break;
        frontier.length = 0;
        frontier.push(...next);
      }
      nodes = nodes.filter((n) => reach.has(n.id));
    } else if (this.mode === "local") {
      // No anchor → fall back to full graph.
    }

    // Direction filter (only meaningful with a current node).
    let visEdges: GEdge[];
    const nodeIds = new Set(nodes.map((n) => n.id));
    if (!cur || this.dir === "all") {
      visEdges = edges.filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to));
    } else if (this.dir === "outgoing") {
      visEdges = edges.filter((e) => e.from === cur && nodeIds.has(e.to));
    } else if (this.dir === "incoming") {
      visEdges = edges.filter((e) => e.to === cur && nodeIds.has(e.from));
    } else {
      // bidirectional: keep one edge per mutual pair (from < to).
      visEdges = edges.filter(
        (e) =>
          e.from !== e.to &&
          nodeIds.has(e.from) &&
          nodeIds.has(e.to) &&
          this.edgeSet.has(e.from + "\u0000" + e.to) &&
          this.edgeSet.has(e.to + "\u0000" + e.from) &&
          e.from < e.to
      );
    }

    this.visibleEdges = visEdges;

    // Nodes: show those incident to a visible edge, plus the current node.
    const vis = new Set<string>();
    if (cur && nodeIds.has(cur)) vis.add(cur);
    for (const e of visEdges) {
      vis.add(e.from);
      vis.add(e.to);
    }
    this.visibleNodes = vis;

    this.toggleEmpty();
  }

  private buildAdjacency(): Map<string, Set<string>> {
    const adj = new Map<string, Set<string>>();
    const add = (a: string, b: string) => {
      let s = adj.get(a);
      if (!s) {
        s = new Set();
        adj.set(a, s);
      }
      s.add(b);
    };
    for (const e of this.allEdges) {
      add(e.from, e.to);
      add(e.to, e.from);
    }
    return adj;
  }

  private toggleEmpty(): void {
    const empty = this.visibleNodes.size === 0;
    this.empty.hidden = !empty;
    this.canvas.style.display = empty ? "none" : "block";
  }

  // ---- Simulation ----

  private reheat(): void {
    this.alpha = 1;
    this.requestRedraw();
  }

  private requestRedraw(): void {
    if (!this.running) {
      this.running = true;
      this.rafId = requestAnimationFrame(this.frame);
    }
  }

  private frame = (): void => {
    this.rafId = null;
    if (this.alpha > ALPHA_MIN) {
      this.tick();
      this.alpha *= ALPHA_DECAY;
    }
    this.draw();
    if (this.alpha > ALPHA_MIN || this.dragging || this.panning) {
      this.rafId = requestAnimationFrame(this.frame);
    } else {
      this.running = false;
    }
  };

  private tick(): void {
    const nodes = this.allNodes;
    // Only visible nodes participate in the layout (hidden ones freeze in place).
    const active = nodes.filter((n) => this.visibleNodes.has(n.id));
    const a = this.alpha;
    const cx = this.cssW() / 2;
    const cy = this.cssH() / 2;

    // Repulsion (all pairs among active nodes).
    for (let i = 0; i < active.length; i++) {
      const ni = active[i];
      for (let j = i + 1; j < active.length; j++) {
        const nj = active[j];
        let dx = ni.x - nj.x;
        let dy = ni.y - nj.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 0.01) {
          // Coincident: nudge apart deterministically.
          dx = (i - j) * 0.5 + 0.01;
          dy = (j - i) * 0.5 + 0.01;
          d2 = dx * dx + dy * dy;
        }
        const d = Math.sqrt(d2);
        const f = (REPEL_K / d2) * a;
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        ni.vx += fx;
        ni.vy += fy;
        nj.vx -= fx;
        nj.vy -= fy;
      }
    }

    // Spring attraction along visible edges.
    for (const e of this.visibleEdges) {
      const na = this.nodeById.get(e.from);
      const nb = this.nodeById.get(e.to);
      if (!na || !nb) continue;
      let dx = nb.x - na.x;
      let dy = nb.y - na.y;
      let d = Math.sqrt(dx * dx + dy * dy);
      if (d < 0.01) {
        d = 0.01;
        dx = 0.01;
        dy = 0;
      }
      const f = (d - LINK_DISTANCE) * SPRING_K * a;
      const fx = (dx / d) * f;
      const fy = (dy / d) * f;
      na.vx += fx;
      na.vy += fy;
      nb.vx -= fx;
      nb.vy -= fy;
    }

    // Center gravity + integrate.
    for (const n of active) {
      if (n.fx !== null) {
        // Pinned: snap to pin, carry velocity from pin motion (set in drag).
        n.x = n.fx;
        n.y = n.fy;
        continue;
      }
      n.vx += (cx - n.x) * GRAVITY_K * a;
      n.vy += (cy - n.y) * GRAVITY_K * a;
      n.vx *= DAMPING;
      n.vy *= DAMPING;
      // Clamp speed.
      const sp = Math.hypot(n.vx, n.vy);
      if (sp > MAX_SPEED) {
        n.vx = (n.vx / sp) * MAX_SPEED;
        n.vy = (n.vy / sp) * MAX_SPEED;
      }
      n.x += n.vx;
      n.y += n.vy;
    }
  }

  // ---- Drawing ----

  private draw(): void {
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const w = this.cssW();
    const h = this.cssH();
    if (w === 0 || h === 0) return;

    // (Re)size backing store if it drifted (e.g. after show).
    if (this.canvas.width !== Math.floor(w * dpr) || this.canvas.height !== Math.floor(h * dpr)) {
      this.resizeCanvas();
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = COL_BG;
    ctx.fillRect(0, 0, w, h);

    if (this.visibleNodes.size === 0) return;

    // World transform: translate to centre, scale, translate by camera.
    ctx.translate(w / 2, h / 2);
    ctx.scale(this.view.scale, this.view.scale);
    ctx.translate(-this.view.x, -this.view.y);

    // Edges.
    ctx.lineWidth = 1 / this.view.scale;
    ctx.strokeStyle = COL_EDGE;
    ctx.beginPath();
    for (const e of this.visibleEdges) {
      const a = this.nodeById.get(e.from);
      const b = this.nodeById.get(e.to);
      if (!a || !b) continue;
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();

    // Highlight edges touching the current node.
    if (this.curId) {
      ctx.strokeStyle = COL_EDGE_HILITE;
      ctx.lineWidth = 1.6 / this.view.scale;
      ctx.beginPath();
      for (const e of this.visibleEdges) {
        if (e.from !== this.curId && e.to !== this.curId) continue;
        const a = this.nodeById.get(e.from);
        const b = this.nodeById.get(e.to);
        if (!a || !b) continue;
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();
    }

    // Nodes.
    for (const n of this.allNodes) {
      if (!this.visibleNodes.has(n.id)) continue;
      const isCur = n.id === this.curId;
      const isPinned = n.fx !== null;
      ctx.fillStyle = isPinned ? COL_NODE_PINNED : isCur ? COL_NODE_CURRENT : COL_NODE;
      ctx.beginPath();
      ctx.arc(n.x, n.y, NODE_R / this.view.scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Labels (constant size, in screen space).
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    const fs = 12;
    ctx.font = fs + "px -apple-system, system-ui, sans-serif";
    for (const n of this.allNodes) {
      if (!this.visibleNodes.has(n.id)) continue;
      const sx = (n.x - this.view.x) * this.view.scale + w / 2;
      const sy = (n.y - this.view.y) * this.view.scale + h / 2;
      const isCur = n.id === this.curId;
      ctx.fillStyle = isCur ? COL_NODE_CURRENT : COL_LABEL;
      const label = n.id;
      const tx = sx + (NODE_R + 3);
      // Dim text that would render off-screen, and clip very long labels.
      const max = 120;
      const text = label.length > 22 ? label.slice(0, 21) + "…" : label;
      ctx.fillText(text, tx, sy, max);
      void max;
    }
  }

  // ---- Pointer interaction ----

  private pickNode(sx: number, sy: number): GNode | null {
    const w = this.screenToWorld(sx, sy);
    let best: GNode | null = null;
    let bestD = HIT_R / this.view.scale;
    bestD *= bestD;
    for (const n of this.allNodes) {
      if (!this.visibleNodes.has(n.id)) continue;
      const dx = n.x - w.x;
      const dy = n.y - w.y;
      const d2 = dx * dx + dy * dy;
      if (d2 <= bestD) {
        bestD = d2;
        best = n;
      }
    }
    return best;
  }

  private onPointerDown(e: MouseEvent): void {
    if (this.visibleNodes.size === 0) return;
    const node = this.pickNode(e.clientX, e.clientY);
    this.downX = e.clientX;
    this.downY = e.clientY;
    this.lastPx = e.clientX;
    this.lastPy = e.clientY;
    this.moved = false;
    if (node) {
      this.dragging = node;
      this.downNode = node;
      const w = this.screenToWorld(e.clientX, e.clientY);
      node.fx = w.x;
      node.fy = w.y;
      node.vx = 0;
      node.vy = 0;
      this.reheat();
    } else {
      this.panning = true;
      this.downNode = null;
    }
  }

  private onPointerMove(e: MouseEvent): void {
    if (this.dragging) {
      const dx = e.clientX - this.lastPx;
      const dy = e.clientY - this.lastPy;
      if (Math.abs(e.clientX - this.downX) > 2 || Math.abs(e.clientY - this.downY) > 2) {
        this.moved = true;
      }
      const w = this.screenToWorld(e.clientX, e.clientY);
      // Preserve a velocity from pointer motion so release "keeps" momentum.
      this.dragging.vx = dx / this.view.scale;
      this.dragging.vy = dy / this.view.scale;
      this.dragging.fx = w.x;
      this.dragging.fy = w.y;
      this.lastPx = e.clientX;
      this.lastPy = e.clientY;
      this.requestRedraw();
    } else if (this.panning) {
      if (Math.abs(e.clientX - this.downX) > 2 || Math.abs(e.clientY - this.downY) > 2) {
        this.moved = true;
      }
      const dx = e.clientX - this.lastPx;
      const dy = e.clientY - this.lastPy;
      this.view.x -= dx / this.view.scale;
      this.view.y -= dy / this.view.scale;
      this.lastPx = e.clientX;
      this.lastPy = e.clientY;
      this.requestRedraw();
    }
  }

  private onPointerUp(e: MouseEvent): void {
    const wasDragging = this.dragging;
    const wasNode = this.downNode;
    if (wasDragging) {
      // Release pin: let it float again, keep the velocity we accumulated.
      wasDragging.fx = null;
      wasDragging.fy = null;
      this.alpha = Math.max(this.alpha, 0.3); // gentle reheat to settle
      this.requestRedraw();
    }
    this.dragging = null;
    this.panning = false;

    // Click detection: small movement on a node → navigate.
    const dx = e.clientX - this.downX;
    const dy = e.clientY - this.downY;
    if (wasNode && Math.hypot(dx, dy) < CLICK_THRESH && this.onNodeClick) {
      this.onNodeClick(wasNode.id);
    }
    this.downNode = null;
  }

  private onWheel(e: WheelEvent): void {
    if (this.visibleNodes.size === 0) return;
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.0015);
    const newScale = Math.min(4, Math.max(0.15, this.view.scale * factor));
    // Zoom around the cursor: keep the world point under the mouse fixed.
    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const wx = (px - this.cssW() / 2) / this.view.scale + this.view.x;
    const wy = (py - this.cssH() / 2) / this.view.scale + this.view.y;
    this.view.scale = newScale;
    this.view.x = wx - (px - this.cssW() / 2) / newScale;
    this.view.y = wy - (py - this.cssH() / 2) / newScale;
    this.requestRedraw();
  }

  private onDblClick(e: MouseEvent): void {
    // Double-click a node → also navigate (convenient on trackpads).
    const node = this.pickNode(e.clientX, e.clientY);
    if (node && this.onNodeClick) {
      this.onNodeClick(node.id);
    }
  }

  // ---- Teardown ----

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.running = false;
    if (this.ro) {
      this.ro.disconnect();
      this.ro = null;
    }
    for (const fn of this.cleanups) {
      try {
        fn();
      } catch {
        /* ignore */
      }
    }
    this.cleanups = [];
    this.allNodes = [];
    this.allEdges = [];
    this.nodeById.clear();
    this.visibleNodes.clear();
    this.visibleEdges = [];
  }
}
