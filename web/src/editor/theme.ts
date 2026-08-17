// web/src/editor/theme.ts
// Dark Sublime + Light themes for CodeMirror 6 (FIX: replace CM5 monokai theme).
// Colors ported from editor.css to match the previous look exactly.

import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

// ---- Dark Sublime (matches old monokai overrides: bg #474747) ----
export const darkTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "#474747",
      color: "#f8f8f2",
      height: "100%",
      fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
      fontSize: "14px",
    },
    ".cm-scroller": { lineHeight: "1.6", overflow: "auto" },
    ".cm-gutters": {
      backgroundColor: "#414141",
      color: "#8f908a",
      border: "none",
      borderRight: "1px solid #555",
    },
    ".cm-activeLine": { backgroundColor: "rgba(255,255,255,0.07)" },
    ".cm-activeLineGutter": { backgroundColor: "rgba(255,255,255,0.07)" },
    "&.cm-focused": { outline: "none" },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
      backgroundColor: "rgba(255,200,120,0.25)",
    },
    "& ::selection": { backgroundColor: "rgba(255,200,120,0.25)" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#f8f8f0" },
    ".cm-foldGutter .cm-gutterElement": {
      cursor: "pointer",
      color: "#999",
      padding: "0 3px",
    },
    ".cm-foldPlaceholder": {
      backgroundColor: "#5a5a5a",
      color: "#ccc",
      border: "1px solid #777",
      borderRadius: "3px",
      padding: "0 4px",
      margin: "0 2px",
    },
    ".cm-occurrence": {
      backgroundColor: "rgba(255,255,255,0.12)",
      borderBottom: "1px solid rgba(255,255,255,0.3)",
    },
    ".cm-searchMatch": { backgroundColor: "rgba(255,200,0,0.4)" },
    ".cm-searchMatch-selected": { backgroundColor: "rgba(255,200,0,0.6)" },
    // autocomplete popup
    ".cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]": {
      backgroundColor: "#5a5a8a",
      color: "#fff",
    },
    ".cm-tooltip": {
      backgroundColor: "#2d2d2d",
      border: "1px solid #555",
      color: "#f8f8f2",
    },
    ".cm-tooltip-autocomplete ul li": { padding: "2px 8px" },
    // search panel (CM6 built-in)
    ".cm-panels": {
      backgroundColor: "#2d2d2d",
      color: "#f8f8f2",
      borderTop: "1px solid #444",
    },
    ".cm-panels input": {
      backgroundColor: "#1e1e1e",
      color: "#f8f8f2",
      border: "1px solid #555",
      borderRadius: "4px",
      padding: "2px 6px",
    },
    ".cm-textfield": { backgroundColor: "#1e1e1e", color: "#f8f8f2" },
  },
  { dark: true }
);

export const darkHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: "#f92672" },
  { tag: t.string, color: "#e6db74" },
  { tag: [t.number, t.bool], color: "#ae81ff" },
  { tag: t.comment, color: "#75715e", fontStyle: "italic" },
  { tag: t.function(t.variableName), color: "#a6e22e" },
  { tag: t.typeName, color: "#66d9ef", fontStyle: "italic" },
  { tag: t.variableName, color: "#f8f8f2" },
  { tag: t.operator, color: "#f92672" },
  { tag: t.propertyName, color: "#fd971f" },
  { tag: t.definition(t.variableName), color: "#fd971f" },
  { tag: t.tagName, color: "#f92672" },
  { tag: t.attributeName, color: "#a6e22e" },
  { tag: t.heading, color: "#66d9ef" },
  { tag: t.url, color: "#e6db74" },
  { tag: t.link, color: "#a6e22e" },
  { tag: t.meta, color: "#75715e" },
]);

export const darkThemeExt = [darkTheme, syntaxHighlighting(darkHighlightStyle)];

// ---- Light theme (matches old .light-theme overrides) ----
export const lightTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "#fafafa",
      color: "#333",
      height: "100%",
      fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
      fontSize: "14px",
    },
    ".cm-scroller": { lineHeight: "1.6", overflow: "auto" },
    ".cm-gutters": {
      backgroundColor: "#f0f0f0",
      color: "#999",
      border: "none",
      borderRight: "1px solid #e0e0e0",
    },
    ".cm-activeLine": { backgroundColor: "rgba(0,0,0,0.05)" },
    ".cm-activeLineGutter": { backgroundColor: "rgba(0,0,0,0.05)" },
    "&.cm-focused": { outline: "none" },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
      backgroundColor: "rgba(217,160,50,0.28)",
    },
    "& ::selection": { backgroundColor: "rgba(217,160,50,0.28)" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#1a1a1a" },
    ".cm-foldGutter .cm-gutterElement": { cursor: "pointer", color: "#aaa" },
    ".cm-foldPlaceholder": {
      backgroundColor: "#e8e8e8",
      color: "#666",
      border: "1px solid #ccc",
      borderRadius: "3px",
      padding: "0 4px",
      margin: "0 2px",
    },
    ".cm-occurrence": {
      backgroundColor: "rgba(0,0,0,0.08)",
      borderBottom: "1px solid rgba(0,0,0,0.2)",
    },
    ".cm-searchMatch": { backgroundColor: "rgba(255,200,0,0.4)" },
    ".cm-searchMatch-selected": { backgroundColor: "rgba(255,200,0,0.6)" },
    ".cm-tooltip": { backgroundColor: "#fff", border: "1px solid #ccc", color: "#333" },
    ".cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]": {
      backgroundColor: "#eef1f6",
      color: "#1a73e8",
    },
    ".cm-panels": {
      backgroundColor: "#f5f6f8",
      color: "#333",
      borderTop: "1px solid #e5e6eb",
    },
  },
  { dark: false }
);

export const lightHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: "#0000ff" },
  { tag: t.string, color: "#a31515" },
  { tag: [t.number, t.bool], color: "#098658" },
  { tag: t.comment, color: "#008000", fontStyle: "italic" },
  { tag: t.function(t.variableName), color: "#795e26" },
  { tag: t.typeName, color: "#267f99" },
  { tag: t.variableName, color: "#333" },
  { tag: t.operator, color: "#0000ff" },
  { tag: t.propertyName, color: "#795e26" },
  { tag: t.tagName, color: "#0000ff" },
  { tag: t.attributeName, color: "#795e26" },
  { tag: t.heading, color: "#267f99" },
  { tag: t.link, color: "#0000ff" },
]);

export const lightThemeExt = [lightTheme, syntaxHighlighting(lightHighlightStyle)];
