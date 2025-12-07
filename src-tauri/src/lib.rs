use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::path::PathBuf;
use std::fs;
use std::time::Duration;
use tauri::{Manager, State};

// Global state to hold the OPAL server process
struct AppState {
    opal_process: Mutex<Option<Child>>,
    opal_port: Mutex<u16>,
}

// Tauri commands
#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
fn get_server_port(state: State<AppState>) -> u16 {
    *state.opal_port.lock().unwrap()
}

#[tauri::command]
fn get_api_url(state: State<AppState>) -> String {
    let port = *state.opal_port.lock().unwrap();
    format!("http://localhost:{}/api", port)
}

#[tauri::command]
fn get_ws_url(state: State<AppState>) -> String {
    let port = *state.opal_port.lock().unwrap();
    format!("ws://localhost:{}", port)
}

#[tauri::command]
fn get_journal_api_url(state: State<AppState>) -> String {
    let port = *state.opal_port.lock().unwrap();
    format!("http://localhost:{}/journal", port)
}

#[tauri::command]
fn get_notes_api_url(state: State<AppState>) -> String {
    let port = *state.opal_port.lock().unwrap();
    format!("http://localhost:{}/notes", port)
}

#[tauri::command]
async fn restart_opal_server(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    // Kill existing process
    if let Some(mut process) = state.opal_process.lock().unwrap().take() {
        let _ = process.kill();
    }
    
    // Start new process
    spawn_opal_server(&app, &state).await?;
    Ok(())
}

// Helper function to get OPAL paths
fn get_opal_paths(app: &tauri::AppHandle) -> Result<(PathBuf, PathBuf, PathBuf), String> {
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    let opal_data_dir = app_data_dir.join("opal");
    let opal_database_dir = opal_data_dir.join("database");
    let persistent_db_path = opal_database_dir.join("opal.sqlite3");
    
    Ok((opal_data_dir, opal_database_dir, persistent_db_path))
}

// Ensure OPAL directories exist
fn ensure_opal_directories(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let (opal_data_dir, opal_database_dir, persistent_db_path) = get_opal_paths(app)?;
    
    // Create directories
    fs::create_dir_all(&opal_data_dir)
        .map_err(|e| format!("Failed to create OPAL data dir: {}", e))?;
    fs::create_dir_all(&opal_database_dir)
        .map_err(|e| format!("Failed to create OPAL database dir: {}", e))?;
    
    // Create backup directory
    let backup_dir = opal_data_dir.join("backups");
    fs::create_dir_all(&backup_dir)
        .map_err(|e| format!("Failed to create backup dir: {}", e))?;
    
    println!("✅ Created OPAL directories: {:?}", opal_data_dir);
    
    Ok(persistent_db_path)
}

// Load environment variables from .env file
fn load_env_file(app: &tauri::AppHandle) -> Result<String, String> {
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    // Try multiple .env file locations
    let mut env_paths = vec![app_data_dir.join(".env")];
    
    if let Some(parent) = app_data_dir.parent() {
        env_paths.push(parent.join(".env"));
        env_paths.push(parent.join("opal").join(".env"));
    }
    
    // In development, also check the project opal folder
    if cfg!(debug_assertions) {
        env_paths.push(PathBuf::from("..").join("opal").join(".env"));
        env_paths.push(PathBuf::from("..").join(".env"));
    }
    
    for env_path in env_paths {
        if env_path.exists() {
            if let Ok(content) = fs::read_to_string(&env_path) {
                println!("✅ Loaded .env from: {:?}", env_path);
                
                // Parse and extract OPENAI_API_KEY
                for line in content.lines() {
                    let trimmed = line.trim();
                    if trimmed.starts_with("OPENAI_API_KEY=") {
                        let key = trimmed.trim_start_matches("OPENAI_API_KEY=")
                            .trim_matches('"')
                            .trim_matches('\'')
                            .to_string();
                        if !key.is_empty() {
                            println!("✅ Found OpenAI API key");
                            return Ok(key);
                        }
                    }
                }
            }
        }
    }
    
    println!("⚠️ No .env file found or no OPENAI_API_KEY in .env");
    Ok(String::new())
}

