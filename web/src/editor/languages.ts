// web/src/editor/languages.ts
// File extension -> CodeMirror 6 LanguageSupport map.
// Uses native @codemirror/lang-* packages where available, and
// StreamLanguage over @codemirror/legacy-modes for the rest.

import { LanguageSupport, StreamLanguage } from "@codemirror/language";

import { cpp } from "@codemirror/lang-cpp";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { go } from "@codemirror/lang-go";
import { rust } from "@codemirror/lang-rust";
import { sql } from "@codemirror/lang-sql";
import { markdown } from "@codemirror/lang-markdown";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { json } from "@codemirror/lang-json";
import { java } from "@codemirror/lang-java";
import { php } from "@codemirror/lang-php";
import { yaml } from "@codemirror/lang-yaml";

// Legacy modes (no native package).
import { lua } from "@codemirror/legacy-modes/mode/lua";
import { ruby } from "@codemirror/legacy-modes/mode/ruby";
import { swift } from "@codemirror/legacy-modes/mode/swift";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import { r } from "@codemirror/legacy-modes/mode/r";
import { perl } from "@codemirror/legacy-modes/mode/perl";
import { cmake } from "@codemirror/legacy-modes/mode/cmake";
import { dockerFile } from "@codemirror/legacy-modes/mode/dockerfile";
import { diff } from "@codemirror/legacy-modes/mode/diff";
import { properties } from "@codemirror/legacy-modes/mode/properties";
import { powerShell } from "@codemirror/legacy-modes/mode/powershell";
import {
  c,
  cpp as legacyCpp,
  scala,
  kotlin,
  objectiveC,
  objectiveCpp,
} from "@codemirror/legacy-modes/mode/clike";

const stream = (p: unknown) => new LanguageSupport(StreamLanguage.define(p as never));

// javascript with both jsx+typescript support covers .js/.jsx/.ts/.tsx/.mjs/.cjs
const jsExt = javascript({ jsx: true, typescript: true });

const EXT_MAP: Record<string, LanguageSupport> = {
  // C / C++
  c: new LanguageSupport(c),
  h: new LanguageSupport(c),
  cpp: cpp(),
  cc: cpp(),
  cxx: cpp(),
  hpp: cpp(),
  // Java family (native java; legacy for scala/kotlin/objc)
  java: java(),
  kt: stream(kotlin),
  scala: stream(scala),
  m: stream(objectiveC),
  mm: stream(objectiveCpp),
  // Python
  py: python(),
  // JS / TS
  js: jsExt,
  jsx: jsExt,
  ts: jsExt,
  tsx: jsExt,
  mjs: jsExt,
  cjs: jsExt,
  // JSON
  json: json(),
  // Go
  go: go(),
  // Rust
  rs: rust(),
  // Shell
  sh: stream(shell),
  bash: stream(shell),
  zsh: stream(shell),
  fish: stream(shell),
  // PHP
  php: php(),
  // Ruby
  rb: stream(ruby),
  // Lua
  lua: stream(lua),
  // SQL
  sql: sql(),
  // Swift
  swift: stream(swift),
  // Web
  html: html(),
  htm: html(),
  vue: html(),
  svelte: html(),
  xml: html(),
  css: css(),
  scss: css(),
  less: css(),
  // Markdown
  md: markdown(),
  markdown: markdown(),
  // YAML
  yml: yaml(),
  yaml: yaml(),
  // Misc
  cmake: stream(cmake),
  pl: stream(perl),
  pm: stream(perl),
  r: stream(r),
  ini: stream(properties),
  cfg: stream(properties),
  conf: stream(properties),
  properties: stream(properties),
  diff: stream(diff),
  patch: stream(diff),
  ps1: stream(powerShell),
};

export function languageForFile(name: string): LanguageSupport | [] {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const lower = name.toLowerCase();
  if (lower === "makefile" || lower === "dockerfile") {
    return lower === "dockerfile" ? stream(dockerFile) : stream(shell);
  }
  return EXT_MAP[ext] ?? [];
}

export function languageLabel(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const lower = name.toLowerCase();
  if (lower === "makefile") return "Makefile";
  if (lower === "dockerfile") return "Dockerfile";
  const labels: Record<string, string> = {
    c: "C", h: "C Header", cpp: "C++", cc: "C++", cxx: "C++", hpp: "C++ Header",
    py: "Python", js: "JavaScript", jsx: "JavaScript", ts: "TypeScript", tsx: "TypeScript",
    java: "Java", kt: "Kotlin", scala: "Scala", go: "Go", rs: "Rust",
    sh: "Shell", bash: "Shell", zsh: "Shell", fish: "Shell",
    php: "PHP", rb: "Ruby", lua: "Lua", sql: "SQL", swift: "Swift",
    html: "HTML", htm: "HTML", vue: "Vue", css: "CSS", xml: "XML",
    json: "JSON", yml: "YAML", yaml: "YAML", md: "Markdown", markdown: "Markdown",
    txt: "Plain Text", ini: "INI", cfg: "Config", conf: "Config",
    m: "Objective-C", mm: "Objective-C", pl: "Perl", pm: "Perl", r: "R",
    cmake: "CMake", diff: "Diff", patch: "Diff", ps1: "PowerShell",
  };
  return labels[ext] || "Plain Text";
}

export const NONE_LANG: [] = [];

// legacy c/cpp exports kept referenced so tree-shaking keeps them if needed
void legacyCpp;
