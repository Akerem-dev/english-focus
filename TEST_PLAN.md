# CP03-GIT test plan

## Stop conditions

Do not begin CP04 until the initial commit, remote push, and checkpoint tag all succeed.

## 1. Apply the patch

Copy the patch contents directly into the project root and replace matching files.

Do not run `npm install`. Do not delete `package-lock.json`, `node_modules`, or the Rust `target` directory.

## 2. Create the GitHub repository

On GitHub, create:

- Owner: `Akerem-dev`
- Repository name: `english-focus`
- Description: `Offline-first desktop vocabulary library built with Tauri, React, TypeScript, Rust, and SQLite.`
- Visibility: Private during development
- Do not add a README
- Do not add a `.gitignore`
- Do not add a license

The repository must be empty because the local project already contains these files.

## 3. Initialize local Git

Run from the project root:

```powershell
git --version
git init
git branch -M main
```

Set your Git identity only if Git reports that it is missing:

```powershell
git config --global user.name "Ahmet Kerem Kuku"
git config --global user.email "YOUR_GITHUB_VERIFIED_EMAIL"
```

Use an email already verified by GitHub or your GitHub-provided no-reply email.

## 4. Inspect what will be committed

```powershell
git status --short
git check-ignore -v node_modules
git check-ignore -v apps/desktop/src-tauri/target
npm run check:git
```

Expected:

- `node_modules` is ignored.
- the Rust `target` folder is ignored.
- no `.env`, database, backup, export, log, or generated build directory is staged.
- `npm run check:git` has no FAIL line. Remote and uncommitted-change warnings are expected before the first commit.

## 5. Create the stable baseline commit

```powershell
git add .
git status --short
npm run check:git
git commit -m "chore: establish CP03 native desktop baseline"
```

After `git add .`, confirm again that `node_modules` and any Rust `target` path do not appear in `git status --short`.

## 6. Connect and push

```powershell
git remote add origin https://github.com/Akerem-dev/english-focus.git
git push -u origin main
```

If `origin` already exists, inspect it instead of adding a second remote:

```powershell
git remote -v
```

## 7. Create the checkpoint tag

```powershell
git tag -a cp03-native-baseline -m "CP03 native desktop foundation"
git push origin cp03-native-baseline
```

## 8. Final verification

```powershell
git status
git remote -v
git tag --list
npm run check:git
```

Expected:

- branch: `main`;
- working tree: clean;
- `origin` points to `Akerem-dev/english-focus`;
- tag list contains `cp03-native-baseline`;
- Git hygiene check passes without FAIL.

## Report

```text
Checkpoint: CP03-GIT
Repository created: PASS / FAIL
Initial commit: PASS / FAIL
Main push: PASS / FAIL
Tag push: PASS / FAIL
Git hygiene: PASS / FAIL
Working tree clean: PASS / FAIL
Repository URL:
Error output:
```
