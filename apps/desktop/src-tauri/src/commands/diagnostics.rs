use std::{fs, path::PathBuf};

use rusqlite::{Connection, OptionalExtension};
use serde::Serialize;
use serde_json::Value;
use tauri::{AppHandle, Manager, State};

use crate::{database::migrations, state::AppState};

const EXPECTED_DATABASE_SCHEMA_VERSION: &str = "2";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosticCheck {
    id: String,
    title: String,
    status: String,
    summary: String,
    details: Vec<String>,
    repairable: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosticCounts {
    vocabulary_entries: usize,
    vocabulary_metadata: usize,
    settings_records: usize,
    retained_backups: usize,
    invalid_vocabulary_json: usize,
    invalid_metadata_json: usize,
    invalid_settings_json: usize,
    normalized_word_mismatches: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosticReport {
    generated_at: String,
    app_version: String,
    database_schema_version: String,
    overall_status: String,
    checks: Vec<DiagnosticCheck>,
    counts: DiagnosticCounts,
    recommendations: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SafeMaintenanceResult {
    completed_at: String,
    actions: Vec<String>,
    report: DiagnosticReport,
}

fn passed(id: &str, title: &str, summary: String) -> DiagnosticCheck {
    DiagnosticCheck {
        id: id.to_string(),
        title: title.to_string(),
        status: "passed".to_string(),
        summary,
        details: Vec::new(),
        repairable: false,
    }
}

fn warning(
    id: &str,
    title: &str,
    summary: String,
    details: Vec<String>,
    repairable: bool,
) -> DiagnosticCheck {
    DiagnosticCheck {
        id: id.to_string(),
        title: title.to_string(),
        status: "warning".to_string(),
        summary,
        details,
        repairable,
    }
}

fn failed(
    id: &str,
    title: &str,
    summary: String,
    details: Vec<String>,
    repairable: bool,
) -> DiagnosticCheck {
    DiagnosticCheck {
        id: id.to_string(),
        title: title.to_string(),
        status: "failed".to_string(),
        summary,
        details,
        repairable,
    }
}

fn table_exists(connection: &Connection, table_name: &str) -> Result<bool, String> {
    connection
        .query_row(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?1",
            [table_name],
            |_| Ok(true),
        )
        .optional()
        .map(|value| value.unwrap_or(false))
        .map_err(|error| format!("Schema table lookup failed for {table_name}: {error}"))
}

fn count_rows(connection: &Connection, table_name: &str) -> Result<usize, String> {
    let sql = format!("SELECT COUNT(*) FROM {table_name}");
    connection
        .query_row(&sql, [], |row| row.get::<_, i64>(0))
        .map(|value| value.max(0) as usize)
        .map_err(|error| format!("Row count failed for {table_name}: {error}"))
}

fn quick_check(connection: &Connection) -> Result<Vec<String>, String> {
    let mut statement = connection
        .prepare("PRAGMA quick_check")
        .map_err(|error| format!("SQLite quick_check could not be prepared: {error}"))?;
    let rows = statement
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|error| format!("SQLite quick_check could not run: {error}"))?;

    rows.map(|row| row.map_err(|error| format!("SQLite quick_check row failed: {error}")))
        .collect()
}

fn inspect_vocabulary_json(connection: &Connection) -> Result<(usize, usize), String> {
    let mut invalid_json = 0usize;
    let mut normalized_word_mismatches = 0usize;
    let mut statement = connection
        .prepare("SELECT normalized_word, entry_json FROM vocabulary_entries")
        .map_err(|error| format!("Vocabulary JSON scan could not be prepared: {error}"))?;
    let rows = statement
        .query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)))
        .map_err(|error| format!("Vocabulary JSON scan could not run: {error}"))?;

    for row in rows {
        let (normalized_word, entry_json) =
            row.map_err(|error| format!("Vocabulary JSON row could not be read: {error}"))?;
        match serde_json::from_str::<Value>(&entry_json) {
            Ok(value) => {
                let stored_normalized_word = value
                    .get("normalizedWord")
                    .and_then(Value::as_str)
                    .unwrap_or_default();
                if stored_normalized_word != normalized_word {
                    normalized_word_mismatches += 1;
                }
            }
            Err(_) => invalid_json += 1,
        }
    }

    Ok((invalid_json, normalized_word_mismatches))
}

