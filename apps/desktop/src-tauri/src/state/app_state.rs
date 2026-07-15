use std::sync::Mutex;

use rusqlite::Connection;

pub struct AppState {
    pub database: Mutex<Connection>,
}

impl AppState {
    pub fn new(database: Connection) -> Self {
        Self {
            database: Mutex::new(database),
        }
    }
}
