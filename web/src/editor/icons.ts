// web/src/editor/icons.ts
// File-type -> emoji icon (ported from editor.js getFileIcon).

export function getFileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const icons: Record<string, string> = {
    py: "\uD83D\uDC0D",
    js: "\uD83D\uDFE8",
    ts: "\uD83D\uDD35",
    jsx: "\u269B",
    tsx: "\u269B",
    html: "\uD83C\uDF10",
    css: "\uD83C\uDFA8",
    json: "\uD83D\uDCCB",
    md: "\uD83D\uDCDD",
    markdown: "\uD83D\uDCDD",
    sh: "\uD83D\uDCBB",
    bash: "\uD83D\uDCBB",
    zsh: "\uD83D\uDCBB",
    go: "\uD83D\uDC39",
    rs: "\u2699",
    java: "\u2615",
    c: "\uD83D\uDD27",
    cpp: "\uD83D\uDD27",
    cc: "\uD83D\uDD27",
    cxx: "\uD83D\uDD27",
    h: "\uD83D\uDD27",
    hpp: "\uD83D\uDD27",
    sql: "\uD83D\uDDC3",
    yml: "\uD83D\uDCDC",
    yaml: "\uD83D\uDCDC",
    xml: "\uD83D\uDCC4",
  };
  return icons[ext] || "\uD83D\uDCC4";
}
