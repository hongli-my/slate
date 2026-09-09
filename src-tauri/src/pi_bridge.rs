//! pi-bridge sidecar 生命周期管理。
//!
//! app 启动自动拉起 sidecar；非零退出且非主动关闭时 3 秒后自动重启；
//! 健康检查 ready 后向前端 emit `pi-bridge://ready`；提供 invoke command
//! 供设置页管理（启动/停止/重启/状态）。

use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Mutex;
use std::time::{Duration, Instant};

use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;

/// sidecar 监听端口
const PORT: &str = "8643";
/// 健康检查端点
const HEALTH_URL: &str = "http://127.0.0.1:8643/health";
/// 健康检查总超时
const HEALTH_DEADLINE: Duration = Duration::from_secs(15);
/// 健康检查单次请求超时
const HEALTH_REQ_TIMEOUT: Duration = Duration::from_millis(2000);
/// 健康检查轮询间隔
const HEALTH_POLL_INTERVAL: Duration = Duration::from_millis(300);
/// 自动重启退避起始延迟（第 1 次重试）
const BACKOFF_BASE: Duration = Duration::from_secs(3);
/// 自动重启退避上限
const BACKOFF_MAX: Duration = Duration::from_secs(60);
/// 子进程稳定运行超过此时长后，重置退避计数（视为「健康」一次）
const UPTIME_RESET_THRESHOLD: Duration = Duration::from_secs(30);
/// 连续异常退出达到此次数后放弃自动重启
const MAX_RESTART_ATTEMPTS: u64 = 10;
/// 退避抖动幅度（±毫秒）
const BACKOFF_JITTER_MS: i64 = 500;
/// restart 时 stop 与 start 之间的间隔
const RESTART_GAP: Duration = Duration::from_millis(200);

/// 需要从宿主环境透传给 sidecar 的环境变量名
const PASSTHROUGH_ENVS: &[&str] = &[
    "PIWEB_CWD",
    "PIWEB_AGENT_DIR",
    "OPENAI_API_KEY",
    "PI_PROVIDER",
    "PI_MODEL",
];

/// sidecar 运行态。通过 `tauri::Manager::manage` 注入。
pub struct SidecarState {
    child: Mutex<Option<CommandChild>>,
    shutting_down: AtomicBool,
    /// 每次成功 spawn 递增；用于让旧的 stdout 读取任务判断
    /// Terminated 事件是否仍属于“当前”进程，避免重启竞态。
    generation: AtomicU64,
    /// 连续异常退出计数（仅自动重启路径累加）。子进程稳定运行超过
    /// UPTIME_RESET_THRESHOLD 后归零。达到 MAX_RESTART_ATTEMPTS 后放弃重启。
    consecutive_failures: AtomicU64,
    /// 最近一次 spawn 成功的时间，用于计算 uptime 判断是否重置退避。
    spawned_at: Mutex<Option<Instant>>,
}

impl Default for SidecarState {
    fn default() -> Self {
        Self {
            child: Mutex::new(None),
            shutting_down: AtomicBool::new(false),
            generation: AtomicU64::new(0),
            consecutive_failures: AtomicU64::new(0),
            spawned_at: Mutex::new(None),
        }
    }
}

/// 计算第 n 次重试的退避延迟（毫秒，不含抖动）。
/// n=1→3000, n=2→6000, n=3→12000, n=4→24000, n=5→48000, n>=6→60000(封顶)。
fn backoff_ms(n: u64) -> u64 {
    let base = BACKOFF_BASE.as_millis() as u64; // 3000
    // base * 2^(n-1)，n 过大时 saturating 到上限
    let raw = base.checked_shl((n - 1) as u32).unwrap_or(u64::MAX);
    raw.min(BACKOFF_MAX.as_millis() as u64)
}

