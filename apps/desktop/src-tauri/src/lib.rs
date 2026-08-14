mod commands;
mod contracts;
mod database;
mod state;
mod validation;

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
            commands::assistant::assistant_get_status,
            commands::assistant::assistant_save_api_key,
            commands::assistant::assistant_clear_api_key,
            commands::assistant::assistant_generate_vocabulary,
            commands::contract_commands::list_activity,
            commands::contract_commands::record_activity,
            commands::activity::clear_activity,
            commands::contract_commands::list_resilient_activity,
            commands::storage_contract_commands::contract_list_vocabulary_entries,
            commands::storage_contract_commands::contract_get_vocabulary_entry_by_normalized_word,
            commands::storage_contract_commands::contract_save_vocabulary_entry,
            commands::storage_contract_commands::contract_save_vocabulary_entries,
            commands::storage_contract_commands::contract_list_resilient_vocabulary_entries,
            commands::storage_contract_commands::contract_list_vocabulary_user_metadata,
            commands::storage_contract_commands::contract_get_vocabulary_user_metadata,
            commands::storage_contract_commands::contract_save_vocabulary_user_metadata,
            commands::storage_contract_commands::contract_record_vocabulary_view,
            commands::collections::get_collections_state,
            commands::collections::save_collections_state,
            commands::contract_commands::get_local_data_snapshot,
            commands::contract_commands::reset_local_data,
            commands::storage_contract_commands::contract_get_app_settings,
            commands::storage_contract_commands::contract_save_app_settings,
            commands::contract_commands::list_backups,
            commands::contract_commands::create_backup,
            commands::contract_commands::validate_backup,
            commands::contract_commands::restore_backup,
            commands::backup::delete_backup,
            commands::contract_commands::list_unavailable_backups,
            commands::backup_inventory::delete_unavailable_backup,
            commands::contract_commands::run_diagnostics,
            commands::contract_commands::run_safe_maintenance,
            commands::contract_commands::check_diagnostic_scan_coverage
        ])
        .run(tauri::generate_context!())
        .expect("error while running the English Focus Tauri application");
}
