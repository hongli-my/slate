// web/src/editor/calendar.ts
// 日历页面：从 macOS 日历（EventKit via cal-bridge）读取，只读展示。
// 独立 view（导航栏「日历」入口），月历视图：格子内显示事件块，点击日期看详情。

import { readCalendar, type CalendarData, type CalEvent, type CalReminder } from "./io";
import { toast } from "./ui";

let cache: CalendarData | null = null;
let loadedAt = 0;

// 选中日期 + 当前显示月份
let selectedDate = todayStr();
const now = new Date();
let viewYear = now.getFullYear();
let viewMonth = now.getMonth(); // 0-11

/** 进入日历页：懒加载 + 渲染。 */
export async function showCalendar(): Promise<void> {
  const page = document.getElementById("calendarPage");
  if (!page) return;

  const fresh = Date.now() - loadedAt < 30_000 && cache;
  if (fresh) {
    render(cache!);
    return;
  }

  page.innerHTML = '<div class="cp-loading">正在读取 macOS 日历…</div>';
  try {
    cache = await readCalendar(60);
    loadedAt = Date.now();
    render(cache);
  } catch (e) {
    page.innerHTML =
      '<div class="cp-loading">读取日历失败<br><span style="font-size:13px;color:#888;">' +
      ((e as Error).message || String(e)) +
      '<br>请在系统设置中授权 Slate 访问日历</span></div>';
  }
}

/* ============ 交互（暴露给 window） ============ */

export function calPrevMonth(): void {
  viewMonth--;
  if (viewMonth < 0) { viewMonth = 11; viewYear--; }
  if (cache) render(cache);
}

export function calNextMonth(): void {
  viewMonth++;
  if (viewMonth > 11) { viewMonth = 0; viewYear++; }
  if (cache) render(cache);
}

export function calGoToday(): void {
  const t = new Date();
  selectedDate = todayStr();
  viewYear = t.getFullYear();
  viewMonth = t.getMonth();
  if (cache) render(cache);
}

/** 日/周/月视图切换（当前只实现月视图）。 */
export function calSwitchView(view: string): void {
  if (view === "month") return;
  toast(view === "day" ? "日视图待实现" : "周视图待实现", 2000);
}

export function calSelectDate(date: string): void {
  selectedDate = date;
  if (cache) render(cache);
}

/** 从迷你月历跳转到某天（切换到该月并选中）。 */
export function calJumpDate(date: string): void {
  selectedDate = date;
  const parts = date.split("-");
  viewYear = parseInt(parts[0], 10);
  viewMonth = parseInt(parts[1], 10) - 1;
  if (cache) render(cache);
}

export function calEventClick(title: string, start: string, end: string, calendar: string, location: string): void {
  let detail = title;
  if (start && end) detail += `\n${start.slice(5, 16)} → ${end.slice(11, 16)}`;
  if (location) detail += `\n📍 ${location}`;
  detail += `\n${calendar} · 只读，编辑请在 macOS 日历进行`;
  toast(detail, 3000);
}

/* ============ 渲染 ============ */

