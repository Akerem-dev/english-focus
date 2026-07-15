# CP12 FIX01 — UTF-8 text normalization

The external JSON bridge now repairs a narrow, detectable class of mojibake before schema validation:
UTF-8 text that was accidentally decoded as Windows-1252 by a clipboard or shell boundary.

The repair is conservative:

- it only attempts representable Windows-1252 segments containing common corruption markers;
- it requires a valid fatal UTF-8 decode;
- it accepts the result only when the corruption-marker score decreases;
- already-correct Turkish text remains unchanged;
- the transformation is reported as `repaired-mojibake-text` in the local cleanup summary.

For manual PowerShell fixtures, prefer:

```powershell
Get-Content .\testing\manual\cp11-allocate-valid-with-warnings.entry.json -Encoding utf8 -Raw |
    Set-Clipboard
```
