import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = process.cwd();
const expectedVersion = process.env.EF_EXPECTED_VERSION ?? "1.0.0";
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

if (tauri?.productName === expectedProductName) pass(`Product name: ${expectedProductName}`);
else fail(`Unexpected product name: ${String(tauri?.productName)}`);
if (tauri?.identifier === expectedIdentifier) pass(`Identifier: ${expectedIdentifier}`);
else fail(`Unexpected identifier: ${String(tauri?.identifier)}`);

const cargoPath = resolve(root, "apps/desktop/src-tauri/Cargo.toml");
if (!existsSync(cargoPath)) fail("Cargo.toml is missing.");
else {
  const match = readFileSync(cargoPath, "utf8").match(/^\s*version\s*=\s*"([^"]+)"/m);
  if (match?.[1] === expectedVersion) pass(`Cargo.toml: ${expectedVersion}`);
  else fail(`Cargo.toml: expected ${expectedVersion}, received ${match?.[1] ?? "missing"}`);
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

const forbiddenReleasePaths = [".cp29-rehearsal", ".cp29-worktrees"];
for (const relativePath of forbiddenReleasePaths) {
  if (existsSync(resolve(root, relativePath))) {
    console.warn(`warning ${relativePath} exists locally; it must remain git-ignored and must not enter delivery archives.`);
  }
}

const workspaceVersions = [];
for (const base of ["apps", "packages"]) {
  const basePath = resolve(root, base);
  if (!existsSync(basePath)) continue;
  for (const name of readdirSync(basePath)) {
    const packagePath = join(basePath, name, "package.json");
    if (!existsSync(packagePath)) continue;
    const pkg = JSON.parse(readFileSync(packagePath, "utf8").replace(/^\uFEFF/, ""));
    workspaceVersions.push([relative(root, packagePath).replaceAll("\\", "/"), pkg.version]);
  }
}
for (const [path, version] of workspaceVersions) {
  if (version === expectedVersion) pass(`${path}: ${expectedVersion}`);
  else fail(`${path}: expected ${expectedVersion}, received ${String(version)}`);
}

if (failed) process.exit(1);
console.log("English Focus V1 final-release metadata verified.");
