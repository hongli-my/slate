// web/src/main.ts
// Bundle entry. Boots the Slate editor on DOMContentLoaded, exposes globals
// for index.html onclick handlers, and installs global error handlers.

import { initEditor, exposeGlobals, setupGlobalErrorHandlers } from "./editor/index";

function boot(): void {
  setupGlobalErrorHandlers();
  exposeGlobals();
  void initEditor();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
