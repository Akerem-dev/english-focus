mod commands;
mod database;
mod filesystem;
mod state;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let database = database::connection::open(app.handle())?;
            app.manage(state::AppState::new(database));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::runtime::runtime_info,
            commands::database::list_vocabulary_entries,
            commands::database::get_vocabulary_entry_by_normalized_word,
            commands::database::save_vocabulary_entry
        ])
        .run(tauri::generate_context!())
        .expect("error while running the English Focus Tauri application");
}
