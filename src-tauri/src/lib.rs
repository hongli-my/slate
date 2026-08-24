mod chat_pane;
mod fs_ops;
mod otel;
mod pi_bridge;
mod recents;

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    Emitter, Manager, Runtime,
};

fn build_menu<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<Menu<R>> {
    // macOS 第一个 Submenu 并入粗体应用名栏
    let app_submenu = Submenu::with_items(app, "Slate", true, &[
        &PredefinedMenuItem::about(app, Some("关于 Slate"), None)?,
        &PredefinedMenuItem::separator(app)?,
        &MenuItem::with_id(app, "quit", "退出 Slate", true, Some("CmdOrCtrl+Q"))?,
    ])?;

    let file_submenu = Submenu::with_items(app, "文件", true, &[
        &MenuItem::with_id(app, "open-folder", "打开文件夹", true, Some("CmdOrCtrl+O"))?,
        &MenuItem::with_id(app, "open-file", "打开文件", true, Some("CmdOrCtrl+Shift+O"))?,
        &PredefinedMenuItem::separator(app)?,
        &MenuItem::with_id(app, "new-file", "新建", true, Some("CmdOrCtrl+N"))?,
        &MenuItem::with_id(app, "save", "保存", true, Some("CmdOrCtrl+S"))?,
        &PredefinedMenuItem::separator(app)?,
        &MenuItem::with_id(app, "delete", "删除当前文件", true, None::<&str>)?,
    ])?;

    // 编辑菜单：macOS WKWebView 必须有标准 Edit 菜单项，
    // 否则 Cmd+C / Cmd+V / Cmd+X / Cmd+A 不会路由到 webview
    let edit_submenu = Submenu::with_items(app, "编辑", true, &[
        &PredefinedMenuItem::undo(app, None)?,
        &PredefinedMenuItem::redo(app, None)?,
        &PredefinedMenuItem::separator(app)?,
        &PredefinedMenuItem::cut(app, None)?,
        &PredefinedMenuItem::copy(app, None)?,
        &PredefinedMenuItem::paste(app, None)?,
        &PredefinedMenuItem::select_all(app, None)?,
    ])?;

    // 视图切换菜单项：加速键走原生菜单系统，子 webview（对话）聚焦时也能生效，
    // 不受"keydown 不跨 webview 冒泡"的限制。
    let view_submenu = Submenu::with_items(app, "视图", true, &[
        &MenuItem::with_id(app, "view-editor", "编辑器", true, Some("CmdOrCtrl+1"))?,
        &MenuItem::with_id(app, "view-onetab", "OneTab", true, Some("CmdOrCtrl+2"))?,
        &MenuItem::with_id(app, "view-otel", "OTel", true, Some("CmdOrCtrl+3"))?,
        &MenuItem::with_id(app, "view-chat", "对话", true, Some("CmdOrCtrl+4"))?,
        &PredefinedMenuItem::separator(app)?,
        &MenuItem::with_id(app, "preview", "预览", true, Some("CmdOrCtrl+P"))?,
        &PredefinedMenuItem::separator(app)?,
        &MenuItem::with_id(app, "reload", "重新加载", true, Some("CmdOrCtrl+R"))?,
        &PredefinedMenuItem::fullscreen(app, None)?,
    ])?;

    Menu::with_items(app, &[&app_submenu, &file_submenu, &edit_submenu, &view_submenu])
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .manage(pi_bridge::SidecarState::default())
        .on_window_event(|window, event| {
            chat_pane::on_window_event(window, event);
        })
        .invoke_handler(tauri::generate_handler![
            otel::otel_stats,
            otel::otel_sessions,
            otel::otel_session,
            otel::otel_spans,
            recents::recents_list,
            recents::recents_add,
            recents::recents_clear,
            fs_ops::save_file_atomic,
            fs_ops::file_stat,
            fs_ops::read_text_file_detect,
            fs_ops::search_in_files,
            pi_bridge::start_bridge,
            pi_bridge::stop_bridge,
            pi_bridge::restart_bridge,
            pi_bridge::bridge_status,
            chat_pane::chat_pane_show,
            chat_pane::chat_pane_hide,
            chat_pane::chat_pane_reload,
        ])
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_shortcuts(["CmdOrCtrl+Shift+E"])
                .expect("failed to parse global shortcut")
                .with_handler(|app, _shortcut, event| {
                    if event.state != tauri_plugin_global_shortcut::ShortcutState::Pressed {
                        return;
                    }
                    if let Some(win) = app.get_webview_window("main") {
                        if win.is_visible().unwrap_or(false) {
                            let _ = win.set_focus();
                        } else {
                            let _ = win.show();
                            let _ = win.set_focus();
                        }
                    }
                })
                .build(),
        )
        .menu(build_menu)
        .on_menu_event(|app, event| {
            let id = event.id().as_ref();
            match id {
                "quit" => app.exit(0),
                "reload" => {
                    if let Some(win) = app.get_webview_window("main") {
                        let _ = win.eval("location.reload()");
                    }
                }
                // 其余菜单项转发给前端
                _ => {
                    let _ = app.emit("menu-action", id);
                }
            }
        })
        .setup(|app| {
            // 日志始终开启（release 也写 ~/Library/Logs/com.slate.app/），
            // 便于定位子 webview / sidecar 运行问题
            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .level(log::LevelFilter::Info)
                    .build(),
            )?;
            // app 启动自动拉起 pi-bridge sidecar（异步，不阻塞 setup）
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = pi_bridge::spawn_sidecar(&handle) {
                    log::error!("failed to start pi-bridge on startup: {e}");
                }
            });
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            // 进程退出时清理 sidecar（注意是 Exit，不是 ExitRequested）
            if let tauri::RunEvent::Exit = event {
                let state = app_handle.state::<pi_bridge::SidecarState>();
                let _ = pi_bridge::stop_internal(&state);
            }
        });
}
