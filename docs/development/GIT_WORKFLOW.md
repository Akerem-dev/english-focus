# Git and GitHub workflow

## Repository identity

- GitHub owner: `Akerem-dev`
- Repository: `english-focus`
- Default branch: `main`
- Development visibility: private is recommended until the release candidate is ready

## Stable baseline

The first remote commit represents the verified CP03 native desktop foundation:

- React renders in the browser and the Tauri webview.
- TypeScript checks pass.
- Runtime smoke tests pass.
- Tauri launches on Windows.
- Rust IPC returns native runtime metadata.

Tag this commit as:

```text
cp03-native-baseline
```

## Checkpoint policy

1. Apply one project patch.
2. Run that patch's `TEST_PLAN.md`.
3. Fix every blocking issue before continuing.
4. Commit only after the checkpoint is accepted.
5. Tag important locked checkpoints.
6. Never commit generated folders, databases, backups, logs, secrets, or local environment files.

## Commit convention

Use conventional commit prefixes:

- `chore:` repository, tooling, or checkpoint maintenance
- `feat:` user-visible capability
- `fix:` defect correction
- `refactor:` internal restructuring without behavior change
- `test:` test-only work
- `docs:` documentation-only work
- `style:` visual/CSS work without behavior change

Examples:

```text
chore: establish CP03 native desktop baseline
feat: add three-route application shell
style: add English Focus design tokens
fix: preserve active route after window resize
```

## Branch policy

The CP03 baseline is committed directly to `main`. Starting with CP04, use one short-lived branch per checkpoint or tightly related part:

```text
cp04/design-system
cp04/application-shell
cp05/vocabulary-schema
```

After the checkpoint passes:

1. Commit the branch.
2. Push it.
3. Merge it into `main`.
4. Tag the locked checkpoint when applicable.

Do not create a long-lived `develop` branch for V1. The small checkpoint branches already provide isolation without unnecessary merge overhead.

## Tag policy

Use annotated tags for locked milestones:

```text
cp03-native-baseline
cp04-app-shell
cp06-vocabulary-foundation
cp09-import-flow
v1.0.0-rc.1
v1.0.0
```

## Never commit

- `node_modules/`
- any Rust `target/` folder
- `.env` files other than `.env.example`
- SQLite databases and journal files
- generated backups or exports
- build output, logs, test reports, or local cache files
- API keys or provider credentials
