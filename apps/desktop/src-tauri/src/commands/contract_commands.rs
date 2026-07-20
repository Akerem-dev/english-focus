use tauri::{AppHandle, State};

use crate::{
    commands::{
        activity, backup, backup_inventory, data_reset, diagnostic_coverage, diagnostics,
        resilient_records,
    },
    contracts,
    state::AppState,
};

fn validate_each<T, F>(values: &[T], validate: F) -> Result<(), String>
where
    F: Fn(&T) -> Result<(), String>,
{
    for value in values {
        validate(value)?;
    }
    Ok(())
}

#[tauri::command]
pub fn list_activity(
    limit: Option<i64>,
    state: State<'_, AppState>,
) -> Result<Vec<activity::ActivityRecord>, String> {
    let records = activity::list_activity(limit, state)?;
    validate_each(&records, contracts::validate_activity_record)?;
    Ok(records)
}

#[tauri::command]
pub fn record_activity(
    request: activity::RecordActivityRequest,
    state: State<'_, AppState>,
) -> Result<activity::ActivityRecord, String> {
    let record = activity::record_activity(request, state)?;
    contracts::validate_activity_record(&record)?;
    Ok(record)
}

#[tauri::command]
pub fn list_resilient_activity(
    limit: Option<i64>,
    state: State<'_, AppState>,
) -> Result<Vec<resilient_records::ActivityRecord>, String> {
    let records = resilient_records::list_resilient_activity(limit, state)?;
    validate_each(&records, contracts::validate_activity_record)?;
    Ok(records)
}

#[tauri::command]
pub fn list_backups(app: AppHandle) -> Result<Vec<backup::BackupDescriptor>, String> {
    let backups = backup::list_backups(app)?;
    validate_each(&backups, contracts::validate_backup_descriptor)?;
    Ok(backups)
}

#[tauri::command]
pub fn create_backup(
    reason: String,
    created_at: String,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<backup::BackupDescriptor, String> {
    let descriptor = backup::create_backup(reason, created_at, app, state)?;
    contracts::validate_backup_descriptor(&descriptor)?;
    Ok(descriptor)
}

#[tauri::command]
pub fn validate_backup(
    file_name: String,
    app: AppHandle,
) -> Result<backup::BackupValidationResult, String> {
    let result = backup::validate_backup(file_name, app)?;
    contracts::validate_backup_validation_result(&result)?;
    Ok(result)
}

#[tauri::command]
pub fn restore_backup(
    file_name: String,
    restored_at: String,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<backup::BackupRestoreResult, String> {
    let result = backup::restore_backup(file_name, restored_at, app, state)?;
    contracts::validate_backup_restore_result(&result)?;
    Ok(result)
}

#[tauri::command]
pub fn list_unavailable_backups(
    app: AppHandle,
) -> Result<Vec<backup_inventory::UnavailableBackup>, String> {
    let files = backup_inventory::list_unavailable_backups(app)?;
    validate_each(&files, contracts::validate_unavailable_backup)?;
    Ok(files)
}

#[tauri::command]
pub fn get_local_data_snapshot(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<data_reset::LocalDataSnapshot, String> {
    let snapshot = data_reset::get_local_data_snapshot(app, state)?;
    contracts::validate_local_data_snapshot(&snapshot)?;
    Ok(snapshot)
}

#[tauri::command]
pub fn reset_local_data(
    request: data_reset::ResetLocalDataRequest,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<data_reset::ResetLocalDataResult, String> {
    let result = data_reset::reset_local_data(request, app, state)?;
    contracts::validate_reset_local_data_result(&result)?;
    Ok(result)
}

#[tauri::command]
pub fn run_diagnostics(
    generated_at: String,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<diagnostics::DiagnosticReport, String> {
    let report = diagnostics::run_diagnostics(generated_at, app, state)?;
    contracts::validate_diagnostic_report(&report)?;
    Ok(report)
}

#[tauri::command]
pub fn run_safe_maintenance(
    completed_at: String,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<diagnostics::SafeMaintenanceResult, String> {
    let result = diagnostics::run_safe_maintenance(completed_at, app, state)?;
    contracts::validate_safe_maintenance_result(&result)?;
    Ok(result)
}

#[tauri::command]
pub fn check_diagnostic_scan_coverage(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<diagnostic_coverage::DiagnosticScanCoverage, String> {
    let coverage = diagnostic_coverage::check_diagnostic_scan_coverage(app, state)?;
    contracts::validate_diagnostic_scan_coverage(&coverage)?;
    Ok(coverage)
}
