use std::{error::Error, fs};

use rusqlite::Connection;
use tauri::{AppHandle, Manager};

use super::migrations;

pub fn open(app: &AppHandle) -> Result<Connection, Box<dyn Error>> {
    let app_data_dir = app.path().app_data_dir()?;
    fs::create_dir_all(&app_data_dir)?;

    let connection = Connection::open(app_data_dir.join("english-focus.sqlite3"))?;
    connection.pragma_update(None, "foreign_keys", "ON")?;
    connection.pragma_update(None, "journal_mode", "WAL")?;
    connection.pragma_update(None, "synchronous", "NORMAL")?;
    migrations::run(&connection)?;

    Ok(connection)
}
