use std::{fs, path::PathBuf};

use rusqlite::{Connection, Row};
use serde::Serialize;
use tauri::{AppHandle, Manager, State};

use crate::state::AppState;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosticScanCoverage {
    complete: bool,
    issues: Vec<String>,
}

fn read_string(row: &Row<'_>, index: usize) -> rusqlite::Result<String> {
    row.get(index)
}

fn scan_vocabulary_entries(connection: &Connection, issues: &mut Vec<String>) {
    let mut statement = match connection
        .prepare("SELECT normalized_word, entry_json, layer, updated_at FROM vocabulary_entries")
    {
        Ok(statement) => statement,
        Err(error) => {
            issues.push(format!(
                "Vocabulary records could not be scanned completely: {error}"
            ));
            return;
        }
    };
    let rows = match statement.query_map([], |row| {
        Ok((
            read_string(row, 0)?,
            read_string(row, 1)?,
            read_string(row, 2)?,
            read_string(row, 3)?,
        ))
    }) {
        Ok(rows) => rows,
        Err(error) => {
            issues.push(format!(
                "Vocabulary records could not be scanned completely: {error}"
            ));
            return;
        }
    };

    for row in rows {
        if let Err(error) = row {
            issues.push(format!(
                "Vocabulary records could not be scanned completely: {error}"
            ));
            break;
        }
    }
}

fn scan_vocabulary_metadata(connection: &Connection, issues: &mut Vec<String>) {
    let mut statement = match connection.prepare(
        r#"
        SELECT normalized_word, favorite, tags_json, note, learning_status, review_status,
               last_viewed_at, view_count, created_at, updated_at
        FROM vocabulary_user_metadata
        "#,
    ) {
        Ok(statement) => statement,
        Err(error) => {
            issues.push(format!(
                "Study details could not be scanned completely: {error}"
            ));
            return;
        }
    };
    let rows = match statement.query_map([], |row| {
        Ok((
            read_string(row, 0)?,
            row.get::<_, i64>(1)?,
            read_string(row, 2)?,
            read_string(row, 3)?,
            read_string(row, 4)?,
            read_string(row, 5)?,
            row.get::<_, Option<String>>(6)?,
            row.get::<_, i64>(7)?,
            read_string(row, 8)?,
            read_string(row, 9)?,
        ))
    }) {
        Ok(rows) => rows,
        Err(error) => {
            issues.push(format!(
                "Study details could not be scanned completely: {error}"
            ));
            return;
        }
    };

    for row in rows {
        if let Err(error) = row {
            issues.push(format!(
                "Study details could not be scanned completely: {error}"
            ));
            break;
        }
    }
}

fn scan_settings(connection: &Connection, issues: &mut Vec<String>) {
    let mut statement = match connection.prepare("SELECT id, settings_json FROM app_settings") {
        Ok(statement) => statement,
        Err(error) => {
            issues.push(format!(
                "App settings could not be scanned completely: {error}"
            ));
            return;
        }
    };
    let rows =
        match statement.query_map([], |row| Ok((row.get::<_, i64>(0)?, read_string(row, 1)?))) {
            Ok(rows) => rows,
            Err(error) => {
                issues.push(format!(
                    "App settings could not be scanned completely: {error}"
                ));
                return;
            }
        };

    for row in rows {
        if let Err(error) = row {
            issues.push(format!(
                "App settings could not be scanned completely: {error}"
            ));
            break;
        }
    }
}

fn scan_activity(connection: &Connection, issues: &mut Vec<String>) {
    let mut statement = match connection
        .prepare("SELECT id, kind, scope, label, target, occurred_at FROM activity_log")
    {
        Ok(statement) => statement,
        Err(error) => {
            issues.push(format!(
                "Recent activity could not be scanned completely: {error}"
            ));
            return;
        }
    };
    let rows = match statement.query_map([], |row| {
        Ok((
            read_string(row, 0)?,
            read_string(row, 1)?,
            read_string(row, 2)?,
            read_string(row, 3)?,
            row.get::<_, Option<String>>(4)?,
            read_string(row, 5)?,
        ))
    }) {
        Ok(rows) => rows,
        Err(error) => {
            issues.push(format!(
                "Recent activity could not be scanned completely: {error}"
            ));
            return;
        }
    };

    for row in rows {
        if let Err(error) = row {
            issues.push(format!(
                "Recent activity could not be scanned completely: {error}"
            ));
            break;
        }
    }
}

