import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const failures = [];
const internalWorkspaceVersion = "0.0.0";

function readJson(relativePath) {
  const absolutePath = resolve(root, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`Missing required file: ${relativePath}`);
    return {};
  }

  try {
    return JSON.parse(readFileSync(absolutePath, "utf8").replace(/^\uFEFF/, ""));
  } catch (error) {
    failures.push(
      `${relativePath} is invalid JSON: ${error instanceof Error ? error.message : String(error)}`
    );
    return {};
  }
}

function readText(relativePath) {
  const absolutePath = resolve(root, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`Missing required file: ${relativePath}`);
    return "";
  }
  return readFileSync(absolutePath, "utf8").replace(/^\uFEFF/, "");
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const rootPackage = readJson("package.json");
const desktopPackage = readJson("apps/desktop/package.json");
const packageLock = readJson("package-lock.json");
const tauriConfig = readJson("apps/desktop/src-tauri/tauri.conf.json");
const cargoToml = readText("apps/desktop/src-tauri/Cargo.toml");
const cargoLock = readText("apps/desktop/src-tauri/Cargo.lock");
const desktopHtml = readText("apps/desktop/index.html");

const cargoVersion = cargoToml.match(/^\s*version\s*=\s*"([^"]+)"/m)?.[1];
const cargoLockVersion = cargoLock.match(
  /\[\[package\]\]\r?\nname = "english-learning-platform"\r?\nversion = "([^"]+)"/
)?.[1];
const expectedVersion = rootPackage.version;
const releaseVersions = [
  ["root package", rootPackage.version],
  ["desktop package", desktopPackage.version],
  ["package-lock document", packageLock.version],
  ["package-lock root", packageLock.packages?.[""]?.version],
  ["package-lock desktop", packageLock.packages?.["apps/desktop"]?.version],
  ["Tauri", tauriConfig.version],
  ["Cargo", cargoVersion],
  ["Cargo.lock local package", cargoLockVersion]
];

assert(
  /^\d+\.\d+\.\d+$/.test(expectedVersion ?? ""),
  "Release version must use numeric major.minor.patch format."
);
assert(expectedVersion !== internalWorkspaceVersion, "Release version must not remain 0.0.0.");
for (const [source, version] of releaseVersions) {
  assert(
    version === expectedVersion,
    `${source} version ${String(version)} does not match ${String(expectedVersion)}.`
  );
}

for (const workspacePath of ["packages/domain", "packages/schemas", "packages/testing"]) {
  const workspacePackage = readJson(`${workspacePath}/package.json`);
  const lockVersion = packageLock.packages?.[workspacePath]?.version;
  assert(
    workspacePackage.version === internalWorkspaceVersion,
    `${workspacePath}/package.json must remain ${internalWorkspaceVersion}; received ${String(workspacePackage.version)}.`
  );
  assert(
    lockVersion === internalWorkspaceVersion,
    `package-lock ${workspacePath} must remain ${internalWorkspaceVersion}; received ${String(lockVersion)}.`
  );
}

assert(tauriConfig.productName === "English Focus", "Tauri productName must remain English Focus.");
assert(
  tauriConfig.identifier === "com.englishfocus.desktop",
  "The stable Windows application identifier changed unexpectedly."
);
assert(tauriConfig.bundle?.active === true, "Tauri bundling must remain active.");
assert(
  tauriConfig.bundle?.createUpdaterArtifacts === false,
  "Updater artifacts must stay disabled until a signed update endpoint and public key are configured."
);
const targets = Array.isArray(tauriConfig.bundle?.targets) ? tauriConfig.bundle.targets : [];
assert(
  targets.includes("msi") && targets.includes("nsis") && targets.length === 2,
  "Only MSI and NSIS targets are expected."
);
assert(tauriConfig.bundle?.category === "Education", "Release category must be Education.");
assert(Boolean(tauriConfig.bundle?.publisher), "A Windows installer publisher must be declared.");
assert(
  tauriConfig.bundle?.windows?.allowDowngrades === false,
  "Installer downgrades must be blocked."
);
assert(
  tauriConfig.bundle?.windows?.webviewInstallMode?.type === "downloadBootstrapper",
  "WebView2 fallback must use the bootstrapper."
);
assert(
  tauriConfig.bundle?.windows?.nsis?.installMode === "currentUser",
  "NSIS must default to current-user installation."
);

const csp = tauriConfig.app?.security?.csp;
assert(
  csp && typeof csp === "object" && !Array.isArray(csp),
  "Tauri CSP must be enabled as a directive map."
);
for (const directive of [
  "default-src",
  "connect-src",
  "font-src",
  "img-src",
  "object-src",
  "base-uri",
  "frame-ancestors",
  "style-src"
]) {
  assert(typeof csp?.[directive] === "string", `Tauri CSP is missing ${directive}.`);
}
assert(csp?.["object-src"] === "'none'", "Tauri CSP must block object sources.");
assert(csp?.["base-uri"] === "'none'", "Tauri CSP must block base URI injection.");
assert(csp?.["frame-ancestors"] === "'none'", "Tauri CSP must block framing.");
assert(
  csp?.["connect-src"]?.includes("ipc:"),
  "Tauri CSP connect-src must allow the IPC protocol."
);

const securityHeaders = tauriConfig.app?.security?.headers;
assert(
  securityHeaders?.["X-Content-Type-Options"] === "nosniff",
  "X-Content-Type-Options must remain nosniff."
);
assert(
  desktopHtml.includes('<meta name="referrer" content="no-referrer" />'),
  "Desktop HTML must retain the no-referrer policy."
);

for (const [label, version] of [
  ["WiX/MSI", tauriConfig.bundle?.windows?.wix?.version],
  ["MSI", tauriConfig.bundle?.windows?.msi?.version],
  ["NSIS", tauriConfig.bundle?.windows?.nsis?.version]
]) {
  if (version !== undefined) {
    assert(
      version === expectedVersion,
      `${label} installer version ${String(version)} does not match ${String(expectedVersion)}.`
    );
  }
}

assert(
  /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/.test(
    tauriConfig.bundle?.windows?.wix?.upgradeCode ?? ""
  ),
  "MSI upgradeCode must be a stable uppercase GUID."
);
for (const icon of tauriConfig.bundle?.icon ?? []) {
  assert(
    existsSync(resolve(root, "apps/desktop/src-tauri", icon)),
    `Configured installer icon does not exist: ${icon}`
  );
}
assert(
  !tauriConfig.bundle?.windows?.certificateThumbprint,
  "A signing certificate thumbprint must not be committed."
);
assert(
  !tauriConfig.bundle?.windows?.signCommand,
  "A Windows signing command must not be committed."
);

if (failures.length > 0) {
  console.error("Release metadata check failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Release metadata check passed for English Focus ${expectedVersion}.`);
console.log("Windows targets: MSI, NSIS");
console.log(
  "Signing policy: stable release artifacts require external Windows code-signing configuration."
);