function render(data: CalendarData): void {
  const page = document.getElementById("calendarPage");
  if (!page) return;

  const events = data.events ?? [];
  const reminders = data.reminders ?? [];

  // 有事件的日期集合 + 按日期分组
  const eventDays = new Set<string>();
  const byDay = new Map<string, CalEvent[]>();
  for (const ev of events) {
    const day = ev.start.slice(0, 10);
    eventDays.add(day);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(ev);
  }
  const remindersByDay = new Map<string, typeof reminders>();
  for (const r of reminders) {
    if (!r.due) continue;
    const day = r.due.slice(0, 10);
    eventDays.add(day);
    if (!remindersByDay.has(day)) remindersByDay.set(day, []);
    remindersByDay.get(day)!.push(r);
  }

  let html = `<div class="cp-body"><div class="cp-main">`;

  // ===== Header =====
  html += `<div class="cp-header">
    <div class="cp-title">${viewYear}年${viewMonth + 1}月</div>
    <div class="cp-nav">
      <button onclick="calPrevMonth()">‹</button>
      <button class="cp-today-btn" onclick="calGoToday()">今天</button>
      <button onclick="calNextMonth()">›</button>
    </div>
    <div class="cp-view-switch">
      <button onclick="calSwitchView('day')">日</button>
      <button onclick="calSwitchView('week')">周</button>
      <button class="active" onclick="calSwitchView('month')">月</button>
    </div>
  </div>`;

  // ===== 星期头 =====
  html += `<div class="cp-weekdays">`;
  ["日", "一", "二", "三", "四", "五", "六"].forEach((w, i) => {
    html += `<span class="${i === 0 || i === 6 ? "wkd" : ""}">${w}</span>`;
  });
  html += `</div>`;

  // ===== 月历网格 =====
  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=日
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const today = todayStr();

  // 上月末尾补齐
  const prevDays = new Date(viewYear, viewMonth, 0).getDate();
  const cells: string[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevDays - i;
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const dateStr = `${prevYear}-${pad(prevMonth + 1)}-${pad(d)}`;
    cells.push(renderCell(dateStr, d, true, byDay, remindersByDay, today));
  }
  // 当月
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;
    cells.push(renderCell(dateStr, d, false, byDay, remindersByDay, today));
  }
  // 下月补齐到 42 格
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  let nextD = 1;
  while (cells.length < totalCells) {
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const dateStr = `${nextYear}-${pad(nextMonth + 1)}-${pad(nextD)}`;
    cells.push(renderCell(dateStr, nextD, true, byDay, remindersByDay, today));
    nextD++;
  }

  html += `<div class="cp-grid">${cells.join("")}</div>`;

  // ===== 选中日期详情 =====
  const selEvents = byDay.get(selectedDate)?.sort((a, b) => a.start.localeCompare(b.start)) ?? [];
  const selReminders = remindersByDay.get(selectedDate) ?? [];

  html += `<div class="cp-detail">
    <div class="cpd-title">${dateLabel(selectedDate)}</div>
    <div class="cpd-list">`;

  if (!selEvents.length && !selReminders.length) {
    html += `<div class="cpd-empty">当天无日程</div>`;
  }
  for (const ev of selEvents) {
    const state = eventState(ev);
    const time = ev.allDay ? "全天" : ev.start.slice(11, 16);
    const c = softColors(ev.color || "#6b8ee8");
    html += `
      <div class="cpd-item ${state}" onclick="calEventClick('${escAttr(ev.title)}', '${escAttr(ev.start)}', '${escAttr(ev.end)}', '${escAttr(ev.calendar)}', '${escAttr(ev.location || "")}')">
        <span class="cpd-bar" style="background:${c.fg}"></span>
        <span class="cpd-time">${time}</span>
        <span class="cpd-title-text">${escHtml(ev.title)}</span>
        ${state === "ongoing" ? '<span class="cpd-ongoing">进行中</span>' : ""}
        ${ev.location ? `<span class="cpd-loc">📍 ${escHtml(ev.location)}</span>` : ""}
      </div>`;
  }
  for (const r of selReminders) {
    html += `
      <div class="cpd-item reminder" onclick="calEventClick('${escAttr(r.title)}', '', '', '${escAttr(r.calendar)}', '')">
        <span class="cpd-bar" style="background:#c9a35a"></span>
        <span class="cpd-time">☐</span>
        <span class="cpd-title-text">${escHtml(r.title)}</span>
      </div>`;
  }

  html += `</div></div>`;
  html += `</div>`; // 关闭 cp-main
  html += renderSidePanel(data);
  html += `</div>`; // 关闭 cp-body

  page.innerHTML = html;
}

/** 右侧侧边栏：迷你月历（下月预览）+ 清单列表。 */
function renderSidePanel(data: CalendarData): string {
  let html = `<div class="cp-side">`;
  html += renderMiniMonth();
  html += renderLists(data);
  html += `</div>`;
  return html;
}

/** 迷你月历：下月预览，点击日期跳转。 */
function renderMiniMonth(): string {
  const nextM = viewMonth + 1;
  const nextY = nextM > 11 ? viewYear + 1 : viewYear;
  const nm = nextM > 11 ? 0 : nextM;
  const firstDay = new Date(nextY, nm, 1).getDay();
  const daysInMonth = new Date(nextY, nm + 1, 0).getDate();
  const today = todayStr();

  let html = `<div class="cs-mini">
    <div class="cs-mini-title">${nextY}年${nm + 1}月</div>
    <div class="cs-mini-week">${["日","一","二","三","四","五","六"].map((w) => `<span>${w}</span>`).join("")}</div>
    <div class="cs-mini-days">`;
  for (let i = 0; i < firstDay; i++) html += `<span class="empty"></span>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${nextY}-${pad(nm + 1)}-${pad(d)}`;
    const cls = dateStr === today ? "mini-today" : "";
    html += `<span class="${cls}" onclick="calJumpDate('${dateStr}')">${d}</span>`;
  }
  html += `</div></div>`;
  return html;
}

