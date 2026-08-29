// web/src/editor/filetree.ts
// Virtualized file tree.
//
// The old renderer built one DOM node per file and wiped+rebuilt the whole
// tree on every expand / collapse / tab switch — 5000 files meant 5000 sync
// nodes and a jank on every interaction. This version flattens the visible
// (expanded) tree into a row array and only renders the rows inside the
// scroll viewport, so cost is O(viewport) not O(tree).
//
// `renderTree()` rebuilds structure (folder switch, unsaved add/remove);
// `updateTreeSelection()` only re-highlights the active file (tab switch) and
// is O(viewport) too.

import { state, getActiveTab, type TreeNode, basename } from "./state";
import { $ } from "./ui";
import { openScannedFile } from "./files";
import { switchToTab } from "./tabs";
import { getFileIcon } from "./icons";

const ROW_H = 24; // px — must match `.tree-vrow { height }` in editor.css
const BUFFER = 8; // extra rows rendered above/below the viewport

type RowKind = "header" | "unsaved" | "file" | "dir";

interface VRow {
  idx: number;
  kind: RowKind;
  depth: number;
  label: string;
  icon: string;
  /** file rel-path or unsaved tab.path — used for selection highlight. */
  path?: string;
  tabId?: number; // unsaved
  node?: TreeNode; // dir / file (for expand / open)
}

let visibleRows: VRow[] = [];
let scrollHandlerAttached = false;

export function buildTree(
  files: { name: string; path: string; absPath: string }[],
  rootName: string
): TreeNode {
  const root: TreeNode = { name: rootName, type: "dir", children: [], expanded: true };
  for (const f of files) {
    const parts = f.path.split("/");
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      let child = node.children!.find((c) => c.type === "dir" && c.name === parts[i]);
      if (!child) {
        child = { name: parts[i], type: "dir", children: [], expanded: false };
        node.children!.push(child);
      }
      node = child;
    }
    node.children!.push({ name: f.name, type: "file", fileRef: f });
  }
  sortTree(root);
  return root;
}

function sortTree(node: TreeNode): void {
  if (!node.children) return;
  node.children.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  for (const c of node.children) if (c.type === "dir") sortTree(c);
}

/** Full structural rebuild: wipe + recompute + render viewport. Use when the
 *  set of rows changes (folder opened, unsaved added/removed, refresh). */
export function renderTree(): void {
  const el = $("fileTree");
  const savedScroll = el.scrollTop;
  el.innerHTML = "";
  visibleRows = computeVisibleRows();
  if (visibleRows.length === 0) {
    el.innerHTML =
      '<div style="padding:20px;text-align:center;color:#888;font-size:13px;">点击上方按钮打开文件夹</div>';
    return;
  }
  const content = document.createElement("div");
  content.className = "tree-content";
  content.style.position = "relative";
  content.style.height = visibleRows.length * ROW_H + "px";
  el.appendChild(content);
  // Restore scroll AFTER the content has a height, otherwise it clamps to 0.
  el.scrollTop = savedScroll;
  renderViewport();
  attachScrollHandler(el);
}

/** Recompute rows + viewport height without resetting scroll. Use after an
 *  expand/collapse toggle (row set changes but the user's scroll position
 *  should be preserved). */
function refreshStructure(): void {
  const el = $("fileTree");
  const content = el.querySelector(".tree-content") as HTMLElement | null;
  visibleRows = computeVisibleRows();
  if (content) content.style.height = visibleRows.length * ROW_H + "px";
  renderViewport();
}

/** Re-render only the viewport, applying the current active-tab selection.
 *  O(viewport). Use on tab switch instead of a full renderTree. */
export function updateTreeSelection(): void {
  renderViewport();
}

function attachScrollHandler(el: HTMLElement): void {
  if (scrollHandlerAttached) return;
  scrollHandlerAttached = true;
  let raf = 0;
  el.addEventListener("scroll", () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      renderViewport();
    });
  });
}

function computeVisibleRows(): VRow[] {
  const rows: VRow[] = [];
  const push = (r: Omit<VRow, "idx">) => rows.push({ ...r, idx: rows.length });

  // Unsaved tabs (no absPath and not from scanned files).
  const unsaved = state.openTabs.filter(
    (t) => !t.absPath && !state.scannedFiles.some((f) => f.path === t.path)
  );
  if (unsaved.length > 0) {
    push({ kind: "header", depth: 0, label: "未保存文件", icon: "" });
    for (const tab of unsaved) {
      push({
        kind: "unsaved",
        depth: 0,
        label: tab.name + (tab.modified ? " \u2022" : ""),
        icon: getFileIcon(tab.name),
        path: tab.path,
        tabId: tab.id,
      });
    }
  }

  if (state.folderTree) walkTree(state.folderTree, 0, push);
  return rows;
}

function walkTree(node: TreeNode, depth: number, push: (r: Omit<VRow, "idx">) => void): void {
  if (node.type === "dir") {
    push({
      kind: "dir",
      depth,
      label: node.name,
      icon: node.expanded ? "\uD83D\uDCC2" : "\uD83D\uDCC1",
      node,
    });
    if (node.expanded && node.children) {
      for (const c of node.children) walkTree(c, depth + 1, push);
    }
  } else {
    push({
      kind: "file",
      depth,
      label: node.name,
      icon: getFileIcon(node.name),
      path: node.fileRef?.path,
      node,
    });
  }
}

function renderViewport(): void {
  const el = $("fileTree");
  const content = el.querySelector(".tree-content") as HTMLElement | null;
  if (!content) return;
  const total = visibleRows.length;
  if (total === 0) {
    content.textContent = "";
    return;
  }
  const H = el.clientHeight;
  const start = Math.max(0, Math.floor(el.scrollTop / ROW_H) - BUFFER);
  const end = Math.min(total, Math.ceil((el.scrollTop + H) / ROW_H) + BUFFER);

  // Rebuild the visible slice. Cheap: at most ~viewport/ROW_H + 2*BUFFER nodes.
  content.textContent = "";
  const active = getActiveTab();
  const activePath = active?.path;
  for (let i = start; i < end; i++) {
    const row = visibleRows[i];
    const div = document.createElement("div");
    div.className = "tree-vrow";
    div.dataset.idx = String(i);
    div.style.top = i * ROW_H + "px";

    if (row.kind === "header") {
      div.classList.add("tree-header");
      div.textContent = row.label;
      content.appendChild(div);
      continue;
    }

    div.style.paddingLeft = 8 + row.depth * 12 + "px";
    if (row.kind === "dir") {
      const arrow = document.createElement("span");
      arrow.className = "tree-arrow " + (row.node!.expanded ? "expanded" : "collapsed");
      div.appendChild(arrow);
    }
    if (row.icon) {
      const ic = document.createElement("span");
      ic.className = "icon";
      ic.textContent = row.icon;
      div.appendChild(ic);
    }
    const lab = document.createElement("span");
    lab.textContent = row.label;
    div.appendChild(lab);

    if (row.path && row.path === activePath) div.classList.add("selected");
    div.addEventListener("click", () => onRowClick(row));
    content.appendChild(div);
  }
}

function onRowClick(row: VRow): void {
  if (row.kind === "header") return;
  if (row.kind === "unsaved") {
    if (row.tabId != null) switchToTab(row.tabId);
    return;
  }
  if (row.kind === "dir") {
    if (row.node) {
      row.node.expanded = !row.node.expanded;
      refreshStructure();
    }
    return;
  }
  if (row.kind === "file") {
    if (row.node?.fileRef) void openScannedFile(row.node.fileRef);
    return;
  }
}

export { basename };
