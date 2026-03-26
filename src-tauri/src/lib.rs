use std::process::Command;

use tauri_plugin_shell;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn kill_stale_ytdl_processes() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let process_names = ["yt-dlp.exe", "yt-dl.exe"];

        for process_name in process_names {
            let _ = Command::new("taskkill")
                .args(["/IM", process_name, "/F"])
                .output();
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        let process_names = ["yt-dlp", "yt-dl"];

        for process_name in process_names {
            let _ = Command::new("pkill").args(["-x", process_name]).output();
        }
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet, kill_stale_ytdl_processes])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
