use notify::RecursiveMode;
use notify_debouncer_mini::{new_debouncer, DebounceEventResult, Debouncer};
use serde::Serialize;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, State};

pub type Watcher = Debouncer<notify::RecommendedWatcher>;

pub struct WatcherState {
    pub watchers: Mutex<HashMap<String, Watcher>>,
}

#[derive(Serialize, Clone)]
pub struct PathEvent {
    pub path: String,
    pub root: String,
    pub kind: String,
}

#[tauri::command]
pub fn watch_path(
    path: String,
    recursive: bool,
    state: State<'_, WatcherState>,
    app: AppHandle,
) -> Result<(), String> {
    let mut watchers: std::sync::MutexGuard<'_, HashMap<String, Watcher>> =
        state.watchers.lock().map_err(|e| e.to_string())?;
    if watchers.contains_key(&path) {
        return Ok(());
    }

    let root = path.clone();
    let app_handle = app.clone();
    let mut debouncer: Watcher = new_debouncer(
        Duration::from_millis(300),
        move |res: DebounceEventResult| {
            let Ok(events) = res else { return };
            for event in events {
                let path_str = event.path.to_string_lossy().to_string();
                let kind = if event.path.is_dir() {
                    "folder"
                } else {
                    "file"
                };
                let _ = app_handle.emit(
                    "path-changed",
                    PathEvent {
                        path: path_str,
                        root: root.clone(),
                        kind: kind.to_string(),
                    },
                );
            }
        },
    )
    .map_err(|e| e.to_string())?;

    let mode = if recursive {
        RecursiveMode::Recursive
    } else {
        RecursiveMode::NonRecursive
    };
    debouncer
        .watcher()
        .watch(&PathBuf::from(&path), mode)
        .map_err(|e| e.to_string())?;

    watchers.insert(path, debouncer);
    Ok(())
}

#[tauri::command]
pub fn unwatch_path(path: String, state: State<'_, WatcherState>) -> Result<(), String> {
    let mut watchers: std::sync::MutexGuard<'_, HashMap<String, Watcher>> =
        state.watchers.lock().map_err(|e| e.to_string())?;
    watchers.remove(&path);
    Ok(())
}
