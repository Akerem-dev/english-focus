# CP30 - English Focus V1 Final Release

CP30 promotes the tested and locked 0.9.0 release candidate to 1.0.0 without changing product behavior, SQLite schema, backup format, bundled content or installer identity.

The checkpoint is complete only when:

1. CP29 lineage is preserved.
2. Every product and package version is 1.0.0.
3. Full TypeScript, Rust, production, bundle and Windows installer checks pass.
4. Fresh install and 0.9.0-to-1.0.0 upgrade smoke tests preserve local data.
5. Final EXE/MSI hashes and the clean source commit are locked.
6. The delivery ZIP and SHA-256 file are produced.
7. The verified lock commit is merged to main and tagged `v1.0.0`.
