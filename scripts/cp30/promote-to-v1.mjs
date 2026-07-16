import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const fromVersion = process.env.EF_FROM_VERSION ?? "0.9.0";
const toVersion = process.env.EF_TO_VERSION ?? "1.0.0";
const internalWorkspaceVersion = "0.0.0";
const expectedProductName = "English Focus";
const expectedIdentifier = "com.englishfocus.desktop";

function fail(message) {
  console.error(`x ${message}`);
  process.exit(1);
}

function readText(relativePath) {
  const path = resolve(root, relativePath);
  if (!existsSync(path)) fail(`${relativePath} is missing.`);
  return readFileSync(path, "utf8").replace(/^\uFEFF/, "");
}

function readJson(relativePath) {
  try {
    return JSON.parse(readText(relativePath));
  } catch (error) {
    fail(`${relativePath} is invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function writeJson(relativePath, value) {
  writeFileSync(resolve(root, relativePath), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function requirePromotableVersion(relativePath, version) {
  if (version !== fromVersion && version !== toVersion) {
    fail(`${relativePath} must be ${fromVersion} or ${toVersion}; received ${String(version)}.`);
  }
}

const lockPath = resolve(root, "release/cp29/release-candidate-lock.json");
if (!existsSync(lockPath)) {
  fail("CP29 release-candidate lock is missing. Complete CP29 before promoting to V1.");
}
const rcLock = JSON.parse(readText("release/cp29/release-candidate-lock.json"));
if (rcLock.version !== fromVersion) {
  fail(`CP29 lock must target ${fromVersion}; received ${String(rcLock.version)}.`);
}

const releasePackagePaths = ["package.json", "apps/desktop/package.json"];
for (const relativePath of releasePackagePaths) {
  const pkg = readJson(relativePath);
  requirePromotableVersion(relativePath, pkg.version);
  pkg.version = toVersion;

  if (relativePath === "package.json") {
    pkg.scripts = {
      ...(pkg.scripts ?? {}),
      "cp30:verify": "node scripts/cp30/verify-final-release.mjs",
      "cp30:lock": "node scripts/cp30/create-final-release-lock.mjs",
      "cp30:lock:verify": "node scripts/cp30/verify-final-release-lock.mjs"
    };
  }

  writeJson(relativePath, pkg);
}

const internalPackagePaths = [
  "packages/domain/package.json",
  "packages/schemas/package.json",
  "packages/shared/package.json",
  "packages/testing/package.json"
];
for (const relativePath of internalPackagePaths) {
  const pkg = readJson(relativePath);
  if (pkg.version !== internalWorkspaceVersion) {
    fail(
      `${relativePath} is an internal workspace package and must remain ${internalWorkspaceVersion}; received ${String(pkg.version)}.`
    );
  }
}

const lockfile = readJson("package-lock.json");
requirePromotableVersion("package-lock.json", lockfile.version);
lockfile.version = toVersion;

if (lockfile.packages && typeof lockfile.packages === "object") {
  for (const key of ["", "apps/desktop"]) {
    const entry = lockfile.packages[key];
    if (!entry || typeof entry !== "object") {
      fail(`package-lock.json is missing workspace entry: ${key || "<root>"}.`);
    }
    requirePromotableVersion(`package-lock.json packages[${key || "<root>"}]`, entry.version);
    entry.version = toVersion;
  }

  for (const key of [
    "packages/domain",
    "packages/schemas",
    "packages/shared",
    "packages/testing"
  ]) {
    const entry = lockfile.packages[key];
    if (entry && typeof entry === "object" && entry.version !== internalWorkspaceVersion) {
      fail(`package-lock.json ${key} must remain ${internalWorkspaceVersion}; received ${String(entry.version)}.`);
    }
  }
}
writeJson("package-lock.json", lockfile);

const tauri = readJson("apps/desktop/src-tauri/tauri.conf.json");
if (tauri.productName !== expectedProductName) fail(`Unexpected productName: ${String(tauri.productName)}`);
if (tauri.identifier !== expectedIdentifier) fail(`Unexpected identifier: ${String(tauri.identifier)}`);
requirePromotableVersion("apps/desktop/src-tauri/tauri.conf.json", tauri.version);
tauri.version = toVersion;

const installerVersionTargets = [
  ["bundle.windows.wix.version", tauri.bundle?.windows?.wix],
  ["bundle.windows.msi.version", tauri.bundle?.windows?.msi],
  ["bundle.windows.nsis.version", tauri.bundle?.windows?.nsis]
];

for (const [label, target] of installerVersionTargets) {
  if (target && typeof target === "object" && typeof target.version === "string") {
    requirePromotableVersion(`tauri.conf.json ${label}`, target.version);
    target.version = toVersion;
  }
}

writeJson("apps/desktop/src-tauri/tauri.conf.json", tauri);

const cargoTomlPath = resolve(root, "apps/desktop/src-tauri/Cargo.toml");
let cargoToml = readText("apps/desktop/src-tauri/Cargo.toml");
const cargoVersionPattern = /(^\s*version\s*=\s*")([^"]+)("\s*$)/m;
const cargoMatch = cargoToml.match(cargoVersionPattern);
if (!cargoMatch) fail("Cargo.toml package version was not found.");
requirePromotableVersion("apps/desktop/src-tauri/Cargo.toml", cargoMatch[2]);
cargoToml = cargoToml.replace(cargoVersionPattern, `$1${toVersion}$3`);
writeFileSync(cargoTomlPath, cargoToml, "utf8");

const cargoLockPath = resolve(root, "apps/desktop/src-tauri/Cargo.lock");
if (existsSync(cargoLockPath)) {
  let cargoLock = readText("apps/desktop/src-tauri/Cargo.lock");
  const packagePattern = /(\[\[package\]\]\r?\nname = "english-learning-platform"\r?\nversion = ")([^"]+)(")/;
  const lockMatch = cargoLock.match(packagePattern);
  if (!lockMatch) fail("Cargo.lock local application package was not found.");
  requirePromotableVersion("apps/desktop/src-tauri/Cargo.lock", lockMatch[2]);
  cargoLock = cargoLock.replace(packagePattern, `$1${toVersion}$3`);
  writeFileSync(cargoLockPath, cargoLock, "utf8");
}

console.log(`English Focus promoted from ${fromVersion} to ${toVersion}.`);
console.log("Release-bearing packages updated: root and desktop application.");
console.log(`Internal workspace packages preserved at ${internalWorkspaceVersion}.`);
console.log("Product name, identifier and installer identity were preserved.");