/// 启动 sidecar：构建命令、spawn、存句柄、起读取任务与健康检查。
///
/// 已存在运行中的 child 会被先 kill 再替换。不阻塞调用者，
/// stdout 读取与健康检查均为异步任务。
pub fn spawn_sidecar(app: &AppHandle) -> Result<(), String> {
    let state = app.state::<SidecarState>();

    // 构建命令：只 .env() 添加需要的变量，绝不 env_clear（会清掉 PATH）。
    let mut cmd = app
        .shell()
        .sidecar("pi-bridge")
        .map_err(|e| format!("failed to resolve pi-bridge sidecar: {e}"))?;
    cmd = cmd.env("PIWEB_PORT", PORT);
    for key in PASSTHROUGH_ENVS {
        if let Ok(v) = std::env::var(key) {
            cmd = cmd.env(key, v);
        }
    }

    let (mut rx, child) = cmd
        .spawn()
        .map_err(|e| format!("failed to spawn pi-bridge sidecar: {e}"))?;

    // 替换旧句柄（如有）：先标记新 generation，再存 child，最后解除 shutting_down。
    let gen = state.generation.fetch_add(1, Ordering::SeqCst) + 1;
    {
        let mut guard = state.child.lock().map_err(|e| format!("state lock poisoned: {e}"))?;
        if let Some(old) = guard.take() {
            let _ = old.kill();
        }
        *guard = Some(child);
    }
    state.shutting_down.store(false, Ordering::SeqCst);
    // 记录本次 spawn 时间，用于异常退出时计算 uptime 判断是否重置退避
    if let Ok(mut g) = state.spawned_at.lock() {
        *g = Some(Instant::now());
    }
    log::info!("[pi-bridge] spawned (generation={gen}, port={PORT})");

    // 读取 stdout/stderr/事件的任务
    let app_rx = app.clone();
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(bytes) => {
                    let line = String::from_utf8_lossy(&bytes).into_owned();
                    log::info!("[pi-bridge] {}", line.trim_end());
                    let _ = app_rx.emit("pi-bridge://log", line);
                }
                CommandEvent::Stderr(bytes) => {
                    let line = String::from_utf8_lossy(&bytes).into_owned();
                    log::warn!("[pi-bridge] {}", line.trim_end());
                    let _ = app_rx.emit("pi-bridge://log", line);
                }
                CommandEvent::Error(err) => {
                    log::error!("[pi-bridge] command error: {err}");
                    let _ = app_rx.emit("pi-bridge://log", format!("error: {err}"));
                }
                CommandEvent::Terminated(payload) => {
                    let code = payload.code.unwrap_or(-1);
                    log::warn!("[pi-bridge] terminated (code={code})");
                    let st = app_rx.state::<SidecarState>();
                    let current_gen = st.generation.load(Ordering::SeqCst);
                    let still_current = gen == current_gen;
                    let shutting_down = st.shutting_down.load(Ordering::SeqCst);
                    // 仅当：本任务仍属于当前进程 && 非主动关闭 && 非正常退出
                    if still_current && !shutting_down && code != 0 {
                        // 计算 uptime：稳定运行超过阈值则重置退避计数（视为「健康」一次）
                        let uptime = st
                            .spawned_at
                            .lock()
                            .ok()
                            .and_then(|g| g.map(|t| t.elapsed()));
                        if matches!(uptime, Some(d) if d >= UPTIME_RESET_THRESHOLD) {
                            st.consecutive_failures.store(0, Ordering::SeqCst);
                        }
                        let attempts = st.consecutive_failures.fetch_add(1, Ordering::SeqCst) + 1;
                        if attempts > MAX_RESTART_ATTEMPTS {
                            log::error!(
                                "[pi-bridge] giving up after {attempts} consecutive restart attempts"
                            );
                            let _ = app_rx.emit(
                                "pi-bridge://error",
                                format!(
                                    "giving up after {attempts} consecutive restart attempts"
                                ),
                            );
                        } else {
                            // 指数退避 + ±500ms 抖动（用系统纳秒时钟，避免引入 rand 依赖）
                            let base_ms = backoff_ms(attempts);
                            let jitter = (std::time::SystemTime::now()
                                .duration_since(std::time::UNIX_EPOCH)
                                .map(|d| d.subsec_nanos() as i64)
                                .unwrap_or(0)
                                % (2 * BACKOFF_JITTER_MS + 1))
                                - BACKOFF_JITTER_MS;
                            let total_ms = (base_ms as i64 + jitter).max(0) as u64;
                            let app_restart = app_rx.clone();
                            tauri::async_runtime::spawn(async move {
                                tokio::time::sleep(Duration::from_millis(total_ms)).await;
                                log::info!(
                                    "[pi-bridge] auto-restarting (attempt {attempts}, delay {total_ms}ms)"
                                );
                                if let Err(e) = spawn_sidecar(&app_restart) {
                                    log::error!("[pi-bridge] auto-restart failed: {e}");
                                    let _ = app_restart.emit(
                                        "pi-bridge://error",
                                        format!("auto-restart failed: {e}"),
                                    );
                                }
                            });
                        }
                    }
                }
                _ => {}
            }
        }
    });

    // 健康检查任务
    let app_health = app.clone();
    tauri::async_runtime::spawn(async move {
        match wait_ready(&app_health).await {
            Ok(()) => {
                let st = app_health.state::<SidecarState>();
                if st.generation.load(Ordering::SeqCst) == gen {
                    log::info!("[pi-bridge] health check passed, emitting ready");
                    let _ = app_health.emit("pi-bridge://ready", ());
                }
            }
            Err(e) => {
                let st = app_health.state::<SidecarState>();
                if st.generation.load(Ordering::SeqCst) == gen {
                    log::error!("[pi-bridge] health check failed: {e}");
                    let _ = app_health.emit("pi-bridge://error", e);
                }
            }
        }
    });

    Ok(())
}

