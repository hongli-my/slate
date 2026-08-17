// web/src/editor/keymap.ts
// Document-level keyboard shortcuts (the ones NOT handled by CM6 keymaps).
// Ported from editor.js setupShortcuts + the menu bridge.

import { state } from "./state";
import { saveCurrentFile, doOpenFolder, doOpenFiles, doNewFile, deleteCurrentFile } from "./files";
import { closeTab } from "./tabs";
import { togglePreview } from "./preview";
import { toggleTheme, toggleEol } from "./commands";
import { toggleSplitView } from "./split";
import { toggleMinimap } from "./minimap";
import { toggleMacro, playMacro } from "./macros";
import { showGotoPanel, closeGotoPanel } from "./goto";
import { showSearchAllPanel, closeSearchAllPanel, showSearchReplacePanel, closeSearchReplacePanel } from "./search";

export function setupShortcuts(): void {
  document.addEventListener("keydown", (e) => {
    // M10: 模态对话框（customConfirm 等）打开期间屏蔽全局快捷键——
    // 否则 Cmd+W 会在 await customConfirm 期间为同一 tab 叠加第二个
    // 对话框，其他快捷键也可能干扰模态交互。
    if (document.querySelector('[data-slate-modal="1"]')) return;
    // Only hijack shortcuts when the editor view is active (avoid clashing
    // with the shell's Cmd+1~4 view switching).
    const view = document.getElementById("view-editor");
    if (!view || !view.classList.contains("active")) return;
    const code = e.code;

    // Save / close / preview
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      void saveCurrentFile();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "w") {
      e.preventDefault();
      if (state.activeTabId != null) void closeTab(state.activeTabId);
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "p") {
      e.preventDefault();
      togglePreview();
      return;
    }
    // Goto Anything (Ctrl+M)
    if (e.ctrlKey && !e.metaKey && !e.altKey && code === "KeyM") {
      e.preventDefault();
      showGotoPanel();
      return;
    }
    // Global search (Cmd+Shift+F)
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && !e.altKey && code === "KeyF") {
      e.preventDefault();
      showSearchAllPanel();
      return;
    }
    // Find in file (Cmd+F / Ctrl+F) -> custom replace panel
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key === "f") {
      e.preventDefault();
      showSearchReplacePanel(true);
      return;
    }
    // View toggles
    if ((e.metaKey || e.ctrlKey) && e.altKey && code === "Digit2") {
      e.preventDefault();
      toggleSplitView();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.altKey && code === "KeyT") {
      e.preventDefault();
      toggleTheme();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.altKey && code === "KeyM") {
      e.preventDefault();
      toggleMinimap();
      return;
    }
    // Macros
    if (e.metaKey && e.ctrlKey && !e.altKey && code === "KeyR") {
      e.preventDefault();
      toggleMacro();
      return;
    }
    if (e.metaKey && e.shiftKey && !e.ctrlKey && !e.altKey && code === "KeyR") {
      e.preventDefault();
      playMacro();
      return;
    }
    // Escape closes floating panels
    if (e.key === "Escape") {
      closeSearchReplacePanel();
      closeGotoPanel();
      closeSearchAllPanel();
    }
  });

  // Menu event bridge (Tauri emits 'menu-action' for native menu items).
  const w = window as unknown as {
    __TAURI__?: { event?: { listen?: (ev: string, cb: (e: { payload: string }) => void) => Promise<void> } };
  };
  const listen = w.__TAURI__?.event?.listen;
  if (typeof listen === "function") {
    listen("menu-action", (e) => {
      const a = e.payload;
      if (a === "open-folder") void doOpenFolder();
      else if (a === "open-file") void doOpenFiles();
      else if (a === "save") void saveCurrentFile();
      else if (a === "new-file") doNewFile();
      else if (a === "delete") void deleteCurrentFile();
      else if (a === "preview") togglePreview();
    }).catch(() => {
      /* ignore */
    });
  }
}

export { doOpenFolder, doOpenFiles, doNewFile, deleteCurrentFile };