/** 清单列表（macOS 提醒事项的清单）。 */
function renderLists(data: CalendarData): string {
  const lists = data.lists ?? [];
  let html = `<div class="cs-lists">
    <div class="cs-lists-title">清单</div>`;
  if (!lists.length) {
    html += `<div class="cs-lists-empty">无清单</div>`;
  }
  for (const l of lists) {
    const c = softColors(l.color || "#6b8ee8");
    html += `<div class="cs-list">
      <div class="cs-list-head">
        <span class="cs-list-dot" style="background:${c.fg}"></span>
        <span class="cs-list-name">${escHtml(l.title)}</span>
        <span class="cs-list-count">${l.items.length}</span>
      </div>`;
    for (const item of l.items.slice(0, 10)) {
      html += `<div class="cs-list-item"><span class="cs-check">☐</span>${escHtml(item)}</div>`;
    }
    if (l.items.length > 10) {
      html += `<div class="cs-list-more">+${l.items.length - 10} 更多</div>`;
    }
    html += `</div>`;
  }
  html += `</div>`;
  return html;
}

function renderCell(
  dateStr: string,
  dayNum: number,
  otherMonth: boolean,
  byDay: Map<string, CalEvent[]>,
  remindersByDay: Map<string, CalReminder[]>,
  today: string
): string {
  const cls = [
    "cp-cell",
    otherMonth ? "other-month" : "",
    dateStr === today ? "today" : "",
    dateStr === selectedDate ? "selected" : "",
  ].join(" ");

  const events = byDay.get(dateStr)?.sort((a, b) => a.start.localeCompare(b.start)) ?? [];
  const reminders = remindersByDay.get(dateStr) ?? [];

  let inner = `<div class="cp-daynum">${dayNum}</div>`;
  const shown = [...events.slice(0, 3)];
  for (const ev of shown) {
    const time = ev.allDay ? "" : `<span class="cp-ev-time">${ev.start.slice(11, 16)} </span>`;
    const c = softColors(ev.color || "#6b8ee8");
    inner += `<div class="cp-event" style="background:${c.bg};color:${c.fg}" onclick="calEventClick('${escAttr(ev.title)}', '${escAttr(ev.start)}', '${escAttr(ev.end)}', '${escAttr(ev.calendar)}', '${escAttr(ev.location || "")}')">${time}${escHtml(ev.title)}</div>`;
  }
  for (const r of reminders.slice(0, 2)) {
    inner += `<div class="cp-event" style="background:#f5e9c9;color:#8a6d3b" onclick="calEventClick('${escAttr(r.title)}', '', '', '${escAttr(r.calendar)}', '')">☐ ${escHtml(r.title)}</div>`;
  }
  const total = events.length + reminders.length;
  const shownCount = shown.length + Math.min(reminders.length, 2);
  if (total > shownCount) {
    inner += `<div class="cp-more">更多${total - shownCount}项</div>`;
  }

  return `<div class="${cls}" onclick="calSelectDate('${dateStr}')">${inner}</div>`;
}

/* ============ 工具 ============ */

/** 把事件真实颜色转成「柔和浅底 + 同色系深字」的马卡龙配色。
 *  参考图事件块：浅蓝底 #90c0e0 + 深蓝字 #306080。 */
function softColors(hex: string): { bg: string; fg: string } {
  const r = parseInt(hex.slice(1, 3), 16) || 107;
  const g = parseInt(hex.slice(3, 5), 16) || 142;
  const b = parseInt(hex.slice(5, 7), 16) || 232;
  // 浅底：混白 65%
  const br = Math.round(r + (255 - r) * 0.65);
  const bg = Math.round(g + (255 - g) * 0.65);
  const bb = Math.round(b + (255 - b) * 0.65);
  // 深字：原色乘 0.38
  const tr = Math.round(r * 0.38);
  const tg = Math.round(g * 0.38);
  const tb = Math.round(b * 0.38);
  return { bg: `rgb(${br},${bg},${bb})`, fg: `rgb(${tr},${tg},${tb})` };
}

function eventState(ev: CalEvent): "ongoing" | "past" | "future" {
  const n = new Date();
  const start = new Date(ev.start.replace(" ", "T"));
  const end = new Date(ev.end.replace(" ", "T"));
  if (n >= start && n <= end) return "ongoing";
  if (end < n) return "past";
  return "future";
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function dateLabel(day: string): string {
  const d = new Date(day + "T00:00:00");
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const wd = weekdays[d.getDay()];
  const md = `${d.getMonth() + 1}月${d.getDate()}日`;
  const today = todayStr();
  if (day === today) return `今天 · ${md} ${wd}`;
  return `${md} ${wd}`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escAttr(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;").replace(/\n/g, " ");
}
