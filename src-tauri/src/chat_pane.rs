//! 对话视图原生子 webview 面板。
//!
//! 背景：对话 UI 原以 iframe 挂在壳页面里，与壳 + CodeMirror 共享同一个
//! WKWebView 主线程 → 流式渲染（JSON.parse + morphdom diff）被编辑器抢占，
//! 这是"对话比 chrome 单独标签页卡"的主因之一。这里把 chat/index.html 移入
//! 独立子 webview：macOS 上每个 WKWebView 有独立主线程，事件循环互不阻塞，
//! 对话回到接近"浏览器独立标签页"的运行条件。
//!
//! 壳（index.html）通过 invoke chat_pane_show/hide/reload 控制显示与刷新；
//! 窗口缩放由 on_window_event 重排（固定 44px 侧栏 + 32px 拖拽区偏移，
//! 不能用 auto_resize 的比例模式——侧栏宽度固定不随窗口缩放）。

use std::sync::Mutex;
use tauri::{LogicalPosition, LogicalSize, Runtime, Window};

/// 内容区偏移：左侧 44px 导航侧栏 + 顶部 32px 拖拽区（与 index.html 布局一致）
const SIDEBAR_W: f64 = 44.0;
const DRAG_H: f64 = 32.0;
/// 子 webview 最小尺寸（窗口缩得过小时兜底）
const MIN_W: f64 = 200.0;
const MIN_H: f64 = 200.0;

/// 串行化首次创建，避免快速点击导航时并发 add_child 撞车
static CREATE_LOCK: Mutex<()> = Mutex::new(());

/// 对话子 webview 应占据的逻辑坐标与尺寸。
fn chat_bounds<R: Runtime>(window: &Window<R>) -> (LogicalPosition<f64>, LogicalSize<f64>) {
    let scale = window.scale_factor().unwrap_or(1.0);
    let inner = window.inner_size().unwrap_or_default().to_logical::<f64>(scale);
    let w = (inner.width - SIDEBAR_W).max(MIN_W);
    let h = (inner.height - DRAG_H).max(MIN_H);
    (LogicalPosition::new(SIDEBAR_W, DRAG_H), LogicalSize::new(w, h))
}

/// 设置子 webview 的原生 autoresizingMask：固定左缘(44px)/上缘(32px)，宽高跟随窗口弹性伸缩。
///
/// 为什么需要：wry 对子 webview 默认不设 autoresizing，窗口缩放时 frame 不会跟随；
/// 之前靠 Resized 事件 + 异步 set_bounds 消息补齐，但消息队列有延迟，窗口拖动/最小化恢复时
/// 子 webview frame 滞后 → 显示异常 + 滚动区域越界。autoresizing 由 AppKit 在布局阶段同步处理，
/// 与主 webview 同一节奏，彻底消除滞后。
#[cfg(target_os = "macos")]
fn apply_native_autoresize<R: Runtime>(wv: &tauri::Webview<R>) {
    use objc2_app_kit::{NSAutoresizingMaskOptions, NSView};
    match wv.with_webview(|platform_wv| unsafe {
        let view: &NSView = &*platform_wv.inner().cast();
        let mask = NSAutoresizingMaskOptions::ViewWidthSizable
            | NSAutoresizingMaskOptions::ViewHeightSizable
            | NSAutoresizingMaskOptions::ViewMaxXMargin
            | NSAutoresizingMaskOptions::ViewMinYMargin;
        view.setAutoresizingMask(mask);
    }) {
        Ok(()) => log::info!("[chat_pane] autoresizingMask=Width|Height|MaxXMargin|MinYMargin 已应用"),
        Err(e) => log::error!("[chat_pane] 设置 autoresizingMask 失败: {e}"),
    }
}

fn find_chat<R: Runtime>(window: &Window<R>) -> Option<tauri::Webview<R>> {
    window.webviews().into_iter().find(|w| w.label() == "chat")
}

/// 确保子 webview 已创建（首次 show 时懒创建，避免启动开销）。
fn ensure_chat<R: Runtime>(window: &Window<R>) -> Result<tauri::Webview<R>, String> {
    if let Some(wv) = find_chat(window) {
        return Ok(wv);
    }
    let _guard = CREATE_LOCK
        .lock()
        .map_err(|_| "chat pane create lock poisoned".to_string())?;
    if let Some(wv) = find_chat(window) {
        return Ok(wv);
    }
    let builder = tauri::webview::WebviewBuilder::new(
        "chat",
        tauri::WebviewUrl::App("chat/index.html".into()),
    )
    .accept_first_mouse(true);
    let (pos, size) = chat_bounds(window);
    log::info!("[chat_pane] 创建子 webview @({}, {}) {}x{}", pos.x, pos.y, size.width, size.height);
    let wv = window.add_child(builder, pos, size).map_err(|e| e.to_string())?;
    // 窗口缩放由 AppKit 原生 autoresizing 接管（同步、无消息延迟）
    #[cfg(target_os = "macos")]
    apply_native_autoresize(&wv);
    Ok(wv)
}

#[tauri::command]
pub fn chat_pane_show(window: tauri::Window) -> Result<(), String> {
    let wv = ensure_chat(&window)?;
    wv.show().map_err(|e| e.to_string())?;
    let _ = wv.set_focus();
    log::info!("[chat_pane] show");
    Ok(())
}

#[tauri::command]
pub fn chat_pane_hide(window: tauri::Window) -> Result<(), String> {
    if let Some(wv) = find_chat(&window) {
        wv.hide().map_err(|e| e.to_string())?;
        log::info!("[chat_pane] hide");
    }
    Ok(())
}

#[tauri::command]
pub fn chat_pane_reload(window: tauri::Window) -> Result<(), String> {
    if let Some(wv) = find_chat(&window) {
        wv.eval("location.reload()").map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// 重算子 webview 的固定偏移边界（Resized / ScaleFactorChanged 共用）。
fn apply_chat_bounds<R: Runtime>(window: &Window<R>, inner: tauri::PhysicalSize<u32>) {
    if let Some(wv) = find_chat(window) {
        let scale = window.scale_factor().unwrap_or(1.0);
        let inner = inner.to_logical::<f64>(scale);
        let w = (inner.width - SIDEBAR_W).max(MIN_W);
        let h = (inner.height - DRAG_H).max(MIN_H);
        let _ = wv.set_position(LogicalPosition::new(SIDEBAR_W, DRAG_H));
        let _ = wv.set_size(LogicalSize::new(w, h));
        log::debug!("[chat_pane] 重排 @(44, 32) {}x{}", w, h);
    }
}

/// 窗口缩放 / 换屏时跟随重排。
///
/// 主路径是 autoresizingMask（AppKit 同步处理，不依赖此 handler）；
/// 此 handler 是兜底 + 覆盖换屏（scale factor 变化）场景。
pub fn on_window_event<R: Runtime>(window: &Window<R>, event: &tauri::WindowEvent) {
    match event {
        tauri::WindowEvent::Resized(size) => apply_chat_bounds(window, *size),
        tauri::WindowEvent::ScaleFactorChanged { new_inner_size, .. } => {
            log::info!("[chat_pane] scale factor 变化，重排");
            apply_chat_bounds(window, *new_inner_size);
        }
        _ => {}
    }
}
