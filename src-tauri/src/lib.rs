mod commands;
mod watcher;

use commands::PendingOpen;
use tauri::{Emitter, Manager};
use watcher::WatcherState;

fn extract_file_path(args: &[String]) -> Option<String> {
    args.iter()
        .skip(1)
        .find(|a| {
            !a.is_empty()
                && !a.starts_with("--")
                && !a.starts_with('-')
                && std::path::Path::new(a).is_file()
        })
        .cloned()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let initial_file = extract_file_path(&std::env::args().collect::<Vec<_>>());

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            if let Some(path) = extract_file_path(&args) {
                let _ = app.emit("open-file", path);
            }
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .manage(PendingOpen(std::sync::Mutex::new(initial_file)))
        .manage(WatcherState {
            watchers: std::sync::Mutex::new(std::collections::HashMap::new()),
        })
        .invoke_handler(tauri::generate_handler![
            commands::list_dir,
            commands::read_file,
            commands::write_file,
            commands::file_exists,
            commands::take_pending_open,
            watcher::watch_path,
            watcher::unwatch_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
