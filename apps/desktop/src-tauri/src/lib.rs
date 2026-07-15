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
            commands::activity::list_activity,
            commands::activity::record_activity,
            commands::activity::clear_activity,
            commands::database::list_vocabulary_entries,
            commands::database::get_vocabulary_entry_by_normalized_word,
            commands::database::save_vocabulary_entry,
            commands::database::list_vocabulary_user_metadata,
            commands::database::get_vocabulary_user_metadata,
            commands::database::save_vocabulary_user_metadata,
            commands::database::record_vocabulary_view,
            commands::data_reset::get_local_data_snapshot,
            commands::data_reset::reset_local_data,
            commands::settings::get_app_settings,
            commands::settings::save_app_settings,
            commands::backup::list_backups,
            commands::backup::create_backup,
            commands::backup::validate_backup,
            commands::backup::restore_backup,
            commands::backup::delete_backup,
            commands::diagnostics::run_diagnostics,
            commands::diagnostics::run_safe_maintenance
        ])
        .run(tauri::generate_context!())
        .expect("error while running the English Focus Tauri application");
}
