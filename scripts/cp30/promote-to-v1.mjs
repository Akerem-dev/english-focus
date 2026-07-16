import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const root = process.cwd();
const fromVersion = process.env.EF_FROM_VERSION ?? "0.9.0";
const toVersion = process.env.EF_TO_VERSION ?? "1.0.0";
const expectedProductName = "English Focus";
const expectedIdentifier = "com.englishfocus.desktop";

function fail(message) {
  console.error(`x ${message}`);
  process.exit(1);
}

function readJson(relativePath) {
  const path = resolve(root, relativePath);
  if (!existsSync(path)) fail(`${relativePath} is missing.`);
  try {
    return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
  } catch (error) {
    fail(`${relativePath} is invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function writeJson(relativePath, value) {
  writeFileSync(resolve(root, relativePath), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function walkPackageJson(directory) {
  const ignored = new Set(["node_modules", ".git", "target", "dist", "release-artifacts", ".cp29-worktrees", ".cp29-rehearsal", "delivery"]);
  const results = [];
  for (const name of readdirSync(directory)) {
    if (ignored.has(name)) continue;
    const path = join(directory, name);
    const info = statSync(path);
    if (info.isDirectory()) results.push(...walkPackageJson(path));
    else if (name === "package.json") results.push(path);
  }
  return results;
}

const lockPath = resolve(root, "release/cp29/release-candidate-lock.json");
if (!existsSync(lockPath)) {
  fail("CP29 release-candidate lock is missing. Complete CP29 before promoting to V1.");
}
const rcLock = JSON.parse(readFileSync(lockPath, "utf8").replace(/^\uFEFF/, ""));
if (rcLock.version !== fromVersion) {
  fail(`CP29 lock must target ${fromVersion}; received ${String(rcLock.version)}.`);
}

const tauri = readJson("apps/desktop/src-tauri/tauri.conf.json");
if (tauri.productName !== expectedProductName) fail(`Unexpected productName: ${String(tauri.productName)}`);
if (tauri.identifier !== expectedIdentifier) fail(`Unexpected identifier: ${String(tauri.identifier)}`);
if (tauri.version !== fromVersion && tauri.version !== toVersion) {
  fail(`tauri.conf.json must be ${fromVersion} before promotion; received ${String(tauri.version)}.`);
}

let changedPackages = 0;
for (const packagePath of walkPackageJson(root)) {
  const relativePath = relative(root, packagePath).replaceAll("\\", "/");
  const pkg = JSON.parse(readFileSync(packagePath, "utf8").replace(/^\uFEFF/, ""));
  if (pkg.version === fromVersion) {
    pkg.version = toVersion;
    if (relativePath === "package.json") {
      pkg.scripts = {
        ...(pkg.scripts ?? {}),
        "cp30:verify": "node scripts/cp30/verify-final-release.mjs",
        "cp30:lock": "node scripts/cp30/create-final-release-lock.mjs",
        "cp30:lock:verify": "node scripts/cp30/verify-final-release-lock.mjs"
      };
    }
    writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
    changedPackages += 1;
  } else if (pkg.version !== toVersion && (relativePath === "package.json" || relativePath.startsWith("apps/") || relativePath.startsWith("packages/"))) {
    fail(`${relativePath} has unexpected workspace version ${String(pkg.version)}.`);
  }
}

const lockfile = readJson("package-lock.json");
if (lockfile.version === fromVersion) lockfile.version = toVersion;
if (lockfile.packages && typeof lockfile.packages === "object") {
  for (const [key, entry] of Object.entries(lockfile.packages)) {
    if ((key === "" || key.startsWith("apps/") || key.startsWith("packages/")) && entry && typeof entry === "object" && entry.version === fromVersion) {
      entry.version = toVersion;
    }
  }
}
writeJson("package-lock.json", lockfile);

tauri.version = toVersion;
writeJson("apps/desktop/src-tauri/tauri.conf.json", tauri);

const cargoTomlPath = resolve(root, "apps/desktop/src-tauri/Cargo.toml");
let cargoToml = readFileSync(cargoTomlPath, "utf8");
const cargoVersionPattern = /(^\s*version\s*=\s*")([^"]+)("\s*$)/m;
const cargoMatch = cargoToml.match(cargoVersionPattern);
if (!cargoMatch) fail("Cargo.toml package version was not found.");
if (cargoMatch[2] !== fromVersion && cargoMatch[2] !== toVersion) fail(`Cargo.toml has unexpected version ${cargoMatch[2]}.`);
cargoToml = cargoToml.replace(cargoVersionPattern, `$1${toVersion}$3`);
writeFileSync(cargoTomlPath, cargoToml, "utf8");

const cargoLockPath = resolve(root, "apps/desktop/src-tauri/Cargo.lock");
if (existsSync(cargoLockPath)) {
  let cargoLock = readFileSync(cargoLockPath, "utf8");
  const escapedName = "english-learning-platform".replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rootPackagePattern = new RegExp(`(name = "${escapedName}"\\r?\\nversion = ")${fromVersion.replaceAll(".", "\\.")}("\\r?\\n)`);
  cargoLock = cargoLock.replace(rootPackagePattern, `$1${toVersion}$2`);
  writeFileSync(cargoLockPath, cargoLock, "utf8");
}

console.log(`English Focus promoted from ${fromVersion} to ${toVersion}.`);
console.log(`Workspace package files updated: ${changedPackages}.`);
console.log("Product name, identifier and installer identity were preserved.");
