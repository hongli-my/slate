// web/src/editor/minimap.ts
// FIX #4: replace the canvas fillRect-per-line minimap with
// @replit/codemirror-minimap (renders a live DOM overview).

import { showMinimap } from "@replit/codemirror-minimap";
import { EditorView } from "@codemirror/view";
import { state, groupElId } from "./state";
import { minimapComp } from "./cm";
import { $ } from "./ui";

export const minimapExtension = showMinimap.of({
  showOverlay: "always",
  displayText: "blocks",
});

export function toggleMinimap(): void {
  state.minimapOn = !state.minimapOn;
  // Toggle the minimap extension on every mounted group view.
  for (const gi of [0, 1] as const) {
    const pane = $(groupElId("editorPane", gi));
    if (pane) pane.classList.toggle("minimap-on", state.minimapOn);
    const v = state.groups[gi].view;
    if (v) {
      v.dispatch({
        effects: minimapComp.reconfigure(state.minimapOn ? [minimapExtension] : []),
      });
    }
  }
  // Legacy canvas minimap (group0 only, kept off — @replit minimap renders in-view).
  const mm = document.getElementById("minimap");
  if (mm) mm.classList.toggle("visible", state.minimapOn && false);
  if (state.minimapOn) toast2("已开启 Minimap");
}

export function refreshMinimap(): void {
  // @replit/codemirror-minimap updates itself via CM6 updates; nothing to do.
}

// tiny inline toast to avoid a ui import cycle for one call
function toast2(msg: string): void {
  const old = document.querySelector(".toast");
  if (old) old.remove();
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 1500);
}

export { EditorView };
