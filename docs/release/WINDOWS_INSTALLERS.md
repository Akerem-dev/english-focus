# Windows installer build

English Focus produces repeatable unsigned Windows installers for the current version declared in `tauri.conf.json`.

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

Installers are unsigned unless a real code-signing certificate is supplied outside the repository. Windows may show an unknown-publisher warning. No certificate, private key, thumbprint, password, or signing command is committed.
