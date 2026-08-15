use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentItem {
    pub kind: String, // "folder" | "file"
    pub path: String,
    pub name: String,
    pub time: u64,
}

const MAX_RECENTS: usize = 30;

fn recents_file(app: &tauri::AppHandle) -> PathBuf {
    app.path()
        .app_data_dir()
        .unwrap_or_else(|_| std::env::temp_dir())
        .join("recents.json")
}

fn load(app: &tauri::AppHandle) -> Vec<RecentItem> {
    fs::read_to_string(recents_file(app))
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

#[tauri::command]
pub fn recents_list(app: tauri::AppHandle) -> Vec<RecentItem> {
    load(&app)
}

#[tauri::command]
pub fn recents_add(
    app: tauri::AppHandle,
    item: RecentItem,
) -> Result<Vec<RecentItem>, String> {
    let mut list = load(&app);
    // 同类型同路径去重，新纪录置顶
    list.retain(|r| !(r.kind == item.kind && r.path == item.path));
    list.insert(0, item);
    list.truncate(MAX_RECENTS);

    let file = recents_file(&app);
    if let Some(dir) = file.parent() {
        let _ = fs::create_dir_all(dir);
    }
    fs::write(&file, serde_json::to_string_pretty(&list).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;
    Ok(list)
}

#[tauri::command]
pub fn recents_clear(app: tauri::AppHandle) -> Result<(), String> {
    let _ = fs::remove_file(recents_file(&app));
    Ok(())
}