fn inspect_metadata_json(connection: &Connection) -> Result<usize, String> {
    let mut invalid_json = 0usize;
    let mut statement = connection
        .prepare("SELECT tags_json FROM vocabulary_user_metadata")
        .map_err(|error| format!("Metadata JSON scan could not be prepared: {error}"))?;
    let rows = statement
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|error| format!("Metadata JSON scan could not run: {error}"))?;

    for row in rows {
        let tags_json = row.map_err(|error| format!("Metadata JSON row failed: {error}"))?;
        match serde_json::from_str::<Value>(&tags_json) {
            Ok(Value::Array(_)) => {}
            _ => invalid_json += 1,
        }
    }

    Ok(invalid_json)
}

fn inspect_settings_json(connection: &Connection) -> Result<usize, String> {
    let settings_json = connection
        .query_row(
            "SELECT settings_json FROM app_settings WHERE id = 1",
            [],
            |row| row.get::<_, String>(0),
        )
        .optional()
        .map_err(|error| format!("Settings JSON scan failed: {error}"))?;

    Ok(match settings_json {
        Some(json) => match serde_json::from_str::<Value>(&json) {
            Ok(Value::Object(_)) => 0,
            _ => 1,
        },
        None => 0,
    })
}

fn invalid_metadata_status_count(connection: &Connection) -> Result<usize, String> {
    connection
        .query_row(
            r#"
            SELECT COUNT(*)
            FROM vocabulary_user_metadata
            WHERE learning_status NOT IN ('new', 'learning', 'known')
               OR review_status NOT IN ('imported', 'validated', 'reviewed')
               OR view_count < 0
               OR favorite NOT IN (0, 1)
            "#,
            [],
            |row| row.get::<_, i64>(0),
        )
        .map(|value| value.max(0) as usize)
        .map_err(|error| format!("Metadata status scan failed: {error}"))
}

fn retained_backup_count(app: &AppHandle) -> Result<usize, String> {
    let directory: PathBuf = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Application data directory is unavailable: {error}"))?
        .join("backups");
    fs::create_dir_all(&directory)
        .map_err(|error| format!("Backup directory could not be accessed: {error}"))?;
    let entries = fs::read_dir(&directory)
        .map_err(|error| format!("Backup directory could not be read: {error}"))?;

    Ok(entries
        .filter_map(Result::ok)
        .filter(|entry| {
            entry
                .file_name()
                .to_str()
                .is_some_and(|name| name.starts_with("english-focus-backup-") && name.ends_with(".json"))
        })
        .count())
}

