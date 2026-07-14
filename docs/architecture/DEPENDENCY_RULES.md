# Dependency Rules

- Domain imports no React, Tauri, SQLite, filesystem, or browser APIs.
- Schemas validate unknown data and expose typed parse results.
- Application use cases depend on domain ports.
- Desktop infrastructure implements ports.
- UI uses use cases or presenters, never infrastructure directly.
- Shared remains small and must not become a utility dump.
