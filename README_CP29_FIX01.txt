CP29 FIX01

Fixes:
1. Windows PowerShell 5.1 parsing failure caused by non-ASCII punctuation in .ps1 files.
2. tauri.conf.json UTF-8 BOM corruption during legacy-version preparation.
3. More reliable command failure detection in run-full-regression.ps1.
4. Safer removal and recreation of the legacy Git worktree.

Copy the scripts folder into the project root and replace matching files.
Do not run begin-isolated-rehearsal.ps1 again if original-user-data already exists.
