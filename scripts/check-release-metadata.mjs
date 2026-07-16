import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const failures = [];

function readJson(relativePath) {
  const absolutePath = resolve(root, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`Missing required file: ${relativePath}`);
    return {};
  }
  return JSON.parse(readFileSync(absolutePath, "utf8"));
}

function readText(relativePath) {
  const absolutePath = resolve(root, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`Missing required file: ${relativePath}`);
    return "";
  }
  return readFileSync(absolutePath, "utf8");
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const rootPackage = readJson("package.json");
const desktopPackage = readJson("apps/desktop/package.json");
const packageLock = readJson("package-lock.json");
const tauriConfig = readJson("apps/desktop/src-tauri/tauri.conf.json");
const cargoToml = readText("apps/desktop/src-tauri/Cargo.toml");

const cargoVersion = cargoToml.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
const versions = [
  ["root package", rootPackage.version],
  ["desktop package", desktopPackage.version],
  ["package-lock root", packageLock.packages?.[""]?.version],
  ["package-lock desktop", packageLock.packages?.["apps/desktop"]?.version],
  ["Tauri", tauriConfig.version],
  ["Cargo", cargoVersion]
];
const expectedVersion = versions[0][1];

assert(/^\d+\.\d+\.\d+$/.test(expectedVersion ?? ""), "Release version must use numeric major.minor.patch format.");
assert(expectedVersion !== "0.0.0", "Release version must not remain 0.0.0.");
for (const [source, version] of versions) {
  assert(version === expectedVersion, `${source} version ${String(version)} does not match ${String(expectedVersion)}.`);
}

assert(tauriConfig.productName === "English Focus", "Tauri productName must remain English Focus.");
assert(tauriConfig.identifier === "com.englishfocus.desktop", "The stable Windows application identifier changed unexpectedly.");
assert(tauriConfig.bundle?.active === true, "Tauri bundling must be active for CP27.");
const targets = Array.isArray(tauriConfig.bundle?.targets) ? tauriConfig.bundle.targets : [];
assert(targets.includes("msi") && targets.includes("nsis") && targets.length === 2, "Only MSI and NSIS targets are expected.");
assert(tauriConfig.bundle?.category === "Education", "Release category must be Education.");
assert(Boolean(tauriConfig.bundle?.publisher), "A Windows installer publisher must be declared.");
assert(tauriConfig.bundle?.windows?.allowDowngrades === false, "Installer downgrades must be blocked.");
assert(tauriConfig.bundle?.windows?.webviewInstallMode?.type === "downloadBootstrapper", "WebView2 fallback must use the bootstrapper.");
assert(tauriConfig.bundle?.windows?.nsis?.installMode === "currentUser", "NSIS must default to current-user installation.");
assert(tauriConfig.bundle?.windows?.wix?.version === expectedVersion, "MSI version must match the app version.");
assert(/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/.test(tauriConfig.bundle?.windows?.wix?.upgradeCode ?? ""), "MSI upgradeCode must be a stable uppercase GUID.");
for (const icon of tauriConfig.bundle?.icon ?? []) {
  assert(existsSync(resolve(root, "apps/desktop/src-tauri", icon)), `Configured installer icon does not exist: ${icon}`);
}
assert(!tauriConfig.bundle?.windows?.certificateThumbprint, "A signing certificate thumbprint must not be committed.");
assert(!tauriConfig.bundle?.windows?.signCommand, "A Windows signing command must not be committed.");

if (failures.length > 0) {
  console.error("Release metadata check failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Release metadata check passed for English Focus ${expectedVersion}.`);
console.log("Windows targets: MSI, NSIS");
console.log("Signing mode: unsigned release-candidate build");
