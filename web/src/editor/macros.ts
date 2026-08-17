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
  // 录制的 from/to 是录制时相对于 pre-change doc 的绝对偏移。若文档此后
  // 被缩短，超界位置会让 CM6 dispatch 抛 "Position X is out of range"。
  // 裁剪到当前 doc.length（语义上：超界时锚定到文末）。
  const docLen = view.state.doc.length;
  const changes = steps.map((s) => ({
    from: Math.min(s.from, docLen),
    to: Math.min(s.to, docLen),
    insert: s.insert,
  }));
  view.dispatch({
    changes,
    userEvent: "macro.replay",
  });
  toast(`已回放 ${steps.length} 步`);
}

import { Transaction } from "@codemirror/state";
