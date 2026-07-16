import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const version = process.env.EF_EXPECTED_VERSION ?? "0.9.0";
const artifactDir = resolve(root, process.env.EF_ARTIFACT_DIR ?? `release-artifacts/windows/${version}`);
const outputDir = resolve(root, "release/cp29");
mkdirSync(outputDir, { recursive: true });

const sha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const branch = execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();
const status = execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim();
if (branch !== "cp29/release-candidate-lock") throw new Error(`Expected cp29/release-candidate-lock, received ${branch}`);
if (status.length > 0) throw new Error("Working tree must be clean before creating the RC lock.");
if (!existsSync(artifactDir)) throw new Error(`Artifact directory missing: ${artifactDir}`);

const artifacts = readdirSync(artifactDir)
  .map((name) => join(artifactDir, name))
  .filter((path) => statSync(path).isFile() && /\.(exe|msi)$/i.test(path))
  .map((path) => {
    const bytes = readFileSync(path);
    return {
      name: basename(path),
      sizeBytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex")
    };
  });
if (!artifacts.some((artifact) => artifact.name.toLowerCase().endsWith(".exe"))) {
  throw new Error("An NSIS EXE artifact is required for the RC lock.");
}
if (!artifacts.some((artifact) => artifact.name.toLowerCase().endsWith(".msi"))) {
  throw new Error("A WiX MSI artifact is required for the RC lock.");
}

const lock = {
  kind: "english-focus-release-candidate-lock",
  lockVersion: 1,
  productName: "English Focus",
  version,
  releaseCandidate: "0.9.0-rc.1",
  branch,
  commit: sha,
  createdAt: new Date().toISOString(),
  databaseMigrationMatrix: ["fresh → current", "schema 1 → current", "schema 2 → current", "schema 3 → current"],
  backupCompatibilityMatrix: ["legacy schema 2", "schema 3", "current backup manifest"],
  installerMatrix: ["NSIS fresh install", "NSIS reinstall", "NSIS legacy upgrade", "MSI fresh install", "MSI legacy upgrade"],
  requiredResults: {
    fullRegression: "passed",
    legacySqliteMigration: "passed",
    legacyBackupValidationAndRestore: "passed",
    installerUpgrade: "passed",
    dataPreservation: "passed"
  },
  artifacts
};

const path = resolve(outputDir, "release-candidate-lock.json");
writeFileSync(path, `${JSON.stringify(lock, null, 2)}\n`, "utf8");
console.log(`Release-candidate lock created: ${path}`);
