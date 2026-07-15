# CP21 Test Plan

## Automated

- `npm run check:environment`
- `npm run typecheck`
- `npm run test --workspace=@platform/domain`
- `npm run test --workspace=@platform/schemas`
- `npm run test --workspace=@platform/testing`
- `npm run test --workspace=@app/desktop`
- `npm run build --workspace=@app/desktop`
- `npm run check:forbidden`

## Native manual

1. Open Settings → Diagnostics.
2. Run diagnostics.
3. Confirm SQLite integrity, schema, safety settings, data consistency, and backup readiness appear.
4. Copy the summary and verify it contains counts and statuses but not vocabulary definitions or personal notes.
5. Confirm safe maintenance is disabled when there is no repairable issue.
6. If a repairable warning appears, acknowledge the non-destructive boundary and run safe maintenance.
7. Rerun diagnostics and confirm the report refreshes.
8. Restart the app and verify vocabulary, metadata, settings, and backups remain unchanged.
