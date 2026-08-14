// otel.rs — OpenTelemetry 数据层（rusqlite 重写 Lua db.lua）
// 4 个 Tauri command: otel_stats / otel_sessions / otel_session / otel_spans

use rusqlite::{params, types::Value as SqlVal, Connection, OpenFlags};
use serde_json::{json, Value};
use std::collections::{HashMap, HashSet, VecDeque};
use std::sync::Mutex;

const DB_PATH_OPENCODE: &str = "/Users/honglichang/.local/share/opencode/otel.db";
const DB_PATH_PI: &str = "/Users/honglichang/.local/share/pi/otel.db";

static TITLE_CACHE: std::sync::OnceLock<Mutex<HashMap<String, Option<String>>>> =
    std::sync::OnceLock::new();

fn title_cache() -> &'static Mutex<HashMap<String, Option<String>>> {
    TITLE_CACHE.get_or_init(|| Mutex::new(HashMap::new()))
}

fn open_otel_db_at(path: &str) -> Result<Connection, String> {
    let conn = Connection::open_with_flags(
        path,
        OpenFlags::SQLITE_OPEN_READ_ONLY | OpenFlags::SQLITE_OPEN_NO_MUTEX,
    )
    .map_err(|e| format!("open otel.db: {}", e))?;
    conn.busy_timeout(std::time::Duration::from_secs(5))
        .map_err(|e| format!("set busy_timeout: {}", e))?;
    conn.execute_batch(
        "PRAGMA mmap_size = 268435456; PRAGMA cache_size = -64000; PRAGMA temp_store = MEMORY;",
    )
    .map_err(|e| format!("set pragmas: {}", e))?;
    Ok(conn)
}

static DB_POOL: std::sync::OnceLock<Mutex<Vec<Connection>>> = std::sync::OnceLock::new();

/// 打开 opencode + pi 两个 otel.db；缺失或打开失败的库被静默跳过，
/// 因此 Slate 在仅有 opencode 库（或 pi 库尚未创建）时也能正常工作。
///
/// 复用全局连接池：只读连接打开后缓存，避免每次命令调用都重开（大体积
/// 库重开需重建 mmap 映射 + page cache，30s 自动刷新下累积开销明显）。
/// 池为空（首次调用或库此前缺失）时重新探测打开；已缓存连接直接复用。
fn open_otel_dbs() -> std::sync::MutexGuard<'static, Vec<Connection>> {
    let pool = DB_POOL.get_or_init(|| Mutex::new(Vec::new()));
    let mut guard = pool.lock().unwrap_or_else(|e| e.into_inner());
    if guard.is_empty() {
        *guard = [DB_PATH_OPENCODE, DB_PATH_PI]
            .iter()
            .filter_map(|path| open_otel_db_at(path).ok())
            .collect();
    }
    guard
}

// ============================================================
// Helpers
// ============================================================

fn to_str_opt(v: Option<&Value>) -> Option<String> {
    match v {
        Some(Value::String(s)) => Some(s.clone()),
        Some(Value::Number(n)) => Some(n.to_string()),
        Some(Value::Bool(b)) => Some(b.to_string()),
        Some(Value::Null) | None => None,
        Some(other) => Some(other.to_string()),
    }
}

fn to_num_opt(v: Option<&Value>) -> i64 {
    match v {
        Some(Value::Number(n)) => n.as_i64().unwrap_or(0),
        Some(Value::String(s)) => s.parse().unwrap_or(0),
        _ => 0,
    }
}

/// 容错读取整数列：SQLite 动态类型，MAX/MIN 聚合或混入 REAL 值时
/// 列可能返回 Real 而非 Integer，此处统一兜底。
fn ri(row: &rusqlite::Row, idx: usize) -> rusqlite::Result<i64> {
    Ok(match row.get::<_, SqlVal>(idx)? {
        SqlVal::Integer(n) => n,
        SqlVal::Real(f) => f as i64,
        _ => 0,
    })
}

fn utf8_truncate(s: &str, max_bytes: usize) -> String {
    if s.len() <= max_bytes {
        return s.to_string();
    }
    let mut end = max_bytes;
    while end > 0 && !s.is_char_boundary(end) {
        end -= 1;
    }
    s[..end].to_string()
}

fn collapse_ws(s: &str) -> String {
    s.split_whitespace().collect::<Vec<_>>().join(" ")
}

fn parse_json(s: &str) -> Value {
    if s.is_empty() {
        return json!({});
    }
    serde_json::from_str(s).unwrap_or(json!({}))
}

fn merge_json(base: &serde_json::Map<String, Value>, extra: Value) -> Value {
    let mut map = base.clone();
    if let Some(extra_map) = extra.as_object() {
        for (k, v) in extra_map {
            map.insert(k.clone(), v.clone());
        }
    }
    Value::Object(map)
}

fn today_start_ms() -> i64 {
    // macOS date: epoch seconds at local midnight
    let out = std::process::Command::new("date")
        .args(["-v", "0H", "-v", "0M", "-v", "0S", "+%s"])
        .output();
    match out {
        Ok(o) => {
            let s = String::from_utf8_lossy(&o.stdout).trim().to_string();
            s.parse::<i64>().unwrap_or(0) * 1000
        }
        Err(_) => 0,
    }
}

