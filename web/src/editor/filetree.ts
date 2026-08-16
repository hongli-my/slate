// web/src/editor/filetree.ts
// Render the file tree (recents section + unsaved tabs + folder tree).
// FIX #19: skip-set + symlink guard handled in io.scanDir.

import { state, getActiveTab, type TreeNode, basename } from "./state";
import { $ } from "./ui";
import { openScannedFile, openRecentFolder, openRecentFile, clearRecents } from "./files";
import { switchToTab } from "./tabs";
import { getFileIcon } from "./icons";

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

export function renderTree(): void {
  const el = $("fileTree");
  el.innerHTML = "";

  // Unsaved tabs (no absPath and not from scanned files).
  const unsaved = state.openTabs.filter(
    (t) => !t.absPath && !state.scannedFiles.some((f) => f.path === t.path)
  );
  if (unsaved.length > 0) {
    el.appendChild(sectionHeader("未保存文件"));
    for (const tab of unsaved) {
      const row = treeRow(tab.name + (tab.modified ? " \u2022" : ""), 20, getFileIcon(tab.name));
      if (tab.id === state.activeTabId) row.classList.add("selected");
      row.onclick = () => switchToTab(tab.id);
      el.appendChild(row);
    }
  }

  if (!state.folderTree) {
    if (unsaved.length === 0) {
      el.innerHTML =
        '<div style="padding:20px;text-align:center;color:#888;font-size:13px;">点击上方按钮打开文件夹</div>';
    }
    return;
  }
  renderTreeNode(state.folderTree, el, 0);
}

function sectionHeader(text: string): HTMLElement {
  const h = document.createElement("div");
  h.className = "tree-item";
  h.style.cssText =
    "padding:6px 8px 2px;color:#8b919a;font-size:11px;font-weight:700;" +
    "text-transform:uppercase;letter-spacing:.8px;cursor:default;";
  h.textContent = text;
  return h;
}

function treeRow(label: string, padLeft: number, icon: string): HTMLElement {
  const row = document.createElement("div");
  row.className = "tree-item";
  row.style.paddingLeft = padLeft + "px";
  const ic = document.createElement("span");
  ic.className = "icon";
  ic.textContent = icon;
  row.appendChild(ic);
  const lab = document.createElement("span");
  lab.textContent = label;
  row.appendChild(lab);
  return row;
}

function renderRecentSection(el: HTMLElement): void {
  if (!state.recents || state.recents.length === 0) return;
  const header = sectionHeader("最近打开");
  header.style.cssText +=
    "display:flex;align-items:center;justify-content:space-between;";
  const clear = document.createElement("span");
  clear.textContent = "清除";
  clear.style.cssText =
    "font-size:10px;color:#8b919a;cursor:pointer;text-transform:none;" +
    "letter-spacing:0;padding:0 4px;border-radius:3px;";
  clear.onmouseenter = () => (clear.style.color = "#1a73e8");
  clear.onmouseleave = () => (clear.style.color = "#8b919a");
  clear.onclick = (e) => {
    e.stopPropagation();
    void clearRecents();
  };
  header.appendChild(clear);
  el.appendChild(header);

  for (const r of state.recents.slice(0, 10)) {
    const icon = r.kind === "folder" ? "\uD83D\uDCC1" : getFileIcon(r.name);
    const row = treeRow(r.name, 20, icon);
    const lab = row.querySelector("span:last-child") as HTMLElement;
    if (lab) lab.title = r.path;
    row.onclick = () => {
      if (r.kind === "folder") void openRecentFolder(r.path);
      else void openRecentFile(r.path, r.name);
    };
    el.appendChild(row);
  }
}

function renderTreeNode(node: TreeNode, container: HTMLElement, depth: number): void {
  if (node.type === "dir") {
    const row = document.createElement("div");
    row.className = "tree-item";
    row.style.paddingLeft = 8 + depth * 12 + "px";
    const arrow = document.createElement("span");
    arrow.className = "tree-arrow " + (node.expanded ? "expanded" : "collapsed");
    row.appendChild(arrow);
    const icon = document.createElement("span");
    icon.className = "icon";
    icon.textContent = node.expanded ? "\uD83D\uDCC2" : "\uD83D\uDCC1";
    row.appendChild(icon);
    const label = document.createElement("span");
    label.textContent = node.name;
    row.appendChild(label);
    row.onclick = () => {
      node.expanded = !node.expanded;
      renderTree();
    };
    container.appendChild(row);
    if (node.expanded && node.children) {
      for (const child of node.children) renderTreeNode(child, container, depth + 1);
    }
  } else {
    const row = document.createElement("div");
    row.className = "tree-item";
    const active = getActiveTab();
    if (active && node.fileRef && active.path === node.fileRef.path) row.classList.add("selected");
    row.style.paddingLeft = 8 + depth * 12 + 16 + "px";
    const icon = document.createElement("span");
    icon.className = "icon";
    icon.textContent = getFileIcon(node.name);
    row.appendChild(icon);
    const label = document.createElement("span");
    label.textContent = node.name;
    row.appendChild(label);
    row.onclick = () => {
      if (node.fileRef) void openScannedFile(node.fileRef);
    };
    container.appendChild(row);
  }
}

export { basename };
