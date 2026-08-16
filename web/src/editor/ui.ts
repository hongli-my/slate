// web/src/editor/ui.ts
// Small DOM helpers: toast, escapeHtml, custom confirm modal (3 buttons).

export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function toast(msg: string, duration = 2000): void {
  const old = document.querySelector(".toast");
  if (old) old.remove();
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, duration);
}

export function $(id: string): HTMLElement {
  return document.getElementById(id) as HTMLElement;
}

export function showEl(id: string, show: boolean): void {
  const el = document.getElementById(id);
  if (el) el.style.display = show ? "block" : "none";
}

export type ConfirmChoice = "yes" | "no" | "cancel";

/**
 * Custom modal styled as a macOS sheet, for the 3-button
 * Save / Don't Save / Cancel case (close-unsaved-tab). Returns a promise
 * resolving to the chosen button. `kind` controls the button labels.
 */
export function customConfirm(opts: {
  message: string;
  title?: string;
  yesLabel?: string;
  noLabel?: string;
  cancelLabel?: string;
  yesPrimary?: boolean;
}): Promise<ConfirmChoice> {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.45);" +
      "display:flex;align-items:center;justify-content:center;z-index:10001;";
    const dlg = document.createElement("div");
    dlg.style.cssText =
      "background:#4b4b4b;border:1px solid #666;border-radius:8px;padding:18px 20px;" +
      "min-width:340px;max-width:440px;box-shadow:0 8px 28px rgba(0,0,0,0.5);" +
      "color:#e0e0e0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;";
    const title = opts.title ? `<h3 style="margin:0 0 10px;font-size:15px;font-weight:600;">${escapeHtml(opts.title)}</h3>` : "";
    dlg.innerHTML =
      title +
      `<p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#ccc;">${escapeHtml(opts.message)}</p>` +
      `<div style="display:flex;justify-content:flex-end;gap:8px;">` +
      `<button data-act="cancel" style="${btnStyle(false)}">${escapeHtml(opts.cancelLabel ?? "取消")}</button>` +
      `<button data-act="no" style="${btnStyle(false)}">${escapeHtml(opts.noLabel ?? "不保存")}</button>` +
      `<button data-act="yes" style="${btnStyle(!!opts.yesPrimary)}">${escapeHtml(opts.yesLabel ?? "保存")}</button>` +
      `</div>`;
    overlay.appendChild(dlg);
    document.body.appendChild(overlay);
    const done = (c: ConfirmChoice) => {
      overlay.remove();
      resolve(c);
    };
    dlg.querySelectorAll("button").forEach((b) => {
      b.addEventListener("click", () => {
        const act = b.getAttribute("data-act") as ConfirmChoice;
        done(act);
      });
    });
    overlay.addEventListener("mousedown", (e) => {
      if (e.target === overlay) done("cancel");
    });
    document.addEventListener(
      "keydown",
      function onKey(e: KeyboardEvent) {
        if (e.key === "Escape") {
          document.removeEventListener("keydown", onKey);
          done("cancel");
        } else if (e.key === "Enter") {
          document.removeEventListener("keydown", onKey);
          done("yes");
        }
      }
    );
    // focus primary
    const yesBtn = dlg.querySelector('[data-act="yes"]') as HTMLButtonElement | null;
    yesBtn?.focus();
  });
}

function btnStyle(primary: boolean): string {
  const base =
    "padding:6px 16px;border-radius:4px;cursor:pointer;font-size:13px;font-family:inherit;";
  return primary
    ? base + "background:#5a8a5a;border:1px solid #7ab87a;color:#fff;"
    : base + "background:transparent;border:1px solid #666;color:#ccc;";
}
