// web/src/editor/wikilink.ts
// Wikilink ([[...]]) core logic: link extraction, backlink index, fuzzy
// matching for completion, and a note-file provider hook so the editor
// (cm.ts) can populate the autocomplete popup without a hard dependency on
// the file-system layer.
//
// This module is intentionally free of CodeMirror imports — it is pure
// logic + a tiny provider registry. cm.ts consumes getNoteFileList() +
// fuzzyScore() to build the actual completion source.

/** A single directed link: `source` file references `target` via [[target]]. */
export interface LinkEntry {
  /** Source file basename (with extension), e.g. "note1.md". */
  source: string;
  /** The raw [[...]] target text, e.g. "note2" (alias stripped, trimmed). */
  target: string;
  /** Full path of the source file. */
  sourcePath: string;
}

const WIKILINK_RE = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
const MD_EXT_RE = /\.(md|markdown)$/i;

/** Extract all [[wikilink]] targets from `text`.
 *  Supports both [[Title]] and [[Title|alias]] forms; the returned titles
 *  are the first group (the link target), trimmed. Aliases are discarded. */
export function extractWikilinks(text: string): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  // Reset lastIndex in case the regex was reused (it's a /g literal, but
  // defensive reset is cheap and avoids subtle cross-call state bugs).
  WIKILINK_RE.lastIndex = 0;
  while ((m = WIKILINK_RE.exec(text)) !== null) {
    out.push(m[1].trim());
  }
  return out;
}

/** Build a whole-vault link index from a file list.
 *  Only .md / .markdown files are scanned. `source` is the file basename
 *  (path.split('/').pop()), `sourcePath` is the original path. */
export function buildLinkIndex(files: { path: string; content: string }[]): LinkEntry[] {
  const index: LinkEntry[] = [];
  for (const f of files) {
    if (!MD_EXT_RE.test(f.path)) continue;
    const base = f.path.split("/").pop() || f.path;
    const targets = extractWikilinks(f.content);
    for (const target of targets) {
      index.push({ source: base, target, sourcePath: f.path });
    }
  }
  return index;
}

/** Extract #tags from markdown text. Skips markdown headings (`# 标题`,
 *  `##`), and URL fragments (`url#anchor`) by requiring a word/CJK char right
 *  after `#`. A tag then continues with word chars, CJK, `-`, `/` or `.`.
 *  Fenced code blocks are stripped first so `#` inside code isn't a tag. */
const TAG_RE = /(?:^|[\s>])#([\w\u4e00-\u9fa5][\w\u4e00-\u9fa5\-/.]*)/g;

export function extractTags(text: string): string[] {
  const stripped = text.replace(/```[\s\S]*?```/g, "");
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(stripped)) !== null) {
    out.add(m[1]);
  }
  return Array.from(out);
}

/** Build a whole-vault tag index: note name (basename sans extension) →
 *  set of tags found in that note. Only .md / .markdown files are scanned. */
export function buildTagIndex(files: { path: string; content: string }[]): Map<string, Set<string>> {
  const index = new Map<string, Set<string>>();
  for (const f of files) {
    if (!MD_EXT_RE.test(f.path)) continue;
    const base = f.path.split("/").pop() || f.path;
    const key = base.replace(MD_EXT_RE, "");
    const tags = extractTags(f.content);
    if (tags.length) index.set(key, new Set(tags));
  }
  return index;
}

/** Find all backlinks pointing at `title`.
 *  A link entry matches if its target equals `title` verbatim OR equals
 *  `title` with a .md/.markdown extension stripped. So both "note2" and
 *  "note2.md" as input resolve links whose target is "note2". */
export function backlinksFor(title: string, index: LinkEntry[]): LinkEntry[] {
  const bare = title.replace(MD_EXT_RE, "");
  return index.filter((e) => e.target === title || e.target === bare);
}

/** Fuzzy match score in [0, 100] for completion ranking.
 *  - 0 (no match) when `query` is empty or not a case-insensitive substring
 *    of `target` (contiguous match required).
 *  - Base: 50 + (query.length / target.length) * 30  — longer queries
 *    relative to the target rank higher.
 *  - Prefix bonus: +20 when the target starts with the query. */
export function fuzzyScore(query: string, target: string): number {
  if (!query) return 0;
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  const idx = t.indexOf(q);
  if (idx === -1) return 0;
  const ratio = q.length / t.length;
  let score = 50 + ratio * 30;
  if (idx === 0) score += 20;
  if (score > 100) score = 100;
  return Math.round(score);
}

/** Collect every note title in the vault for completion.
 *  Titles = markdown file basenames without extension, unioned with every
 *  wikilink target seen in the vault (so [[dangling]] targets also
 *  appear, letting the user complete them even before the file exists).
 *  De-duplicated. */
export function collectNoteTitles(files: { path: string; content: string }[]): string[] {
  const titles = new Set<string>();
  for (const f of files) {
    if (!MD_EXT_RE.test(f.path)) continue;
    const base = f.path.split("/").pop() || f.path;
    titles.add(base.replace(MD_EXT_RE, ""));
  }
  // Also surface wikilink targets that don't (yet) resolve to a file —
  // useful for completing stub links.
  for (const entry of buildLinkIndex(files)) {
    titles.add(entry.target);
  }
  return Array.from(titles);
}

// ---- Note-file provider (wired by index.ts) ----

// The editor layer (cm.ts) needs the current vault's note titles to feed the
// [[ ]] autocomplete, but wikilink.ts must not import the file-system module
// (that would create a circular layering: fs -> editor -> wikilink -> fs).
// Instead index.ts registers a provider here after the vault is loaded.
let noteFileProvider: (() => string[]) | null = null;

/** Register a callback returning the current vault's note titles (file
 *  basenames without extension). Called on every completion invocation, so
 *  the implementation should be cheap (a cached array is ideal).
 *  Pass null to clear. */
export function setNoteFileProvider(fn: (() => string[]) | null): void {
  noteFileProvider = fn;
}

/** Return the current note-title list from the registered provider, or an
 *  empty array if none has been registered. cm.ts calls this lazily inside
 *  its completion source so a missing provider stays a no-op (empty popup)
 *  rather than a crash. */
export function getNoteFileList(): string[] {
  return noteFileProvider ? noteFileProvider() : [];
}
