# Security Policy

- The app is local-first and sends no vocabulary content to the internet.
- Imported JSON is untrusted and must be size-limited and validated.
- No imported HTML is rendered.
- User text must never be inserted with unsafe HTML APIs.
- Backups and imports use explicit file selection and transaction-safe writes.
- Logs redact user content where practical.
- Tauri permissions stay minimal and feature-specific.
- Telemetry is absent by default.
