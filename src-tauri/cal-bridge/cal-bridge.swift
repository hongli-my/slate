#!/usr/bin/env swift
// cal-bridge.swift — 从 macOS 日历/提醒事项读取数据，输出 JSON
// 用法: swift cal-bridge.swift [days]
// 输出: {"events":[...], "reminders":[...]}

import EventKit
import Foundation
import AppKit

let days = CommandLine.arguments.count > 1 ? Int(CommandLine.arguments[1]) ?? 7 : 7
let store = EKEventStore()

func hexColor(_ color: NSColor) -> String {
    guard let rgb = color.usingColorSpace(.sRGB) else { return "#8ab4f8" }
    let r = Int(round(rgb.redComponent * 255))
    let g = Int(round(rgb.greenComponent * 255))
    let b = Int(round(rgb.blueComponent * 255))
    return String(format: "#%02x%02x%02x", r, g, b)
}

func jsonEscape(_ s: String) -> String {
    // 手动转义，返回不带引号的转义字符串（模板里自行加引号）
    s.replacingOccurrences(of: "\\", with: "\\\\")
     .replacingOccurrences(of: "\"", with: "\\\"")
     .replacingOccurrences(of: "\n", with: "\\n")
     .replacingOccurrences(of: "\r", with: "\\r")
     .replacingOccurrences(of: "\t", with: "\\t")
}

// 请求权限（macOS 14+ API）——用 RunLoop 轮询 + 15s 超时，避免授权框无人点时无限卡住
func requestAccess() -> Bool {
    var ok = false
    var done = false
    if #available(macOS 14.0, *) {
        store.requestFullAccessToEvents { (granted, _) in
            ok = granted
            done = true
        }
    } else {
        store.requestAccess(to: .event) { (granted, _) in
            ok = granted
            done = true
        }
    }
    let deadline = Date().addingTimeInterval(15)
    while !done && Date() < deadline {
        RunLoop.main.run(until: Date().addingTimeInterval(0.1))
    }
    return done && ok
}

guard requestAccess() else {
    print("{\"error\":\"calendar_access_denied\",\"events\":[],\"reminders\":[]}")
    exit(0)
}

let now = Date()
let start = Calendar.current.date(byAdding: .day, value: -30, to: now)!
let end = Calendar.current.date(byAdding: .day, value: days, to: now)!

// 事件
var eventsJson: [String] = []
let predicate = store.predicateForEvents(withStart: start, end: end, calendars: nil)
let events = store.events(matching: predicate)
for ev in events {
    let df = DateFormatter()
    df.dateFormat = "yyyy-MM-dd HH:mm"
    let t = jsonEscape(ev.title ?? "无标题")
    let cal = jsonEscape(ev.calendar.title)
    let loc = ev.location.map { jsonEscape($0) } ?? "null"
    let color = jsonEscape(hexColor(ev.calendar.color))
    eventsJson.append("{\"title\":\"\(t)\",\"start\":\"\(df.string(from: ev.startDate))\",\"end\":\"\(df.string(from: ev.endDate))\",\"calendar\":\"\(cal)\",\"location\":\(loc),\"allDay\":\(ev.isAllDay),\"color\":\"\(color)\"}")
}

// 提醒事项（未完成）—— fetchReminders 回调也要主线程，同样用 RunLoop 轮询
var remindersJson: [String] = []
let remPredicate = store.predicateForIncompleteReminders(withDueDateStarting: now, ending: end, calendars: nil)
var remDone = false
store.fetchReminders(matching: remPredicate) { reminders in
    if let reminders = reminders {
        for r in reminders {
            let t = jsonEscape(r.title ?? "无标题")
            let cal = jsonEscape(r.calendar.title)
            let color = jsonEscape(hexColor(r.calendar.color))
            var due = "null"
            if let d = r.dueDateComponents?.date {
                let df = DateFormatter()
                df.dateFormat = "yyyy-MM-dd HH:mm"
                due = "\"\(df.string(from: d))\""
            }
            remindersJson.append("{\"title\":\"\(t)\",\"calendar\":\"\(cal)\",\"due\":\(due),\"done\":\(r.isCompleted),\"color\":\"\(color)\"}")
        }
    }
    remDone = true
}
while !remDone {
    RunLoop.main.run(until: Date().addingTimeInterval(0.1))
}

// 清单（reminder 类型日历）+ 各清单未完成任务（用于右侧侧边栏）
func fetchListItems(_ cal: EKCalendar) -> [String] {
    let pred = store.predicateForIncompleteReminders(withDueDateStarting: nil, ending: nil, calendars: [cal])
    var items: [String] = []
    var done = false
    store.fetchReminders(matching: pred) { reminders in
        if let reminders = reminders {
            for r in reminders {
                items.append(jsonEscape(r.title ?? "无标题"))
            }
        }
        done = true
    }
    while !done {
        RunLoop.main.run(until: Date().addingTimeInterval(0.1))
    }
    return items
}
var listsJson: [String] = []
for cal in store.calendars(for: .reminder) {
    let title = jsonEscape(cal.title)
    let color = jsonEscape(hexColor(cal.color))
    let items = fetchListItems(cal)
    let itemsStr = items.map { "\"\($0)\"" }.joined(separator: ",")
    listsJson.append("{\"title\":\"\(title)\",\"color\":\"\(color)\",\"items\":[\(itemsStr)]}")
}

let out = "{\"events\":[\(eventsJson.joined(separator: ","))],\"reminders\":[\(remindersJson.joined(separator: ","))],\"lists\":[\(listsJson.joined(separator: ","))]}"
print(out)
