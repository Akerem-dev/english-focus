# CP19 Patch Manifest

## Behavior

- Persists settings in SQLite.
- Restores settings at application startup.
- Applies light, dark, or system theme immediately.
- Applies reduced-motion and interface-size preferences globally.
- Persists external-AI instruction preferences.
- Hides or shows etymology and common mistakes according to content settings.
- Displays either five or all ten primary examples.
- Adds save/loading/error feedback to Settings.

## Database

- Adds `app_settings` singleton table.
- Advances local database schema marker from 1 to 2.

## Dependencies

- No new npm dependency.
- No new Rust crate.
