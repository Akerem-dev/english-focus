mod commands;
mod database;
mod filesystem;
mod state;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![commands::runtime::runtime_info])
        .run(tauri::generate_context!())
        .expect("error while running the English Focus Tauri application");
}
