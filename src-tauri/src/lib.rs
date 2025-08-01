use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use std::sync::Arc;
use tauri::{Manager, State, Window};
use tauri_specta::{collect_commands, Builder};
use tokio::sync::{oneshot, Mutex, RwLock};

use crate::error::{ApiError, Result};
use crate::http_server::{ServInfo};
use crate::sys::{ProcessInfo, ProcessTreeNode};

mod sys;
mod error;
mod http_server;
mod utils;

#[derive(Clone)]
struct AppState {
    pub window: Option<Window>,
    pub serv_info: Option<ServInfo>,
    pub shutdown_tx: Arc<Mutex<Option<oneshot::Sender<ServInfo>>>>,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
#[specta::specta]
fn get_resource_path() -> Result<String> {
    let p = utils::get_resource_path()?;
    Ok(p.to_string_lossy().to_string())
}

#[tauri::command]
#[specta::specta]
fn get_process() -> Result<Vec<ProcessInfo>> {
    sys::get_processes()
}

#[tauri::command]
#[specta::specta]
async fn run_http_server(state: State<'_, Arc<RwLock<AppState>>>, serv_info: ServInfo) -> Result<ServInfo> {
    let app_state = state.inner().clone();
    if app_state.read().await.serv_info.clone().is_some() {
        println!("The server is already running.");
        return Err(ApiError::Error("The server is already running.".to_string()))
    };

    let app_state = state.inner().clone();

    let handle = http_server::run(app_state.clone(), serv_info).await?;
    println!("{:?}", handle.serv_info.clone());

    let mut state = state.write().await;

    state.serv_info = Some(handle.serv_info.clone());
    state.shutdown_tx = handle.shutdown_tx;
    Ok(handle.serv_info)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() {

    let builder = Builder::<tauri::Wry>::new().commands(collect_commands![
        get_resource_path,
        get_process,
        run_http_server
    ]);

    #[cfg(debug_assertions)]
    {
        use std::path::Path;
        use std::fs::OpenOptions;
        use std::io::Write;

        use specta_typescript::BigIntExportBehavior;
        use specta_typescript::Typescript;
        use specta::TypeCollection;

        use crate::http_server::{HttpNotify};

        let bindings_path = Path::new("../src/bindings.ts");
        let ts = Typescript::default().bigint(BigIntExportBehavior::Number);
        builder
            .export(ts.clone(), bindings_path)
            .expect("Failed to export typescript bindings");

        let mut types = TypeCollection::default();
        types.register::<HttpNotify>();
        let http_notify_str = ts.clone().export(&types).unwrap();
        let mut file = OpenOptions::new()
            .append(true)
            .create(true)
            .open(bindings_path)
            .unwrap();
        file.write_all(http_notify_str.as_bytes()).unwrap();

    }

    tauri::Builder::default()
        .manage(Arc::new(RwLock::new(AppState {
            window: None,
            serv_info: None,
            shutdown_tx: Arc::new(Mutex::new(None)),
        })))
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(builder.invoke_handler())
        .setup(move |app| {
            let window = app.get_window("main").unwrap();
            if let Some(state) = window.app_handle().try_state::<Arc<RwLock<AppState>>>() {
                let state = Arc::clone(&state);
                tauri::async_runtime::spawn(async move {
                    let mut app_state = state.write().await;
                    app_state.window = Some(window.clone());
                });
            }
            Ok(())
        })
        // .invoke_handler(tauri::generate_handler![greet])
        .on_window_event( |window, event| match event {
            tauri::WindowEvent::CloseRequested{ .. } => {
                if let Some(state) = window.app_handle().try_state::<Arc<RwLock<AppState>>>() {
                    let state = Arc::clone(&state);
                    tauri::async_runtime::spawn(async move {
                        let app_state = state.read().await;
                        let shutdown_tx = app_state.shutdown_tx.clone();
                        let serv_info = app_state.serv_info.clone();
                        let mut shutdown_tx = shutdown_tx.lock().await;
                        if let Some(tx) = shutdown_tx.take() {
                            println!("take sender shutdown_tx: {:?}", &serv_info);
                            match serv_info {
                                Some(serv_info) => {
                                    println!("send shutdown: {:?}", &serv_info);
                                    let _ = tx.send(serv_info);
                                }
                                None => {}
                            }
                        }
                    });
                } else {
                    println!("no state");
                }
            }
            _ => {},
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
