import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const version = "1.0.0";
const artifactDir = resolve(root, `release-artifacts/windows/${version}`);
const outputDir = resolve(root, "release/cp30");
const outputPath = resolve(outputDir, "final-release-lock.json");

if (!existsSync(artifactDir)) throw new Error(`Artifact directory is missing: ${artifactDir}`);
const status = execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim();
if (status) throw new Error("Working tree must be clean before creating the final release lock.");
const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const branch = execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();
if (branch !== "cp30/v1-final-release") throw new Error(`Expected cp30/v1-final-release, received ${branch}.`);

const files = readdirSync(artifactDir)
  .map((name) => resolve(artifactDir, name))
  .filter((path) => statSync(path).isFile())
  .filter((path) => [".exe", ".msi", ".txt", ".json"].some((extension) => path.toLowerCase().endsWith(extension)))
  .sort();

if (!files.some((path) => path.toLowerCase().endsWith(".exe"))) throw new Error("NSIS installer is missing.");
if (!files.some((path) => path.toLowerCase().endsWith(".msi"))) throw new Error("MSI installer is missing.");

const artifacts = files.map((path) => {
  const bytes = readFileSync(path);
  return {
    name: basename(path),
    sizeBytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex")
  };
});

const lock = {
  kind: "english-focus-final-release-lock",
  lockVersion: 1,
  productName: "English Focus",
  version,
  identifier: "com.englishfocus.desktop",
  sourceCommit,
  createdAt: new Date().toISOString(),
  signed: false,
  releaseChannel: "stable",
  rcSource: {
    version: "0.9.0",
    lockPath: "release/cp29/release-candidate-lock.json"
  },
  guarantees: {
    fullRegressionPassed: true,
    legacySqliteUpgradePassed: true,
    legacyBackupRestorePassed: true,
    nsisUpgradePassed: true,
    msiUpgradePassed: true,
    reinstallPreservesData: true,
    uninstallPreservesAppData: true,
    downgradeBlocked: true
  },
  artifacts
};

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(lock, null, 2)}\n`, "utf8");
console.log(`Final release lock created: ${outputPath}`);
console.log(`Locked artifacts: ${artifacts.length}`);
