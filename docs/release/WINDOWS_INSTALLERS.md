# Windows installer build

CP27 establishes repeatable unsigned Windows release-candidate packaging.

## Build

```powershell
npm run release:windows
```

Artifacts are collected under:

```text
release-artifacts/windows/0.9.0/
```

Expected outputs are one WiX `.msi`, one NSIS `.exe`, `SHA256SUMS.txt`, and `release-manifest.json`.

## Installer behavior

- NSIS defaults to current-user installation.
- Downgrades are blocked.
- WebView2 uses the installed runtime when available and the official bootstrapper fallback when required.
- The application identifier and MSI upgrade code must stay unchanged across future upgrades.

## Signing

CP27 artifacts are intentionally unsigned release candidates. Windows may show an unknown-publisher warning. No certificate, private key, thumbprint, password, or signing command is committed.
