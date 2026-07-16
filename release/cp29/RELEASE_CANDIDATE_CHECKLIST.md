# English Focus 0.9.0 — CP29 Release Candidate Checklist

Every line must be checked before creating `release-candidate-lock.json`.

## Full regression

- [ ] Environment and native environment pass.
- [ ] TypeScript strict passes.
- [ ] All domain, schema, testing, desktop and Rust tests pass.
- [ ] Production build and bundle budget pass.
- [ ] No stale RuntimeBaseline checkpoint mismatch exists.
- [ ] Native icon assets are present.

## SQLite migration matrix

- [ ] Fresh database → current schema.
- [ ] Schema 1 database → current schema; vocabulary preserved.
- [ ] Schema 2 database → current schema; vocabulary, metadata and settings preserved.
- [ ] Schema 3 database → current schema; activity preserved.
- [ ] Diagnostics reports current schema and zero consistency issues.

## Backup compatibility

- [ ] Old schema-2 backup validates.
- [ ] Old schema-2 backup restores vocabulary, metadata and settings.
- [ ] Schema-3 backup validates and restores.
- [ ] Current backup validates and restores.
- [ ] Activity exclusion behavior remains intentional.
- [ ] Safety backup is created before restore.

## Installer upgrade matrix

- [ ] Legacy NSIS fresh install.
- [ ] Legacy marker data created and snapshotted.
- [ ] 0.9.0 NSIS installs over legacy version.
- [ ] Marker word, note, favorite, tags, settings and backup remain.
- [ ] Legacy backup validates after upgrade.
- [ ] 0.9.0 NSIS reinstall preserves data.
- [ ] MSI legacy upgrade preserves data.
- [ ] NSIS/MSI uninstall does not remove app-data.
- [ ] Downgrade is rejected.

## Release-candidate lock

- [ ] Working tree is clean.
- [ ] Version is 0.9.0 everywhere.
- [ ] EXE and MSI artifacts are present.
- [ ] SHA-256 manifest passes.
- [ ] `node scripts/cp29/create-rc-lock.mjs` completed on a clean tested source commit.
- [ ] The generated lock file was committed as the only RC-lock commit.
- [ ] `node scripts/cp29/verify-rc-lock.mjs` completed after the lock commit.
