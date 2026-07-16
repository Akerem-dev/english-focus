import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const expectedVersion = process.env.EF_EXPECTED_VERSION ?? "0.9.0";
const expectedProductName = "English Focus";
const expectedIdentifier = "com.englishfocus.desktop";

function fail(message) {
  console.error(`✗ ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`✓ ${message}`);
}

function readJson(relativePath) {
  const path = resolve(root, relativePath);
  if (!existsSync(path)) {
    fail(`${relativePath}: missing`);
    return undefined;
  }
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`${relativePath}: invalid JSON (${error instanceof Error ? error.message : String(error)})`);
    return undefined;
  }
}

const rootPackage = readJson("package.json");
const desktopPackage = readJson("apps/desktop/package.json");
const tauriConfig = readJson("apps/desktop/src-tauri/tauri.conf.json");
const lockfile = readJson("package-lock.json");

const versions = [
  ["package.json", rootPackage?.version],
  ["apps/desktop/package.json", desktopPackage?.version],
  ["apps/desktop/src-tauri/tauri.conf.json", tauriConfig?.version],
  ["package-lock.json", lockfile?.version]
];

for (const [file, version] of versions) {
  if (version !== expectedVersion) {
    fail(`${file}: expected version ${expectedVersion}, received ${String(version)}`);
  } else {
    pass(`${file}: version ${expectedVersion}`);
  }
}

if (tauriConfig?.productName !== expectedProductName) {
  fail(`tauri.conf.json: expected productName ${expectedProductName}`);
} else {
  pass(`Product name: ${expectedProductName}`);
}

if (tauriConfig?.identifier !== expectedIdentifier) {
  fail(`tauri.conf.json: expected identifier ${expectedIdentifier}`);
} else {
  pass(`Identifier: ${expectedIdentifier}`);
}

const cargoPath = resolve(root, "apps/desktop/src-tauri/Cargo.toml");
if (!existsSync(cargoPath)) {
  fail("Cargo.toml: missing");
} else {
  const cargo = readFileSync(cargoPath, "utf8");
  const match = cargo.match(/^version\s*=\s*"([^"]+)"/m);
  if (match?.[1] !== expectedVersion) {
    fail(`Cargo.toml: expected version ${expectedVersion}, received ${match?.[1] ?? "missing"}`);
  } else {
    pass(`Cargo.toml: version ${expectedVersion}`);
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}
