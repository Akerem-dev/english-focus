import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const requiredIgnorePatterns = [
  "node_modules/",
  "dist/",
  "target/",
  ".env",
  "*.sqlite",
  "*.db",
];
const forbiddenTrackedPatterns = [
  /(^|\/)node_modules\//,
  /(^|\/)target\//,
  /(^|\/)dist\//,
  /\.(?:sqlite|sqlite3|db|db-wal|db-shm|db-journal)$/,
  /(^|\/)backups\//,
  /(^|\/)exports\//,
];

function runGit(args, options = {}) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  }).trim();
}

function pass(label, detail) {
  console.log(`✓ ${label}: PASS${detail ? ` — ${detail}` : ""}`);
}

function warn(label, detail) {
  console.log(`! ${label}: WARN${detail ? ` — ${detail}` : ""}`);
}

function fail(label, detail) {
  console.error(`✗ ${label}: FAIL${detail ? ` — ${detail}` : ""}`);
  process.exitCode = 1;
}

try {
  const inside = runGit(["rev-parse", "--is-inside-work-tree"]);
  inside === "true"
    ? pass("Git repository", root)
    : fail("Git repository", "current directory is not a Git work tree");
} catch {
  fail("Git repository", "run `git init` in the project root first");
  process.exit();
}

const ignorePath = resolve(root, ".gitignore");
if (!existsSync(ignorePath)) {
  fail(".gitignore", "file is missing");
} else {
  const ignoreContent = readFileSync(ignorePath, "utf8");
  const missing = requiredIgnorePatterns.filter(
    (pattern) => !ignoreContent.includes(pattern),
  );
  missing.length === 0
    ? pass(".gitignore", "required generated and sensitive paths are covered")
    : fail(".gitignore", `missing: ${missing.join(", ")}`);
}

let trackedFiles = [];
try {
  trackedFiles = runGit(["ls-files"])
    .split(/\r?\n/u)
    .filter(Boolean);
} catch {
  trackedFiles = [];
}

const forbiddenTracked = trackedFiles.filter((file) => {
  const normalized = file.replaceAll("\\", "/");
  const isForbiddenEnvironmentFile =
    /(^|\/)\.env(?:\.|$)/u.test(normalized) &&
    !normalized.endsWith("/.env.example") &&
    normalized !== ".env.example";

  return (
    isForbiddenEnvironmentFile ||
    forbiddenTrackedPatterns.some((pattern) => pattern.test(normalized))
  );
});
forbiddenTracked.length === 0
  ? pass("Tracked files", `${trackedFiles.length} tracked file(s), no generated or sensitive paths`)
  : fail("Tracked files", `remove from Git index: ${forbiddenTracked.join(", ")}`);

try {
  const branch = runGit(["branch", "--show-current"]);
  branch === "main"
    ? pass("Default branch", "main")
    : warn("Default branch", branch || "unborn branch; run `git branch -M main`");
} catch {
  warn("Default branch", "could not read branch name");
}

try {
  const origin = runGit(["remote", "get-url", "origin"]);
  origin
    ? pass("Remote origin", origin)
    : warn("Remote origin", "not configured yet");
} catch {
  warn("Remote origin", "not configured yet");
}

try {
  const status = runGit(["status", "--short"]);
  status
    ? warn("Working tree", "contains uncommitted changes; review before committing")
    : pass("Working tree", "clean");
} catch {
  warn("Working tree", "status could not be read");
}

if (process.exitCode) {
  console.error("\nGit hygiene check failed.");
} else {
  console.log("\nGit hygiene check passed.");
}