/// 健康检查：轮询 `/health`，成功返回 Ok，超时返回 Err。
async fn wait_ready(app: &AppHandle) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .timeout(HEALTH_REQ_TIMEOUT)
        .build()
        .map_err(|e| format!("failed to build http client: {e}"))?;
    let deadline = Instant::now() + HEALTH_DEADLINE;
    loop {
        if Instant::now() > deadline {
            return Err("pi-bridge health check timed out".to_string());
        }
        match client.get(HEALTH_URL).send().await {
            Ok(resp) if resp.status().is_success() => return Ok(()),
            _ => {}
        }
        // 退出时也及时结束轮询
        if app.state::<SidecarState>().shutting_down.load(Ordering::SeqCst) {
            return Err("pi-bridge shutting down, abort health check".to_string());
        }
        tokio::time::sleep(HEALTH_POLL_INTERVAL).await;
    }
}

/// 内部停止逻辑：标记 shutting_down、kill child、清句柄。
pub fn stop_internal(state: &SidecarState) -> Result<(), String> {
    state.shutting_down.store(true, Ordering::SeqCst);
    let mut guard = state.child.lock().map_err(|e| format!("state lock poisoned: {e}"))?;
    if let Some(child) = guard.take() {
        let _ = child.kill();
    }
    log::info!("[pi-bridge] stopped");
    Ok(())
}

/// 启动 sidecar。若已运行则直接返回 Ok。
#[tauri::command]
pub fn start_bridge(state: State<'_, SidecarState>, app: AppHandle) -> Result<(), String> {
    {
        let guard = state.child.lock().map_err(|e| format!("state lock poisoned: {e}"))?;
        if guard.is_some() {
            return Ok(());
        }
    }
    // 手动启动重置退避计数，给用户一个全新的重启窗口
    state.consecutive_failures.store(0, Ordering::SeqCst);
    spawn_sidecar(&app)
}

/// 停止 sidecar。
#[tauri::command]
pub fn stop_bridge(state: State<'_, SidecarState>) -> Result<(), String> {
    stop_internal(&state)
}

/// 重启 sidecar：stop → 短暂等待 → start。
#[tauri::command]
pub async fn restart_bridge(state: State<'_, SidecarState>, app: AppHandle) -> Result<(), String> {
    stop_internal(&state)?;
    tokio::time::sleep(RESTART_GAP).await;
    // 手动重启重置退避计数，给用户一个全新的重启窗口
    state.consecutive_failures.store(0, Ordering::SeqCst);
    spawn_sidecar(&app)
}

/// 返回 sidecar 是否持有运行中的 child 句柄。
#[tauri::command]
pub fn bridge_status(state: State<'_, SidecarState>) -> bool {
    state.child.lock().map(|g| g.is_some()).unwrap_or(false)
}
