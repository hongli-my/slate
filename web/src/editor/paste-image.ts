// web/src/editor/paste-image.ts
// Paste-image support for Markdown files (ported from editor.js).
// Offers Base64 embed or save-to-folder, then inserts the markdown image.

import type { EditorView } from "@codemirror/view";
import { state, getActiveTab } from "./state";
import { isMarkdownFile } from "./preview";
import { saveImageToFolder, doRefreshFolder } from "./files";
import { toast, customConfirm } from "./ui";
import { basename } from "./state";

/** Attach a paste listener to an editor view's DOM. Call once per view
 *  (group0 at boot, group1 when the split is mounted). */
export function setupPasteImage(view: EditorView): void {
  view.dom.addEventListener("paste", async (e) => {
    if (!isMarkdownFile()) return;
    const cd = e.clipboardData;
    if (!cd) return;
    let imageItem: DataTransferItem | null = null;
    for (let i = 0; i < cd.items.length; i++) {
      if (cd.items[i].type.indexOf("image") !== -1) {
        imageItem = cd.items[i];
        break;
      }
    }
    if (!imageItem) return;
    e.preventDefault();
    const blob = imageItem.getAsFile();
    if (!blob) return;
    const timestamp = Date.now();
    const ext = blob.type.replace("image/", "").replace("jpeg", "jpg");
    const defaultName = `image-${timestamp}.${ext}`;

    const choice = await showImagePasteDialog(defaultName);
    if (!choice) return;

    if (choice.action === "base64") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        insertImageMarkdown(choice.name, base64);
      };
      reader.readAsDataURL(blob);
    } else if (choice.action === "save") {
      if (!state.currentDirPath) {
        toast("请先打开一个文件夹才能保存图片");
        return;
      }
      try {
        const arr = new Uint8Array(await blob.arrayBuffer());
        const saved = await saveImageToFolder(choice.name, arr);
        if (saved) {
          insertImageMarkdown(choice.name, choice.name);
          await doRefreshFolder();
          toast("图片已保存: " + choice.name);
        }
      } catch (err) {
        toast("保存图片失败: " + (err as Error).message);
      }
    }
  });
}

function insertImageMarkdown(alt: string, src: string): void {
  const view = state.view;
  if (!view) return;
  const md = `![${alt}](${src})`;
  view.dispatch(view.state.replaceSelection(md));
  view.focus();
}

interface ImageChoice {
  action: "base64" | "save";
  name: string;
}

function showImagePasteDialog(defaultName: string): Promise<ImageChoice | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.5);" +
      "display:flex;align-items:center;justify-content:center;z-index:10001;";
    const dlg = document.createElement("div");
    dlg.style.cssText =
      "background:#4b4b4b;border:1px solid #666;border-radius:8px;padding:20px;" +
      "min-width:320px;box-shadow:0 4px 20px rgba(0,0,0,0.4);color:#e0e0e0;";
    const saveDisabled = !state.currentDirPath;
    dlg.innerHTML = `
      <h3 style="margin:0 0 15px;font-size:16px;color:#e0e0e0;font-weight:500;">粘贴图片</h3>
      <p style="margin:0 0 15px;font-size:13px;color:#aaa;">检测到剪贴板中的图片，请选择处理方式：</p>
      <div style="margin-bottom:15px;">
        <label style="display:block;font-size:12px;color:#999;margin-bottom:5px;">图片名称</label>
        <input type="text" id="imgNameInput" value="${defaultName}"
          style="width:100%;padding:8px 10px;background:#3a3a3a;border:1px solid #555;
                 border-radius:4px;color:#e0e0e0;font-size:13px;box-sizing:border-box;">
      </div>
      <div style="display:flex;gap:10px;">
        <button id="btnBase64" style="flex:1;padding:8px;background:#5a5a5a;border:1px solid #777;
          border-radius:4px;color:#e0e0e0;cursor:pointer;font-size:13px;">Base64 嵌入</button>
        <button id="btnSave" style="flex:1;padding:8px;background:#5a8a5a;border:1px solid #7ab87a;
          border-radius:4px;color:#fff;cursor:pointer;font-size:13px;${saveDisabled ? "opacity:0.5;cursor:not-allowed;" : ""}">保存到文件夹</button>
        <button id="btnCancel" style="padding:8px 15px;background:transparent;border:1px solid #666;
          border-radius:4px;color:#999;cursor:pointer;font-size:13px;">取消</button>
      </div>`;
    overlay.appendChild(dlg);
    document.body.appendChild(overlay);

    const input = dlg.querySelector("#imgNameInput") as HTMLInputElement;
    setTimeout(() => {
      input.focus();
      input.select();
    }, 10);

    const finish = (c: ImageChoice | null) => {
      overlay.remove();
      resolve(c);
    };
    dlg.querySelector("#btnBase64")!.addEventListener("click", () => {
      finish({ action: "base64", name: input.value.trim() || defaultName });
    });
    dlg.querySelector("#btnSave")!.addEventListener("click", () => {
      if (saveDisabled) return;
      finish({ action: "save", name: input.value.trim() || defaultName });
    });
    dlg.querySelector("#btnCancel")!.addEventListener("click", () => finish(null));
    overlay.addEventListener("mousedown", (e) => {
      if (e.target === overlay) finish(null);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") finish({ action: "base64", name: input.value.trim() || defaultName });
    });
  });
}

// keep imports referenced
void customConfirm;
void getActiveTab;
void basename;