fn collect_report(
    connection: &Connection,
    app: &AppHandle,
    generated_at: String,
) -> Result<DiagnosticReport, String> {
    let mut checks = Vec::new();
    let mut recommendations = Vec::new();

    let quick_check_results = quick_check(connection)?;
    if quick_check_results.len() == 1 && quick_check_results[0].eq_ignore_ascii_case("ok") {
        checks.push(passed(
            "sqlite-integrity",
            "SQLite integrity",
            "SQLite quick_check reported no structural problems.".to_string(),
        ));
    } else {
        checks.push(failed(
            "sqlite-integrity",
            "SQLite integrity",
            "SQLite reported a structural integrity problem.".to_string(),
            quick_check_results,
            false,
        ));
        recommendations.push(
            "Do not continue writing new data. Validate a recent backup and restore it from Settings → Data."
                .to_string(),
        );
    }

    let required_tables = [
        "schema_metadata",
        "vocabulary_entries",
        "vocabulary_user_metadata",
        "app_settings",
    ];
    let mut missing_tables = Vec::new();
    for table in required_tables {
        if !table_exists(connection, table)? {
            missing_tables.push(table.to_string());
        }
    }
    if missing_tables.is_empty() {
        checks.push(passed(
            "schema-objects",
            "Database schema objects",
            "All required local tables are available.".to_string(),
        ));
    } else {
        checks.push(failed(
            "schema-objects",
            "Database schema objects",
            "One or more required tables are missing.".to_string(),
            missing_tables,
            true,
        ));
        recommendations.push(
            "Run safe maintenance once. It can recreate missing tables and indexes without deleting content."
                .to_string(),
        );
    }

    let schema_version = if table_exists(connection, "schema_metadata")? {
        connection
            .query_row(
                "SELECT value FROM schema_metadata WHERE key = 'database_schema_version'",
                [],
                |row| row.get::<_, String>(0),
            )
            .optional()
            .map_err(|error| format!("Database schema version could not be read: {error}"))?
            .unwrap_or_else(|| "missing".to_string())
    } else {
        "missing".to_string()
    };
    if schema_version == EXPECTED_DATABASE_SCHEMA_VERSION {
        checks.push(passed(
            "schema-version",
            "Database schema version",
            format!("Schema version {schema_version} matches this application build."),
        ));
    } else {
        checks.push(warning(
            "schema-version",
            "Database schema version",
            format!(
                "Stored schema version is {schema_version}; expected {EXPECTED_DATABASE_SCHEMA_VERSION}."
            ),
            Vec::new(),
            true,
        ));
        recommendations.push(
            "Run safe maintenance to reapply the current non-destructive schema migration."
                .to_string(),
        );
    }

    let foreign_keys: i64 = connection
        .query_row("PRAGMA foreign_keys", [], |row| row.get(0))
        .map_err(|error| format!("Foreign-key status could not be read: {error}"))?;
    let journal_mode: String = connection
        .query_row("PRAGMA journal_mode", [], |row| row.get(0))
        .map_err(|error| format!("Journal mode could not be read: {error}"))?;
    if foreign_keys == 1 && journal_mode.eq_ignore_ascii_case("wal") {
        checks.push(passed(
            "database-pragmas",
            "Database safety settings",
            "Foreign keys are enabled and WAL journaling is active.".to_string(),
        ));
    } else {
        checks.push(warning(
            "database-pragmas",
            "Database safety settings",
            "One or more recommended SQLite safety settings are inactive.".to_string(),
            vec![
                format!("foreign_keys={foreign_keys}"),
                format!("journal_mode={journal_mode}"),
            ],
            true,
        ));
        recommendations.push(
            "Run safe maintenance to reapply recommended local database settings.".to_string(),
        );
    }

    let vocabulary_entries = count_rows(connection, "vocabulary_entries").unwrap_or(0);
    let vocabulary_metadata = count_rows(connection, "vocabulary_user_metadata").unwrap_or(0);
    let settings_records = count_rows(connection, "app_settings").unwrap_or(0);
    let retained_backups = retained_backup_count(app).unwrap_or(0);
    let (invalid_vocabulary_json, normalized_word_mismatches) =
        inspect_vocabulary_json(connection).unwrap_or((0, 0));
    let invalid_metadata_json = inspect_metadata_json(connection).unwrap_or(0);
    let invalid_settings_json = inspect_settings_json(connection).unwrap_or(0);
    let invalid_metadata_statuses = invalid_metadata_status_count(connection).unwrap_or(0);

    if invalid_vocabulary_json == 0
        && invalid_metadata_json == 0
        && invalid_settings_json == 0
        && normalized_word_mismatches == 0
        && invalid_metadata_statuses == 0
    {
        checks.push(passed(
            "data-consistency",
            "Stored data consistency",
            "Vocabulary, metadata, and settings records passed local consistency checks."
                .to_string(),
        ));
    } else {
        let mut details = Vec::new();
        if invalid_vocabulary_json > 0 {
            details.push(format!("Invalid vocabulary JSON rows: {invalid_vocabulary_json}"));
        }
        if invalid_metadata_json > 0 {
            details.push(format!("Invalid metadata tag rows: {invalid_metadata_json}"));
        }
        if invalid_settings_json > 0 {
            details.push(format!("Invalid settings rows: {invalid_settings_json}"));
        }
        if normalized_word_mismatches > 0 {
            details.push(format!(
                "Normalized-word mismatches: {normalized_word_mismatches}"
            ));
        }
        if invalid_metadata_statuses > 0 {
            details.push(format!("Invalid metadata status rows: {invalid_metadata_statuses}"));
        }
        checks.push(failed(
            "data-consistency",
            "Stored data consistency",
            "One or more stored records are internally inconsistent.".to_string(),
            details,
            false,
        ));
        recommendations.push(
            "Create a manual backup, then restore the newest backup that passes integrity validation."
                .to_string(),
        );
    }

    if retained_backups > 0 {
        checks.push(passed(
            "backup-availability",
            "Recovery readiness",
            format!("{retained_backups} retained backup file(s) are available locally."),
        ));
    } else {
        checks.push(warning(
            "backup-availability",
            "Recovery readiness",
            "No retained backup is currently available.".to_string(),
            Vec::new(),
            false,
        ));
        recommendations.push(
            "Create a manual backup from Settings → Data before making major content changes."
                .to_string(),
        );
    }

    let overall_status = if checks.iter().any(|check| check.status == "failed") {
        "critical"
    } else if checks.iter().any(|check| check.status == "warning") {
        "attention"
    } else {
        "healthy"
    };

    if recommendations.is_empty() {
        recommendations.push("No action is required. Local storage is healthy.".to_string());
    }

    Ok(DiagnosticReport {
        generated_at,
        app_version: env!("CARGO_PKG_VERSION").to_string(),
        database_schema_version: schema_version,
        overall_status: overall_status.to_string(),
        checks,
        counts: DiagnosticCounts {
            vocabulary_entries,
            vocabulary_metadata,
            settings_records,
            retained_backups,
            invalid_vocabulary_json,
            invalid_metadata_json,
            invalid_settings_json,
            normalized_word_mismatches,
        },
        recommendations,
    })
}

