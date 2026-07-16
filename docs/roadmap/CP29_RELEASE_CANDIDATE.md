# CP29 — 0.9.0 Release Candidate Rehearsal

CP29 does not add product behavior. It locks the existing 0.9.0 behavior through full regression, real legacy-data migration, old-backup compatibility, Windows installer upgrade rehearsal, and artifact hashing.

The checkpoint is complete only when:

1. Full TypeScript, Rust, production and installer checks pass.
2. A real legacy build creates the source SQLite database and backup.
3. Installing 0.9.0 over that build preserves user data.
4. Legacy backup validation and restore pass.
5. The EXE/MSI hashes and current commit are written into the RC lock.
6. No code or artifact changes occur after the RC lock is produced.
