// web/src/editor/contextmenu.ts
// Editor right-click menu: split-view controls (horizontal / vertical / close).
// Matches the dark theme of #searchReplacePanel (#2d2d2d, border #555).

import { state } from "./state";
import { toggleSplitView } from "./split";

let menu: HTMLDivElement | null = null;

interface Item {
  label: string;
  checked?: boolean;
  disabled?: boolean;
  run: () => void;
}

function buildItems(): Item[] {
  const noFile = !state.view || state.openTabs.length === 0;
  return [
    {
      label: "左右分屏",
      checked: state.splitActive && state.splitMode === "horizontal",
      disabled: noFile,
      run: () => toggleSplitView("horizontal"),
    },
    {
      label: "上下分屏",
      checked: state.splitActive && state.splitMode === "vertical",
      disabled: noFile,
      run: () => toggleSplitView("vertical"),
    },
    {
      label: "关闭分屏",
      disabled: !state.splitActive,
      // Toggle the current direction — same-direction toggle closes the split.
      run: () => toggleSplitView(state.splitMode ?? "horizontal"),
    },
  ];
}

function closeMenu(): void {
  if (menu) {
    menu.remove();
    menu = null;
  }
  document.removeEventListener("mousedown", onOutside, true);
  document.removeEventListener("keydown", onKey, true);
  window.removeEventListener("scroll", closeMenu, true);
  window.removeEventListener("resize", closeMenu);
}

function onOutside(e: MouseEvent): void {
  if (menu && !menu.contains(e.target as Node)) closeMenu();
}

function onKey(e: KeyboardEvent): void {
  if (e.key === "Escape") {
    e.preventDefault();
    closeMenu();
  }
}

function showMenu(x: number, y: number): void {
  closeMenu();
  menu = document.createElement("div");
  menu.className = "ctx-menu";

  const items = buildItems();
  items.forEach((it, i) => {
    if (i > 0) {
      const sep = document.createElement("div");
      sep.className = "ctx-sep";
      menu!.appendChild(sep);
    }
    const row = document.createElement("div");
    row.className =
      "ctx-item" + (it.disabled ? " disabled" : "") + (it.checked ? " checked" : "");
    const lab = document.createElement("span");
    lab.className = "ctx-label";
    lab.textContent = it.label;
    row.appendChild(lab);
    const tick = document.createElement("span");
    tick.className = "ctx-tick";
    tick.textContent = it.checked ? "\u2713" : "";
    row.appendChild(tick);
    if (!it.disabled) {
      row.addEventListener("click", () => {
        const fn = it.run;
        closeMenu();
        fn();
      });
    }
    menu!.appendChild(row);
  });

  document.body.appendChild(menu);

  // Boundary detection so the menu never overflows the viewport.
  const rect = menu.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left = x;
  let top = y;
  if (left + rect.width > vw - 8) left = vw - rect.width - 8;
  if (top + rect.height > vh - 8) top = vh - rect.height - 8;
  menu.style.left = Math.max(8, left) + "px";
  menu.style.top = Math.max(8, top) + "px";

  document.addEventListener("mousedown", onOutside, true);
  document.addEventListener("keydown", onKey, true);
  window.addEventListener("scroll", closeMenu, true);
  window.addEventListener("resize", closeMenu);
}

/** Wire up the editor-area right-click menu. Call once during boot. */
export function setupEditorContextMenu(): void {
  document.addEventListener("contextmenu", (e) => {
    if (!state.view) return;
    const target = e.target as Node | null;
    if (!target) return;
    const area = document.getElementById("editorArea");
    if (!area || !area.contains(target)) return;
    e.preventDefault();
    showMenu(e.clientX, e.clientY);
  });
}