#[tauri::command]
pub fn run_diagnostics(
    generated_at: String,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<DiagnosticReport, String> {
    let connection = state
        .database
        .lock()
        .map_err(|_| "The local diagnostics database lock is unavailable.".to_string())?;
    collect_report(&connection, &app, generated_at)
}

#[tauri::command]
pub fn run_safe_maintenance(
    completed_at: String,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<SafeMaintenanceResult, String> {
    let connection = state
        .database
        .lock()
        .map_err(|_| "The local maintenance database lock is unavailable.".to_string())?;

    migrations::run(&connection)
        .map_err(|error| format!("Database migrations could not be reapplied: {error}"))?;
    connection
        .pragma_update(None, "foreign_keys", "ON")
        .map_err(|error| format!("Foreign keys could not be enabled: {error}"))?;
    connection
        .pragma_update(None, "journal_mode", "WAL")
        .map_err(|error| format!("WAL journaling could not be enabled: {error}"))?;
    connection
        .execute_batch("PRAGMA optimize;")
        .map_err(|error| format!("SQLite query planner optimization failed: {error}"))?;

    let report = collect_report(&connection, &app, completed_at.clone())?;
    Ok(SafeMaintenanceResult {
        completed_at,
        actions: vec![
            "Reapplied the current non-destructive database migration.".to_string(),
            "Re-enabled foreign-key enforcement and WAL journaling.".to_string(),
            "Ran SQLite query-planner optimization.".to_string(),
            "Re-ran the complete local diagnostic scan.".to_string(),
        ],
        report,
    })
}
