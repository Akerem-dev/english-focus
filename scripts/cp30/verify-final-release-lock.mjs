import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const lockPath = resolve(root, "release/cp30/final-release-lock.json");
if (!existsSync(lockPath)) throw new Error("final-release-lock.json is missing.");
const lock = JSON.parse(readFileSync(lockPath, "utf8").replace(/^\uFEFF/, ""));
if (lock.kind !== "english-focus-final-release-lock") throw new Error("Unexpected final lock kind.");
if (lock.version !== "1.0.0") throw new Error(`Final lock version must be 1.0.0; received ${String(lock.version)}.`);
if (lock.identifier !== "com.englishfocus.desktop") throw new Error("Installer identifier changed.");

const currentSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
let parentSha = "";
try { parentSha = execFileSync("git", ["rev-parse", "HEAD^"], { encoding: "utf8" }).trim(); } catch {}
if (lock.sourceCommit !== currentSha && lock.sourceCommit !== parentSha) {
  throw new Error(`Locked source ${lock.sourceCommit} matches neither HEAD ${currentSha} nor parent ${parentSha || "missing"}.`);
}

const artifactDir = resolve(root, "release-artifacts/windows/1.0.0");
for (const artifact of lock.artifacts) {
  const path = resolve(artifactDir, artifact.name);
  if (!existsSync(path)) throw new Error(`Locked artifact is missing: ${artifact.name}`);
  const bytes = readFileSync(path);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== artifact.sha256) throw new Error(`Artifact hash changed: ${artifact.name}`);
  if (bytes.length !== artifact.sizeBytes) throw new Error(`Artifact size changed: ${artifact.name}`);
}
console.log("English Focus 1.0.0 final release lock verified against source and artifacts.");