fn database_scan_issues(connection: &Connection) -> Vec<String> {
    let mut issues = Vec::new();
    scan_vocabulary_entries(connection, &mut issues);
    scan_vocabulary_metadata(connection, &mut issues);
    scan_settings(connection, &mut issues);
    scan_activity(connection, &mut issues);
    issues
}

fn backup_scan_issue(app: &AppHandle) -> Option<String> {
    let directory: PathBuf = match app.path().app_data_dir() {
        Ok(directory) => directory.join("backups"),
        Err(error) => {
            return Some(format!(
                "Saved backups could not be scanned completely: {error}"
            ));
        }
    };

    if let Err(error) = fs::create_dir_all(&directory) {
        return Some(format!(
            "Saved backups could not be scanned completely: {error}"
        ));
    }

    match fs::read_dir(directory) {
        Ok(entries) => {
            for entry in entries {
                if let Err(error) = entry {
                    return Some(format!(
                        "Saved backups could not be scanned completely: {error}"
                    ));
                }
            }
            None
        }
        Err(error) => Some(format!(
            "Saved backups could not be scanned completely: {error}"
        )),
    }
}

pub fn check_diagnostic_scan_coverage(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<DiagnosticScanCoverage, String> {
    let connection = state
        .database
        .lock()
        .map_err(|_| "The local diagnostics database lock is unavailable.".to_string())?;
    let mut issues = database_scan_issues(&connection);
    if let Some(issue) = backup_scan_issue(&app) {
        issues.push(issue);
    }

    Ok(DiagnosticScanCoverage {
        complete: issues.is_empty(),
        issues,
    })
}

#[cfg(test)]
mod tests {
    use rusqlite::Connection;

    use super::database_scan_issues;

    fn create_required_tables(connection: &Connection) {
        connection
            .execute_batch(
                r#"
                CREATE TABLE vocabulary_entries(
                    normalized_word TEXT,
                    entry_json TEXT,
                    layer TEXT,
                    updated_at TEXT
                );
                CREATE TABLE vocabulary_user_metadata(
                    normalized_word TEXT,
                    favorite INTEGER,
                    tags_json TEXT,
                    note TEXT,
                    learning_status TEXT,
                    review_status TEXT,
                    last_viewed_at TEXT,
                    view_count INTEGER,
                    created_at TEXT,
                    updated_at TEXT
                );
                CREATE TABLE app_settings(id INTEGER, settings_json TEXT);
                CREATE TABLE activity_log(
                    id TEXT,
                    kind TEXT,
                    scope TEXT,
                    label TEXT,
                    target TEXT,
                    occurred_at TEXT
                );
                "#,
            )
            .expect("diagnostic tables should be created");
    }

    #[test]
    fn missing_tables_make_diagnostic_coverage_incomplete() {
        let connection = Connection::open_in_memory().expect("database should open");

        let issues = database_scan_issues(&connection);

        assert_eq!(issues.len(), 4);
    }

    #[test]
    fn readable_empty_tables_complete_the_database_scan() {
        let connection = Connection::open_in_memory().expect("database should open");
        create_required_tables(&connection);

        assert!(database_scan_issues(&connection).is_empty());
    }

    #[test]
    fn unreadable_row_values_are_reported_instead_of_counted_as_zero() {
        let connection = Connection::open_in_memory().expect("database should open");
        create_required_tables(&connection);
        connection
            .execute(
                "INSERT INTO activity_log VALUES ('broken', 'diagnostics-run', 'system', X'FF', NULL, '2026-07-19T12:00:00.000Z')",
                [],
            )
            .expect("broken row should be inserted");

        let issues = database_scan_issues(&connection);

        assert!(issues
            .iter()
            .any(|issue| issue.starts_with("Recent activity could not be scanned completely")));
    }
}