// Spawn OPAL server process
async fn spawn_opal_server(
    app: &tauri::AppHandle,
    state: &State<'_, AppState>,
) -> Result<(), String> {
    let port = 3000u16;
    
    // Ensure directories exist
    let persistent_db_path = ensure_opal_directories(app)?;
    
    // Load OpenAI API key
    let openai_api_key = load_env_file(app).unwrap_or_default();
    
    // Determine OPAL server path
    let is_dev = cfg!(debug_assertions);
    let opal_server_path = if is_dev {
        // Development: go up from forge/src-tauri to forge, then to opal
        PathBuf::from("..").join("opal").join("src").join("server.js")
    } else {
        // Production: in resources folder
        app.path().resource_dir()
            .map_err(|e| format!("Failed to get resource dir: {}", e))?
            .join("opal").join("src").join("server.js")
    };
    
    let opal_dir = opal_server_path.parent()
        .and_then(|p| p.parent())
        .ok_or("Failed to get OPAL directory")?;
    
    println!("🔧 Starting OPAL server from: {:?}", opal_server_path);
    println!("   Working directory: {:?}", opal_dir);
    println!("   Database path: {:?}", persistent_db_path);
    
    // Verify server script exists
    if !opal_server_path.exists() {
        return Err(format!("OPAL server script not found at: {:?}", opal_server_path));
    }
    
    // Get backup directory
    let backup_dir = persistent_db_path.parent()
        .and_then(|p| p.parent())
        .map(|p| p.join("backups"))
        .ok_or("Failed to get backup directory")?;
    
    // Spawn Node.js process
    let mut child = Command::new("node")
        .arg("src/server.js")
        .current_dir(opal_dir)
        .env("NODE_ENV", "development")
        .env("MCP_PORT", port.to_string())
        .env("DB_FILE", persistent_db_path.to_str().unwrap())
        .env("OPAL_ROOT", opal_dir.to_str().unwrap())
        .env("MCP_PROTOCOL_VERSION", "1.0")
        .env("MCP_SERVER_NAME", "OPAL MCP Server")
        .env("MCP_SERVER_VERSION", "1.0.0")
        .env("VITE_OPAL_API_URL", format!("http://localhost:{}/api", port))
        .env("OPAL_MODE", "persistent")
        .env("OPENAI_API_KEY", &openai_api_key)
        .env("MACHPOINT_MODE", "persistent")
        .env("JWT_SECRET", "forge-desktop-jwt-secret-key-2024")
        .env("JWT_ACCESS_EXPIRY", "24h")
        .env("JWT_REFRESH_EXPIRY", "7d")
        .env("BACKUP_DIR", backup_dir.to_str().unwrap())
        .env("FORGE_PACKAGED", "true")
        .env("FORCE_MIGRATIONS", "true")
        .env("SQLITE_THREADSAFE", "1")
        .env("SQLITE_ENABLE_FTS", "1")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn OPAL server: {}", e))?;
    
    println!("✅ OPAL server process spawned");
    
    // Capture stdout and stderr for logging
    if let Some(stdout) = child.stdout.take() {
        use std::io::{BufRead, BufReader};
        std::thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines() {
                if let Ok(line) = line {
                    println!("[OPAL STDOUT]: {}", line);
                }
            }
        });
    }
    
    if let Some(stderr) = child.stderr.take() {
        use std::io::{BufRead, BufReader};
        std::thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines() {
                if let Ok(line) = line {
                    eprintln!("[OPAL STDERR]: {}", line);
                }
            }
        });
    }
    
    // Store the process
    *state.opal_process.lock().unwrap() = Some(child);
    *state.opal_port.lock().unwrap() = port;
    
    // Wait for server to be ready
    println!("⏳ Waiting for OPAL server to be ready...");
    
    // Use tokio sleep instead of thread sleep
    for attempt in 1..=20 {
        tokio::time::sleep(Duration::from_millis(500)).await;
        
        // Try to connect to health endpoint
        match reqwest::get(format!("http://localhost:{}/health", port)).await {
            Ok(response) if response.status().is_success() => {
                println!("✅ OPAL server is ready on port {}", port);
                return Ok(());
            }
            _ => {
                if attempt >= 20 {
                    return Err("OPAL server failed to start after 20 attempts".to_string());
                }
            }
        }
    }
    
    Ok(())
}

