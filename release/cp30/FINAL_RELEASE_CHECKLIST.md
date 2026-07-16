# English Focus 1.0.0 - Final Release Checklist

Every line must pass before tagging `v1.0.0`.

## Source and candidate lineage

- [ ] CP29 release-candidate lock verifies before promotion.
- [ ] Original developer app-data was restored after CP29.
- [ ] CP30 branch was created from the locked CP29 result.
- [ ] No product feature, schema, backup format, or installer identity changed after CP29.

## Version and metadata

- [ ] Root and workspace package versions are `1.0.0`.
- [ ] Cargo and Tauri versions are `1.0.0`.
- [ ] Product name is `English Focus`.
- [ ] Identifier is `com.englishfocus.desktop`.
- [ ] Windows upgrade code remains unchanged.

## Final quality gate

- [ ] Environment checks pass.
- [ ] TypeScript strict passes.
- [ ] All JavaScript and Rust tests pass.
- [ ] Production build passes.
- [ ] Bundle budget passes.
- [ ] NSIS and MSI installers build.
- [ ] Artifact verification passes.

## Final installed application

- [ ] Fresh NSIS install opens successfully.
- [ ] Fresh MSI install opens successfully.
- [ ] Installing 1.0.0 over 0.9.0 preserves vocabulary and metadata.
- [ ] Settings, activity and retained backups are preserved.
- [ ] Diagnostics reports healthy current schema.
- [ ] Application reports version `1.0.0`.
- [ ] Start Menu shortcut and icon are correct.
- [ ] No console window opens with the desktop app.

## Release lock and delivery

- [ ] Final source commit is clean.
- [ ] Installers were rebuilt from that clean commit.
- [ ] `final-release-lock.json` was created and committed alone.
- [ ] Final lock verification passes.
- [ ] Delivery ZIP and SHA-256 file were created.
- [ ] Git tag `v1.0.0` points to the verified final lock commit.

## Known distribution status

- [ ] Installers are marked unsigned unless a real code-signing certificate was used.
- [ ] Windows SmartScreen warning is documented for unsigned distribution.
