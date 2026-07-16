# Windows installer build

English Focus produces signed Windows installers for the current version declared in `tauri.conf.json`.

## Build

```powershell
npm run release:windows
```

Artifacts are collected under:

```text
release-artifacts/windows/<current-version>/
```

For V1 this is:

```text
release-artifacts/windows/1.0.0/
```

Expected outputs are one WiX `.msi`, one NSIS `.exe`, `SHA256SUMS.txt`, and `release-manifest.json`.

## Installer behavior

- NSIS defaults to current-user installation.
- Downgrades are blocked.
- WebView2 uses the installed runtime when available and the official bootstrapper fallback when required.
- The application identifier and MSI upgrade code must stay unchanged across future upgrades.

## Signing

Stable builds require either `EF_WINDOWS_CERTIFICATE_THUMBPRINT` plus a timestamp URL or an external `EF_WINDOWS_SIGN_COMMAND`. The working tree must be clean, Authenticode is verified after packaging, and the artifact manifest records the source commit and signing request. Secrets and private keys are never committed.

Use `npm run release:windows:unsigned` only for a local rehearsal; it is not a publishable release.

## Updates

Automatic updates are intentionally disabled until the project has a real HTTPS release endpoint and a protected updater signing key. Until then, users install a newer signed MSI or NSIS package manually; the stable application identifier and upgrade code preserve the upgrade path.