// ============================================================
// 跨库查 opencode.db title
// ============================================================

fn get_opencode_title(session_id: &str, profile: Option<&str>) -> Option<String> {
    if session_id.is_empty() {
        return None;
    }

    let cache_key = format!("{}|{}", profile.unwrap_or(""), session_id);
    {
        let cache = title_cache().lock().unwrap();
        if let Some(cached) = cache.get(&cache_key) {
            return cached.clone();
        }
    }

    let home = std::env::var("HOME").unwrap_or_else(|_| "/Users/honglichang".to_string());
    let profiles_dir = format!("{}/.local/share/opencode/profiles", home);

    // Build candidate paths (profile-specific first, then root, then all profiles)
    let mut candidates: Vec<String> = vec![];
    let mut seen = HashSet::new();

    if let Some(p) = profile {
        if !p.is_empty() && p != "default" {
            let path = format!("{}/{}/opencode.db", profiles_dir, p);
            candidates.push(path.clone());
            seen.insert(path);
        }
    }

    let root_path = format!("{}/.local/share/opencode/opencode.db", home);
    if !seen.contains(&root_path) {
        candidates.push(root_path.clone());
        seen.insert(root_path);
    }

    if let Ok(entries) = std::fs::read_dir(&profiles_dir) {
        for entry in entries.flatten() {
            let db_path = entry.path().join("opencode.db");
            if let Some(s) = db_path.to_str() {
                if db_path.exists() && !seen.contains(&s.to_string()) {
                    candidates.push(s.to_string());
                    seen.insert(s.to_string());
                }
            }
        }
    }

    let mut title: Option<String> = None;
    for path in &candidates {
        if let Ok(conn) = Connection::open_with_flags(
            path,
            OpenFlags::SQLITE_OPEN_READ_ONLY | OpenFlags::SQLITE_OPEN_NO_MUTEX,
        ) {
            let result: rusqlite::Result<Option<String>> = conn.query_row(
                "SELECT title FROM session WHERE id = ? LIMIT 1",
                params![session_id],
                |row| row.get(0),
            );
            if let Ok(Some(t)) = result {
                title = Some(t);
                break;
            }
        }
    }

    let result = title.clone();
    let mut cache = title_cache().lock().unwrap();
    cache.insert(cache_key, title);
    result
}

