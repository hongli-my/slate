// web/src/editor/minimap.ts
// FIX #4: replace the canvas fillRect-per-line minimap with
// @replit/codemirror-minimap (renders a live DOM overview).

import { showMinimap } from "@replit/codemirror-minimap";
import { EditorView } from "@codemirror/view";
import { state } from "./state";
import { minimapComp } from "./cm";
import { $ } from "./ui";

export const minimapExtension = showMinimap.of({
  showOverlay: "always",
  displayText: "blocks",
});

export function toggleMinimap(): void {
  state.minimapOn = !state.minimapOn;
  const view = state.view;
  const pane = $("editorPane");
  const mm = document.getElementById("minimap");
  if (pane) pane.classList.toggle("minimap-on", state.minimapOn);
  // The old canvas minimap element is hidden; the @replit minimap renders
  // inside the editor scroller. Toggle the extension via the compartment.
  if (mm) mm.classList.toggle("visible", state.minimapOn && false); // legacy canvas kept off
  if (view) {
    view.dispatch({
      effects: minimapComp.reconfigure(state.minimapOn ? [minimapExtension] : []),
    });
  }
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
