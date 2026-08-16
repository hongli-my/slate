// web/src/editor/macros.ts
// FIX #13: record via updateListener; replay ALL recorded changes in a SINGLE
// dispatch transaction (positions relative to pre-change doc -> no drift).

import { state } from "./state";
import { toast } from "./ui";
import type { ViewUpdate } from "@codemirror/view";

interface RecordedChange {
  from: number;
  to: number;
  insert: string;
}

/**
 * Consume a ViewUpdate for macro recording. Called from the main update
 * listener. Records each changed range; positions are relative to the
 * pre-change doc (as emitted by iterChanges), which is what dispatch expects.
 */
export function recordMacroUpdate(u: ViewUpdate): void {
  if (!state.macroRecording || !u.docChanged) return;
  // Skip changes that came from a macro replay itself (avoid feedback loops).
  if (u.transactions.some((tr) => tr.annotation(Transaction.userEvent) === "macro.replay")) {
    return;
  }
  u.changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
    (state.macroSteps as RecordedChange[]).push({
      from: fromA,
      to: toA,
      insert: inserted.toString(),
    });
  });
}

export function toggleMacro(): void {
  if (state.macroRecording) {
    state.macroRecording = false;
    toast(`已停止录制（${state.macroSteps.length} 步，Cmd+Shift+R 回放）`);
  } else {
    state.macroSteps = [];
    state.macroRecording = true;
    toast("开始录制... Cmd+Ctrl+R 停止");
  }
}

export function playMacro(): void {
  state.macroRecording = false;
  const view = state.view;
  if (!view) return;
  const steps = state.macroSteps as RecordedChange[];
  if (steps.length === 0) {
    toast("没有录制的宏");
    return;
  }
  // FIX #13: single dispatch with all changes (positions relative to
  // pre-dispatch doc -> no offset drift like the old loop version).
  view.dispatch({
    changes: steps.map((s) => ({ from: s.from, to: s.to, insert: s.insert })),
    userEvent: "macro.replay",
  });
  toast(`已回放 ${steps.length} 步`);
}

import { Transaction } from "@codemirror/state";
