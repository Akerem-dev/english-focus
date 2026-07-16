import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const expectedVersion = process.env.EF_EXPECTED_VERSION ?? "1.0.0";
const internalWorkspaceVersion = "0.0.0";
const expectedProductName = "English Focus";
const expectedIdentifier = "com.englishfocus.desktop";
let failed = false;

function pass(message) { console.log(`ok ${message}`); }
function fail(message) { console.error(`x ${message}`); failed = true; }
function readJson(relativePath) {
  const path = resolve(root, relativePath);
  if (!existsSync(path)) { fail(`${relativePath} is missing.`); return undefined; }
  try { return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, "")); }
  catch (error) { fail(`${relativePath} is invalid JSON: ${error instanceof Error ? error.message : String(error)}`); return undefined; }
}

const rootPackage = readJson("package.json");
const desktopPackage = readJson("apps/desktop/package.json");
const lockfile = readJson("package-lock.json");
const tauri = readJson("apps/desktop/src-tauri/tauri.conf.json");

for (const [name, version] of [
  ["package.json", rootPackage?.version],
  ["apps/desktop/package.json", desktopPackage?.version],
  ["package-lock.json", lockfile?.version],
  ["tauri.conf.json", tauri?.version]
]) {
  if (version === expectedVersion) pass(`${name}: ${expectedVersion}`);
  else fail(`${name}: expected ${expectedVersion}, received ${String(version)}`);
}

for (const [key, expected] of [
  ["", expectedVersion],
  ["apps/desktop", expectedVersion],
  ["packages/domain", internalWorkspaceVersion],
  ["packages/schemas", internalWorkspaceVersion],
  ["packages/shared", internalWorkspaceVersion],
  ["packages/testing", internalWorkspaceVersion]
]) {
  const entry = lockfile?.packages?.[key];
  if (!entry) {
    fail(`package-lock.json workspace entry missing: ${key || "<root>"}`);
  } else if (entry.version === expected) {
    pass(`package-lock.json ${key || "<root>"}: ${expected}`);
  } else {
    fail(`package-lock.json ${key || "<root>"}: expected ${expected}, received ${String(entry.version)}`);
  }
}

if (tauri?.productName === expectedProductName) pass(`Product name: ${expectedProductName}`);
else fail(`Unexpected product name: ${String(tauri?.productName)}`);
if (tauri?.identifier === expectedIdentifier) pass(`Identifier: ${expectedIdentifier}`);
else fail(`Unexpected identifier: ${String(tauri?.identifier)}`);

for (const [label, version] of [
  ["MSI/WiX installer version", tauri?.bundle?.windows?.wix?.version],
  ["MSI installer version", tauri?.bundle?.windows?.msi?.version],
  ["NSIS installer version", tauri?.bundle?.windows?.nsis?.version]
]) {
  if (version === undefined) continue;
  if (version === expectedVersion) pass(`${label}: ${expectedVersion}`);
  else fail(`${label}: expected ${expectedVersion}, received ${String(version)}`);
}

const cargoPath = resolve(root, "apps/desktop/src-tauri/Cargo.toml");
if (!existsSync(cargoPath)) fail("Cargo.toml is missing.");
else {
  const match = readFileSync(cargoPath, "utf8").match(/^\s*version\s*=\s*"([^"]+)"/m);
  if (match?.[1] === expectedVersion) pass(`Cargo.toml: ${expectedVersion}`);
  else fail(`Cargo.toml: expected ${expectedVersion}, received ${match?.[1] ?? "missing"}`);
}

const cargoLockPath = resolve(root, "apps/desktop/src-tauri/Cargo.lock");
if (!existsSync(cargoLockPath)) fail("Cargo.lock is missing.");
else {
  const match = readFileSync(cargoLockPath, "utf8").match(
    /\[\[package\]\]\r?\nname = "english-learning-platform"\r?\nversion = "([^"]+)"/
  );
  if (match?.[1] === expectedVersion) pass(`Cargo.lock local package: ${expectedVersion}`);
  else fail(`Cargo.lock local package: expected ${expectedVersion}, received ${match?.[1] ?? "missing"}`);
}

for (const relativePath of [
  "packages/domain/package.json",
  "packages/schemas/package.json",
  "packages/shared/package.json",
  "packages/testing/package.json"
]) {
  const pkg = readJson(relativePath);
  if (pkg?.version === internalWorkspaceVersion) pass(`${relativePath}: ${internalWorkspaceVersion}`);
  else fail(`${relativePath}: expected ${internalWorkspaceVersion}, received ${String(pkg?.version)}`);
}

const requiredAssets = [
  "apps/desktop/src-tauri/icons/icon.ico",
  "apps/desktop/src-tauri/icons/32x32.png",
  "apps/desktop/src-tauri/icons/128x128.png",
  "apps/desktop/src-tauri/icons/128x128@2x.png"
];
for (const relativePath of requiredAssets) {
  const path = resolve(root, relativePath);
  if (!existsSync(path)) fail(`Missing native asset: ${relativePath}`);
  else if (statSync(path).size < 100) fail(`Native asset is too small: ${relativePath}`);
  else pass(`Native asset: ${relativePath}`);
}

const rcLockPath = resolve(root, "release/cp29/release-candidate-lock.json");
if (!existsSync(rcLockPath)) fail("CP29 release-candidate lock is missing.");
else {
  const lock = JSON.parse(readFileSync(rcLockPath, "utf8").replace(/^\uFEFF/, ""));
  if (lock.version === "0.9.0") pass("CP29 source release-candidate lock retained.");
  else fail(`CP29 lock version changed unexpectedly: ${String(lock.version)}`);
}

for (const relativePath of [".cp29-rehearsal", ".cp29-worktrees"]) {
  if (existsSync(resolve(root, relativePath))) {
    console.warn(`warning ${relativePath} exists locally; it must remain git-ignored and must not enter delivery archives.`);
  }
}

if (failed) process.exit(1);
console.log("English Focus V1 final-release metadata verified.");
