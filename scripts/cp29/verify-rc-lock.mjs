import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const lockPath = resolve(root, "release/cp29/release-candidate-lock.json");
if (!existsSync(lockPath)) throw new Error("release-candidate-lock.json is missing.");
const lock = JSON.parse(readFileSync(lockPath, "utf8"));
const currentSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
let parentSha;
try {
  parentSha = execFileSync("git", ["rev-parse", "HEAD^"], { encoding: "utf8" }).trim();
} catch {
  parentSha = undefined;
}
if (lock.commit !== currentSha && lock.commit !== parentSha) {
  throw new Error(`RC lock source commit ${lock.commit} matches neither HEAD ${currentSha} nor its parent ${parentSha ?? "missing"}.`);
}
if (lock.version !== "0.9.0") throw new Error(`RC lock version must be 0.9.0, received ${lock.version}.`);

const artifactDir = resolve(root, "release-artifacts/windows/0.9.0");
for (const artifact of lock.artifacts) {
  const path = resolve(artifactDir, artifact.name);
  if (!existsSync(path)) throw new Error(`Locked artifact missing: ${artifact.name}`);
  const bytes = readFileSync(path);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== artifact.sha256) throw new Error(`Locked artifact hash changed: ${basename(path)}`);
}
console.log("Release-candidate lock verified against HEAD and installer artifacts.");