use tauri::menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder};
use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle();
            
            // Build menu items
            let new_entry = MenuItemBuilder::with_id("new_entry", "New Entry")
                .accelerator("CmdOrCtrl+N")
                .build(handle)?;
            let save_entry = MenuItemBuilder::with_id("save_entry", "Save")
                .accelerator("CmdOrCtrl+S")
                .build(handle)?;
            let separator1 = PredefinedMenuItem::separator(handle)?;
            let quit = MenuItemBuilder::with_id("quit", "Quit")
                .accelerator("CmdOrCtrl+Q")
                .build(handle)?;
            
            let go_home = MenuItemBuilder::with_id("go_home", "Home").build(handle)?;
            let go_journal = MenuItemBuilder::with_id("go_journal", "Journal").build(handle)?;
            let go_guided = MenuItemBuilder::with_id("go_guided", "Guided").build(handle)?;
            let go_core = MenuItemBuilder::with_id("go_core", "Core").build(handle)?;
            let go_profile = MenuItemBuilder::with_id("go_profile", "Profile").build(handle)?;
            
            let ai_feedback = MenuItemBuilder::with_id("ai_feedback", "AI Feedback").build(handle)?;
            let settings = MenuItemBuilder::with_id("settings", "Settings").build(handle)?;
            
            // Build submenus
            let file_menu = SubmenuBuilder::new(handle, "File")
                .item(&new_entry)
                .item(&save_entry)
                .item(&separator1)
                .item(&quit)
                .build()?;

            let view_menu = SubmenuBuilder::new(handle, "View")
                .item(&go_home)
                .item(&go_journal)
                .item(&go_guided)
                .item(&go_core)
                .item(&go_profile)
                .build()?;

            let tools_menu = SubmenuBuilder::new(handle, "Tools")
                .item(&ai_feedback)
                .item(&settings)
                .build()?;

            // Build main menu
            let menu = MenuBuilder::new(handle)
                .item(&file_menu)
                .item(&view_menu)
                .item(&tools_menu)
                .build()?;

            app.set_menu(menu)?;

            Ok(())
        })
        .on_menu_event(|app, event| {
            match event.id().as_ref() {
                "quit" => {
                    std::process::exit(0);
                }
                "new_entry" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.emit("menu-event", "new-entry");
                    }
                }
                "go_home" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.emit("menu-event", "go-home");
                    }
                }
                // ... handle other menu events
                _ => {}
            }
        })
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_handle = app.handle().clone();
            let state: State<AppState> = app.state();
            
            // Spawn OPAL server on startup
            tauri::async_runtime::block_on(async {
                if let Err(e) = spawn_opal_server(&app_handle, &state).await {
                    eprintln!("❌ Failed to start OPAL server: {}", e);
                    std::process::exit(1);
                }
            });
            
            Ok(())
        })
        .manage(AppState {
            opal_process: Mutex::new(None),
            opal_port: Mutex::new(3000),
        })
        .invoke_handler(tauri::generate_handler![
            get_app_version,
            get_server_port,
            get_api_url,
            get_ws_url,
            get_journal_api_url,
            get_notes_api_url,
            restart_opal_server
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                // Kill OPAL server when window closes
                let app_state: State<AppState> = window.state();
                let mut process_guard = app_state.opal_process.lock().unwrap();
                if let Some(mut process) = process_guard.take() {
                    let _ = process.kill();
                    println!("🔄 OPAL server stopped");
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