/// 批量查 opencode.db title：收集所有未缓存的 session_id，
/// 每个 opencode.db 文件只开一次连接，用 WHERE id IN (...) 一次性查完。
fn batch_get_opencode_titles(
    items: &[(String, Option<String>)],
) -> HashMap<String, Option<String>> {
    let mut results: HashMap<String, Option<String>> = HashMap::new();
    if items.is_empty() {
        return results;
    }

    // 1. 检查缓存，收集 miss
    let cache = title_cache().lock().unwrap();
    let mut miss_ids: Vec<String> = Vec::new();
    for (sid, profile) in items {
        let cache_key = format!("{}|{}", profile.as_deref().unwrap_or(""), sid);
        match cache.get(&cache_key) {
            Some(cached) => {
                results.insert(sid.clone(), cached.clone());
            }
            None => {
                if !miss_ids.contains(sid) {
                    miss_ids.push(sid.clone());
                }
            }
        }
    }
    drop(cache);

    if miss_ids.is_empty() {
        return results;
    }

    // 2. 收集候选 opencode.db 路径
    let home = std::env::var("HOME").unwrap_or_else(|_| "/Users/honglichang".to_string());
    let mut candidates: Vec<String> = vec![format!("{}/.local/share/opencode/opencode.db", home)];
    let profiles_dir = format!("{}/.local/share/opencode/profiles", home);
    if let Ok(entries) = std::fs::read_dir(&profiles_dir) {
        for entry in entries.flatten() {
            let db_path = entry.path().join("opencode.db");
            if db_path.exists() {
                if let Some(s) = db_path.to_str() {
                    candidates.push(s.to_string());
                }
            }
        }
    }

    // 3. 逐个 db 文件批量查 WHERE id IN (...)
    let mut found: HashMap<String, String> = HashMap::new();
    for path in &candidates {
        let remaining: Vec<&str> = miss_ids
            .iter()
            .map(|s| s.as_str())
            .filter(|s| !found.contains_key(*s))
            .collect();
        if remaining.is_empty() {
            break;
        }
        if let Ok(conn) = Connection::open_with_flags(
            path,
            OpenFlags::SQLITE_OPEN_READ_ONLY | OpenFlags::SQLITE_OPEN_NO_MUTEX,
        ) {
            for chunk in remaining.chunks(500) {
                let placeholders = (0..chunk.len()).map(|_| "?").collect::<Vec<_>>().join(",");
                let sql = format!("SELECT id, title FROM session WHERE id IN ({})", placeholders);
                let params: Vec<&dyn rusqlite::ToSql> =
                    chunk.iter().map(|s| s as &dyn rusqlite::ToSql).collect();
                if let Ok(mut stmt) = conn.prepare(&sql) {
                    if let Ok(rows) = stmt.query_map(params.as_slice(), |row| {
                        Ok((row.get::<_, String>(0)?, row.get::<_, Option<String>>(1)?))
                    }) {
                        for row in rows.flatten() {
                            if let Some(t) = row.1 {
                                if !t.is_empty() {
                                    found.insert(row.0, t);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // 4. 回写缓存 + 填充 results
    let mut cache = title_cache().lock().unwrap();
    for (sid, profile) in items {
        let cache_key = format!("{}|{}", profile.as_deref().unwrap_or(""), sid);
        let title = found.get(sid).cloned();
        cache.insert(cache_key, title.clone());
        results.entry(sid.clone()).or_insert(title);
    }

    results
}

fn get_pi_session_summary(conn: &Connection, session_id: &str) -> Option<String> {
    let sql = r#"SELECT COALESCE(
        (SELECT json_extract(s2.attributes_json, '$."pi.turn.prompt"')
         FROM spans s2
         WHERE s2.session_id = s.session_id AND s2.name = 'pi.turn'
           AND json_extract(s2.attributes_json, '$."pi.turn.prompt"') IS NOT NULL
         ORDER BY s2.start_ms ASC LIMIT 1),
        (SELECT json_extract(s3.attributes_json, '$."pi.llm.prompt"')
         FROM spans s3
         WHERE s3.session_id = s.session_id AND s3.name = 'pi.llm'
           AND json_extract(s3.attributes_json, '$."pi.llm.prompt"') IS NOT NULL
         ORDER BY s3.start_ms ASC LIMIT 1)
    ) AS summary
    FROM spans s
    WHERE s.session_id = ?
    GROUP BY s.session_id
    LIMIT 1"#;

    let result: rusqlite::Result<Option<String>> =
        conn.query_row(sql, params![session_id], |row| row.get(0));

    result
        .ok()
        .flatten()
        .filter(|s| !s.is_empty())
        .map(|s| utf8_truncate(&s, 200))
}

// ============================================================
// Calls extraction helpers
// ============================================================

fn extract_first_user_prompt(prompt_str: &str) -> String {
    if prompt_str.is_empty() {
        return String::new();
    }
    let prompt: Value = match serde_json::from_str(prompt_str) {
        Ok(v) => v,
        Err(_) => return String::new(),
    };
    let messages = match prompt.get("messages").and_then(|m| m.as_array()) {
        Some(arr) => arr,
        None => return String::new(),
    };
    for m in messages {
        if m.get("role").and_then(|r| r.as_str()) == Some("user") {
            if let Some(content) = m.get("content") {
                if let Some(s) = content.as_str() {
                    return s.to_string();
                }
                if let Some(arr) = content.as_array() {
                    for part in arr {
                        if part.get("type").and_then(|t| t.as_str()) == Some("text") {
                            if let Some(text) = part.get("text").and_then(|t| t.as_str()) {
                                return text.to_string();
                            }
                        }
                    }
                }
            }
        }
    }
    String::new()
}

fn extract_tool_calls(tc_str: &str) -> (Vec<Value>, String) {
    if tc_str.is_empty() {
        return (vec![], String::new());
    }
    let tcs: Vec<Value> = match serde_json::from_str(tc_str) {
        Ok(v) => v,
        Err(_) => return (vec![], String::new()),
    };
    let mut names = vec![];
    let mut list = vec![];
    for tc in tcs {
        if let Some(obj) = tc.as_object() {
            let name = obj
                .get("toolName")
                .or_else(|| obj.get("name"))
                .and_then(|n| n.as_str())
                .unwrap_or("?")
                .to_string();
            names.push(name.clone());
            let input_json = match obj.get("input") {
                Some(Value::String(s)) => s.clone(),
                Some(v) => v.to_string(),
                None => String::new(),
            };
            let tool_call_id = obj
                .get("toolCallId")
                .or_else(|| obj.get("id"))
                .and_then(|i| i.as_str())
                .map(|s| s.to_string());
            list.push(json!({
                "tool_name": name,
                "tool_call_id": tool_call_id,
                "input_json": input_json,
            }));
        }
    }
    let summary = names.join(", ");
    (list, summary)
}

fn list_calls(conn: &Connection, session_id: &str) -> Result<Vec<Value>, String> {
    let sql = r#"SELECT
      name, span_id, parent_span_id, trace_id,
      start_ms, end_ms, duration_ms,
      attributes_json, status_code, status_message
    FROM spans
    WHERE session_id = ?
      AND (name = 'ai.streamText'
           OR name = 'Tool.execute'
           OR name = 'ai.toolCall'
           OR name LIKE 'ai.toolCall.%'
           OR name = 'pi.llm'
           OR name LIKE 'pi.tool.%')
    ORDER BY start_ms ASC"#;

    let mut stmt = conn.prepare(sql).map_err(|e| format!("prepare calls: {}", e))?;
    let rows = stmt
        .query_map(params![session_id], |row| {
            Ok((
                row.get::<_, String>(0)?,       // name
                row.get::<_, String>(1)?,       // span_id
                row.get::<_, Option<String>>(2)?, // parent_span_id
                row.get::<_, String>(3)?,       // trace_id
                ri(row, 4)?,          // start_ms
                ri(row, 5)?,          // end_ms
                ri(row, 6)?,          // duration_ms
                row.get::<_, Option<String>>(7)?, // attributes_json
                row.get::<_, Option<String>>(8)?, // status_code
                row.get::<_, Option<String>>(9)?, // status_message
            ))
        })
        .map_err(|e| format!("query calls: {}", e))?;

    let mut calls = vec![];
    for row_result in rows {
        let (name, span_id, _parent_span_id, trace_id, start_ms, end_ms, duration_ms,
            attrs_str, status_code, status_message) =
            row_result.map_err(|e| format!("row calls: {}", e))?;

        let attrs_str = attrs_str.unwrap_or_default();
        let attrs = parse_json(&attrs_str);
        let empty_map = serde_json::Map::new();
        let attrs_map = attrs.as_object().unwrap_or(&empty_map);

        let base = json!({
            "name": name,
            "span_id": span_id,
            "trace_id": trace_id,
            "start_ms": start_ms,
            "end_ms": end_ms,
            "duration_ms": duration_ms,
            "status_code": status_code,
            "status_message": status_message,
        })
        .as_object()
        .unwrap()
        .clone();

        if name == "ai.streamText" {
            let prompt_summary = utf8_truncate(
                &collapse_ws(&extract_first_user_prompt(
                    attrs_map.get("ai.prompt").and_then(|v| v.as_str()).unwrap_or(""),
                )),
                200,
            );

            let mut response_summary = String::new();
            if let Some(resp_text) = attrs_map.get("ai.response.text").and_then(|v| v.as_str()) {
                if !resp_text.is_empty() {
                    response_summary = resp_text.to_string();
                }
            }
            if response_summary.is_empty() {
                if let Some(reasoning) =
                    attrs_map.get("ai.response.reasoning").and_then(|v| v.as_str())
                {
                    if !reasoning.is_empty() {
                        response_summary = format!("(reasoning) {}", reasoning);
                    }
                }
            }
            response_summary = utf8_truncate(&collapse_ws(&response_summary), 300);

            let finish_reason = to_str_opt(attrs_map.get("ai.response.finishReason"));

            let (mut tc_list, tc_summary) = extract_tool_calls(
                attrs_map
                    .get("ai.response.toolCalls")
                    .and_then(|v| v.as_str())
                    .unwrap_or(""),
            );
            // Truncate each tc.input_json
            for tc in tc_list.iter_mut() {
                if let Some(input) = tc.get("input_json").and_then(|v| v.as_str()) {
                    let truncated = utf8_truncate(input, 300);
                    tc["input_json"] = json!(truncated);
                }
            }

            let input_tokens = {
                let v = to_num_opt(attrs_map.get("gen_ai.usage.input_tokens"));
                if v == 0 {
                    to_num_opt(attrs_map.get("ai.usage.inputTokens"))
                } else {
                    v
                }
            };
            let output_tokens = {
                let v = to_num_opt(attrs_map.get("gen_ai.usage.output_tokens"));
                if v == 0 {
                    to_num_opt(attrs_map.get("ai.usage.outputTokens"))
                } else {
                    v
                }
            };

            let model_provider = to_str_opt(attrs_map.get("gen_ai.system"))
                .or_else(|| to_str_opt(attrs_map.get("ai.model.provider")));
            let model_id = to_str_opt(attrs_map.get("gen_ai.request.model"))
                .or_else(|| to_str_opt(attrs_map.get("ai.model.id")))
                .or_else(|| to_str_opt(attrs_map.get("gen_ai.model")));

            calls.push(merge_json(&base, json!({
                "type": "llm",
                "prompt_summary": prompt_summary,
                "response_summary": response_summary,
                "finish_reason": finish_reason,
                "tool_calls_summary": tc_summary,
                "tool_calls": tc_list,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "model_provider": model_provider,
                "model_id": model_id,
            })));
        } else if name == "pi.llm" {
            let prompt_summary = utf8_truncate(
                &collapse_ws(&to_str_opt(attrs_map.get("pi.llm.prompt")).unwrap_or_default()),
                200,
            );
            let finish_reason = to_str_opt(attrs_map.get("gen_ai.stop_reason"));
            let input_tokens = to_num_opt(attrs_map.get("gen_ai.usage.input_tokens"));
            let output_tokens = to_num_opt(attrs_map.get("gen_ai.usage.output_tokens"));
            let model_provider = to_str_opt(attrs_map.get("gen_ai.system"));
            let model_id = to_str_opt(attrs_map.get("gen_ai.model"));

            calls.push(merge_json(&base, json!({
                "type": "llm",
                "prompt_summary": prompt_summary,
                "response_summary": "",
                "finish_reason": finish_reason,
                "tool_calls_summary": "",
                "tool_calls": [],
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "model_provider": model_provider,
                "model_id": model_id,
            })));
        } else if name == "Tool.execute"
            || name.starts_with("ai.toolCall")
            || name.starts_with("pi.tool.")
        {
            let tool_name = to_str_opt(attrs_map.get("tool.name"))
                .or_else(|| to_str_opt(attrs_map.get("gen_ai.tool.name")))
                .or_else(|| to_str_opt(attrs_map.get("ai.toolCall.name")))
                .or_else(|| to_str_opt(attrs_map.get("pi.tool.name")))
                .or_else(|| {
                    if name.starts_with("pi.tool.") {
                        Some(name["pi.tool.".len()..].to_string())
                    } else {
                        None
                    }
                })
                .unwrap_or_else(|| "tool".to_string());

            let input_raw = attrs_map
                .get("tool.input")
                .or_else(|| attrs_map.get("gen_ai.tool.input"))
                .or_else(|| attrs_map.get("ai.toolCall.input"))
                .or_else(|| attrs_map.get("pi.tool.input"));
            let output_raw = attrs_map
                .get("tool.output")
                .or_else(|| attrs_map.get("gen_ai.tool.output"))
                .or_else(|| attrs_map.get("ai.toolCall.output"))
                .or_else(|| attrs_map.get("pi.tool.result"));

            let input_str = match input_raw {
                Some(Value::String(s)) => s.clone(),
                Some(v) => v.to_string(),
                None => String::new(),
            };
            let mut output_str = match output_raw {
                Some(Value::String(s)) => s.clone(),
                Some(v) => v.to_string(),
                None => String::new(),
            };

            // If output_str looks like JSON with content[].text, extract text
            if output_str.starts_with('{') {
                if let Ok(decoded) = serde_json::from_str::<Value>(&output_str) {
                    if let Some(content) = decoded.get("content").and_then(|c| c.as_array()) {
                        let texts: Vec<&str> = content
                            .iter()
                            .filter_map(|c| {
                                if c.get("type").and_then(|t| t.as_str()) == Some("text") {
                                    c.get("text").and_then(|t| t.as_str())
                                } else {
                                    None
                                }
                            })
                            .collect();
                        if !texts.is_empty() {
                            output_str = texts.join("\n");
                        }
                    }
                }
            }

            let input_summary = utf8_truncate(&collapse_ws(&input_str), 300);
            let output_summary = utf8_truncate(&collapse_ws(&output_str), 500);

            calls.push(merge_json(&base, json!({
                "type": "tool",
                "tool_name": tool_name,
                "input_summary": input_summary,
                "output_summary": output_summary,
            })));
        } else {
            calls.push(merge_json(&base, json!({
                "type": "other",
            })));
        }
    }
    Ok(calls)
}

// ============================================================
// Tauri commands
// ============================================================

#[tauri::command]
pub fn otel_stats() -> Result<Value, String> {
    let conns = open_otel_dbs();

    let stats_sql = r#"SELECT
        COUNT(DISTINCT session_id) AS total_sessions,
        COUNT(*) AS total_spans,
        COALESCE(SUM(input_tokens), 0) AS total_input_tokens,
        COALESCE(SUM(output_tokens), 0) AS total_output_tokens
    FROM spans"#;

    let today_start = today_start_ms();

    let mut total_sessions: i64 = 0;
    let mut total_spans: i64 = 0;
    let mut total_input_tokens: i64 = 0;
    let mut total_output_tokens: i64 = 0;
    let mut today_sessions: i64 = 0;

    for conn in &*conns {
        let stats: (i64, i64, i64, i64) = conn
            .query_row(stats_sql, [], |row| {
                Ok((ri(row, 0)?, ri(row, 1)?, ri(row, 2)?, ri(row, 3)?))
            })
            .unwrap_or((0, 0, 0, 0));
        total_sessions += stats.0;
        total_spans += stats.1;
        total_input_tokens += stats.2;
        total_output_tokens += stats.3;

        today_sessions += conn
            .query_row(
                "SELECT COUNT(DISTINCT session_id) AS today_sessions FROM spans WHERE start_ms >= ? AND session_id IS NOT NULL",
                params![today_start],
                |row| ri(row, 0),
            )
            .unwrap_or(0);
    }

    Ok(json!({
        "today_sessions": today_sessions,
        "today_cost": 0.0,
        "total_spans": total_spans,
        "total_sessions": total_sessions,
        "total_input_tokens": total_input_tokens,
        "total_output_tokens": total_output_tokens,
        "total_cost": 0.0,
    }))
}

#[tauri::command]
pub fn otel_sessions(limit: Option<i64>) -> Result<Vec<Value>, String> {
    let conns = open_otel_dbs();
    let limit = limit.unwrap_or(100);

    let sql = r#"WITH task_meta AS MATERIALIZED (
        SELECT
          json_extract(json_extract(attributes_json,'$."ai.toolCall.result"'),'$.metadata.sessionId') AS child_sid,
          json_extract(json_extract(attributes_json,'$."ai.toolCall.result"'),'$.metadata.parentSessionId') AS parent_sid,
          json_extract(json_extract(attributes_json,'$."ai.toolCall.args"'),'$.subagent_type') AS subagent_type,
          json_extract(json_extract(attributes_json,'$."ai.toolCall.args"'),'$.description') AS description
        FROM spans
        WHERE name='ai.toolCall'
          AND json_extract(attributes_json,'$."ai.toolCall.name"')='task'
      )
      SELECT
      s.session_id AS session_id,
      MIN(s.start_ms) AS first_seen_ms,
      MAX(s.end_ms) AS last_seen_ms,
      MIN(s.start_ms) AS time_created,
      COUNT(*) AS span_count,
      SUM(CASE WHEN (s.name LIKE 'ai.%' AND s.name NOT LIKE '%.doStream' AND s.name NOT LIKE '%.doGenerate' AND s.name NOT LIKE '%.doEmbed' AND s.name <> 'ai.toolCall') OR s.name = 'pi.llm' THEN 1 ELSE 0 END) AS llm_call_count,
      SUM(CASE WHEN s.name = 'ai.toolCall' OR s.name LIKE 'pi.tool.%' THEN 1 ELSE 0 END) AS tool_call_count,
      COALESCE(SUM(s.input_tokens), 0) AS total_input_tokens,
      COALESCE(SUM(s.output_tokens), 0) AS total_output_tokens,
      (SELECT s2.model_id FROM spans s2 WHERE s2.session_id = s.session_id AND s2.model_id IS NOT NULL ORDER BY s2.start_ms DESC LIMIT 1) AS model_id,
      (SELECT s2.model_provider FROM spans s2 WHERE s2.session_id = s.session_id AND s2.model_provider IS NOT NULL ORDER BY s2.start_ms DESC LIMIT 1) AS model_provider,
      (SELECT s2.profile FROM spans s2 WHERE s2.session_id = s.session_id AND s2.profile IS NOT NULL ORDER BY s2.start_ms DESC LIMIT 1) AS profile,
      CASE WHEN SUM(CASE WHEN s.name LIKE 'pi.%' THEN 1 ELSE 0 END) > 0 THEN 'pi'
           WHEN SUM(CASE WHEN s.name LIKE 'ai.%' THEN 1 ELSE 0 END) > 0 THEN 'opencode'
           ELSE 'other' END AS agent_type,
      COALESCE(
        (SELECT sp.session_id FROM spans sr JOIN spans sp ON sp.span_id = sr.parent_span_id WHERE sr.session_id = s.session_id AND sr.name = 'pi.session' AND sr.parent_span_id IS NOT NULL LIMIT 1),
        (SELECT sub.session_id FROM spans sr2 JOIN spans sub ON sub.name = 'pi.tool.subagent' AND sub.session_id != sr2.session_id WHERE sr2.session_id = s.session_id AND sr2.name = 'pi.session' AND sr2.start_ms BETWEEN sub.start_ms AND sub.end_ms LIMIT 1),
        tm.parent_sid
      ) AS parent_session_id,
      tm.subagent_type AS subagent_type,
      tm.description AS subagent_desc
    FROM spans s
    LEFT JOIN task_meta tm ON tm.child_sid = s.session_id
    WHERE s.session_id IS NOT NULL
    GROUP BY s.session_id
    ORDER BY last_seen_ms DESC
    LIMIT ?"#;

    let mut out: Vec<Value> = vec![];

    for conn in &*conns {
        let mut stmt = match conn.prepare(sql) {
            Ok(s) => s,
            Err(e) => return Err(format!("prepare sessions: {}", e)),
        };

        // 先收集所有行（stmt 借用 conn，collect 后释放）
        let rows: Vec<(
            String, i64, i64, i64, i64, i64, i64, i64, i64,
            Option<String>, Option<String>, Option<String>,
            String, Option<String>, Option<String>, Option<String>,
        )> = match stmt.query_map(params![limit], |row| {
            Ok((
                row.get::<_, String>(0)?,
                ri(row, 1)?,
                ri(row, 2)?,
                ri(row, 3)?,
                ri(row, 4)?,
                ri(row, 5)?,
                ri(row, 6)?,
                ri(row, 7)?,
                ri(row, 8)?,
                row.get::<_, Option<String>>(9)?,
                row.get::<_, Option<String>>(10)?,
                row.get::<_, Option<String>>(11)?,
                row.get::<_, String>(12)?,
                row.get::<_, Option<String>>(13)?,
                row.get::<_, Option<String>>(14)?,
                row.get::<_, Option<String>>(15)?,
            ))
        }) {
            Ok(rows) => rows.collect::<Result<Vec<_>, _>>().map_err(|e| format!("collect sessions: {}", e))?,
            Err(e) => return Err(format!("query sessions: {}", e)),
        };
        drop(stmt); // 释放 conn 借用

        // 批量查 opencode.db title（一次连接查全部，而非 N 次开连接）
        let title_items: Vec<(String, Option<String>)> = rows
            .iter()
            .map(|r| (r.0.clone(), r.11.clone()))
            .collect();
        let titles = batch_get_opencode_titles(&title_items);

        for row in rows {
            let (session_id, first_seen_ms, last_seen_ms, time_created, span_count,
                llm_call_count, tool_call_count, total_input_tokens, total_output_tokens,
                model_id, model_provider, profile, agent_type, parent_session_id,
                subagent_type, subagent_desc) = row;

            let title = titles.get(&session_id).cloned().flatten()
                .or(subagent_desc.clone())
                .or_else(|| {
                    if agent_type == "pi" {
                        get_pi_session_summary(conn, &session_id)
                    } else {
                        None
                    }
                });

            out.push(json!({
                "session_id": session_id,
                "title": title,
                "agent": subagent_type,
                "model_provider": model_provider,
                "model_id": model_id,
                "profile": profile,
                "agent_type": agent_type,
                "parent_session_id": parent_session_id,
                "time_created": time_created,
                "first_seen_ms": first_seen_ms,
                "last_seen_ms": last_seen_ms,
                "total_input_tokens": total_input_tokens,
                "total_output_tokens": total_output_tokens,
                "total_cost": 0.0,
                "span_count": span_count,
                "llm_call_count": llm_call_count,
                "tool_call_count": tool_call_count,
                "error_span_count": 0,
            }));
        }
    }

    // 合并多库结果后按 last_seen_ms 倒序重排，再截断到 limit
    out.sort_by(|a, b| {
        let la = a.get("last_seen_ms").and_then(|s| s.as_i64()).unwrap_or(0);
        let lb = b.get("last_seen_ms").and_then(|s| s.as_i64()).unwrap_or(0);
        lb.cmp(&la)
    });
    out.truncate(limit as usize);

    Ok(out)
}

#[tauri::command]
pub fn otel_session(id: String) -> Result<Value, String> {
    let conns = open_otel_dbs();

    // Session summary
    let session_sql = r#"SELECT
      s.session_id AS session_id,
      MIN(s.start_ms) AS first_seen_ms,
      MAX(s.end_ms) AS last_seen_ms,
      MIN(s.start_ms) AS time_created,
      COUNT(*) AS span_count,
      SUM(CASE WHEN (s.name LIKE 'ai.%' AND s.name NOT LIKE '%.doStream' AND s.name NOT LIKE '%.doGenerate' AND s.name NOT LIKE '%.doEmbed' AND s.name <> 'ai.toolCall') OR s.name = 'pi.llm' THEN 1 ELSE 0 END) AS llm_call_count,
      SUM(CASE WHEN s.name = 'ai.toolCall' OR s.name LIKE 'pi.tool.%' THEN 1 ELSE 0 END) AS tool_call_count,
      COALESCE(SUM(s.input_tokens), 0) AS total_input_tokens,
      COALESCE(SUM(s.output_tokens), 0) AS total_output_tokens,
      (SELECT s2.model_id FROM spans s2 WHERE s2.session_id = s.session_id AND s2.model_id IS NOT NULL ORDER BY s2.start_ms DESC LIMIT 1) AS model_id,
      (SELECT s2.model_provider FROM spans s2 WHERE s2.session_id = s.session_id AND s2.model_provider IS NOT NULL ORDER BY s2.start_ms DESC LIMIT 1) AS model_provider,
      (SELECT s2.profile FROM spans s2 WHERE s2.session_id = s.session_id AND s2.profile IS NOT NULL ORDER BY s2.start_ms DESC LIMIT 1) AS profile
    FROM spans s
    WHERE s.session_id = ?
    GROUP BY s.session_id"#;

    // 一个 session_id 只存在于一个 db：逐个连接尝试，命中的 conn 即为“归属 conn”，后续 traces/calls 均用该 conn
    let mut owning_idx: Option<usize> = None;
    let mut session_row = None;
    for (i, conn) in conns.iter().enumerate() {
        if let Ok(row) = conn.query_row(session_sql, params![&id], |row| {
            Ok((
                row.get::<_, String>(0)?,           // session_id
                ri(row, 1)?,              // first_seen_ms
                ri(row, 2)?,              // last_seen_ms
                ri(row, 3)?,              // time_created
                ri(row, 4)?,              // span_count
                ri(row, 5)?,              // llm_call_count
                ri(row, 6)?,              // tool_call_count
                ri(row, 7)?,              // total_input_tokens
                ri(row, 8)?,              // total_output_tokens
                row.get::<_, Option<String>>(9)?,   // model_id
                row.get::<_, Option<String>>(10)?,  // model_provider
                row.get::<_, Option<String>>(11)?,  // profile
            ))
        }) {
            session_row = Some(row);
            owning_idx = Some(i);
            break;
        }
    }

    let conn = match owning_idx {
        Some(i) => &conns[i],
        None => return Err(format!("session not found: {}", id)),
    };
    let session_row = session_row.unwrap();

    let (session_id, first_seen_ms, last_seen_ms, time_created, span_count,
        llm_call_count, tool_call_count, total_input_tokens, total_output_tokens,
        model_id, model_provider, profile) = session_row;

    let title = get_opencode_title(&session_id, profile.as_deref())
        .or_else(|| get_pi_session_summary(conn, &session_id));

    let session = json!({
        "session_id": session_id,
        "title": title,
        "agent": null,
        "model_provider": model_provider,
        "model_id": model_id,
        "profile": profile,
        "time_created": time_created,
        "first_seen_ms": first_seen_ms,
        "last_seen_ms": last_seen_ms,
        "total_input_tokens": total_input_tokens,
        "total_output_tokens": total_output_tokens,
        "total_cost": 0.0,
        "span_count": span_count,
        "llm_call_count": llm_call_count,
        "tool_call_count": tool_call_count,
        "error_span_count": 0,
    });

    // Traces
    let traces_sql = r#"SELECT
      trace_id, COUNT(*) AS span_count, MIN(start_ms) AS start_ms,
      MAX(end_ms) AS end_ms, MAX(end_ms) - MIN(start_ms) AS duration_ms
    FROM spans WHERE session_id = ?
    GROUP BY trace_id ORDER BY start_ms ASC"#;

    let mut stmt = conn.prepare(traces_sql).map_err(|e| format!("prepare traces: {}", e))?;
    let traces: Vec<Value> = stmt
        .query_map(params![&id], |row| {
            Ok(json!({
                "trace_id": row.get::<_, String>(0)?,
                "span_count": ri(row, 1)?,
                "start_ms": ri(row, 2)?,
                "end_ms": ri(row, 3)?,
                "duration_ms": ri(row, 4)?,
            }))
        })
        .map_err(|e| format!("query traces: {}", e))?
        .filter_map(|r| r.ok())
        .collect();

    // Calls
    let calls = list_calls(conn, &id)?;

    Ok(json!({
        "session": session,
        "traces": traces,
        "calls": calls,
    }))
}

#[tauri::command]
pub fn otel_spans(trace_id: String) -> Result<Vec<Value>, String> {
    let conns = open_otel_dbs();

    let spans_sql = r#"SELECT
      trace_id, span_id, parent_span_id, name, kind,
      start_ms, end_ms, duration_ms,
      attributes_json, resource_json, status_code, status_message
    FROM spans WHERE trace_id = ? ORDER BY start_ms ASC"#;

    let cross_trace_sql = r#"SELECT DISTINCT trace_id FROM spans
    WHERE parent_span_id IN (SELECT span_id FROM spans WHERE trace_id = ?1)
      AND trace_id != ?1"#;

    // 一个 trace_id 只存在于一个 db：逐个连接跑完整 BFS，命中（非空）即返回。
    // 跨 trace 的 parent_span_id 链在 PI 子代理场景下都在同一 db 内，所以单库 BFS 已完备。
    for conn in &*conns {
        let mut out: Vec<Value> = vec![];
        let mut visited: HashSet<String> = HashSet::new();
        let mut queue: VecDeque<String> = VecDeque::new();
        queue.push_back(trace_id.clone());

        // prepare 在循环外（避免每层递归重新编译 SQL）
        let mut spans_stmt = match conn.prepare(spans_sql) {
            Ok(s) => s,
            Err(e) => return Err(format!("prepare spans: {}", e)),
        };
        let mut cross_stmt = match conn.prepare(cross_trace_sql) {
            Ok(s) => s,
            Err(e) => return Err(format!("prepare cross: {}", e)),
        };

        let mut depth = 0;
        while let Some(current) = queue.pop_front() {
            if visited.contains(&current) {
                continue;
            }
            visited.insert(current.clone());
            depth += 1;
            if depth > 20 {
                break;
            }

            // 收集本 trace 的全部 span（必须消费完迭代器再用 cross_stmt）
            let span_rows: Vec<_> = match spans_stmt
                .query_map(params![&current], |row| {
                    Ok((
                        row.get::<_, String>(0)?,
                        row.get::<_, String>(1)?,
                        row.get::<_, Option<String>>(2)?,
                        row.get::<_, String>(3)?,
                        row.get::<_, Option<String>>(4)?,
                        ri(row, 5)?,
                        ri(row, 6)?,
                        ri(row, 7)?,
                        row.get::<_, Option<String>>(8)?,
                        row.get::<_, Option<String>>(9)?,
                        row.get::<_, Option<String>>(10)?,
                        row.get::<_, Option<String>>(11)?,
                    ))
                }) {
                Ok(rows) => match rows.collect::<Result<Vec<_>, _>>() {
                    Ok(v) => v,
                    Err(e) => return Err(format!("collect spans: {}", e)),
                },
                Err(e) => return Err(format!("query spans: {}", e)),
            };

            for (trace_id, span_id, parent_span_id, name, kind, start_ms, end_ms,
                duration_ms, attrs_str, resource_str, status_code, status_message) in span_rows {

                let attributes = parse_json(&attrs_str.unwrap_or_default());
                let resource = parse_json(&resource_str.unwrap_or_default());

                out.push(json!({
                    "trace_id": trace_id,
                    "span_id": span_id,
                    "parent_span_id": parent_span_id,
                    "name": name,
                    "kind": kind,
                    "start_ms": start_ms,
                    "end_ms": end_ms,
                    "duration_ms": duration_ms,
                    "attributes": attributes,
                    "resource": resource,
                    "status": {
                        "code": status_code,
                        "message": status_message,
                    },
                }));
            }

            // 跨 trace 子节点（spans 迭代器已消费完，可安全用 cross_stmt）
            let cross_children: Vec<String> = cross_stmt
                .query_map(params![&current], |row| row.get::<_, String>(0))
                .map_err(|e| format!("query cross: {}", e))?
                .filter_map(|r| r.ok())
                .filter(|tid| !visited.contains(tid))
                .collect();

            for child in cross_children {
                queue.push_back(child);
            }
        }

        if !out.is_empty() {
            // Sort by start_ms (cross-trace merge)
            out.sort_by_key(|v| v.get("start_ms").and_then(|s| s.as_i64()).unwrap_or(0));
            return Ok(out);
        }
    }

    Ok(vec![])
}
