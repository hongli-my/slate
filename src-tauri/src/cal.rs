//! macOS 日历集成 — 通过 cal-bridge（Swift + EventKit）读取日历事件 + 提醒事项。
//!
//! 设计：日历数据源是 macOS 系统（Calendar + Reminders），Slate 只读不存储。
//! EventKit 是 Swift/ObjC 框架，Rust 无法直接调用，因此走「Swift 小工具输出 JSON」
//! 的 sidecar 模式（与 pi-bridge 同理，通过 externalBin 打包进 app bundle）。

use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;

/// 读取未来 `days` 天的日历事件 + 未完成提醒事项。
/// 返回 cal-bridge 输出的 JSON 字符串，前端自行解析。
#[tauri::command]
pub async fn read_calendar(app: AppHandle, days: i64) -> Result<String, String> {
    let days = days.clamp(1, 90);

    let output = app
        .shell()
        .sidecar("cal-bridge")
        .map_err(|e| format!("解析 cal-bridge sidecar 失败: {e}"))?
        .args([days.to_string()])
        .output()
        .await
        .map_err(|e| format!("执行 cal-bridge 失败: {e}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if output.status.success() {
        Ok(stdout)
    } else {
        Err(stderr)
    }
}
