import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd(), "apps/desktop/src-tauri/src");
const expectedCurrentVersion = Number(process.env.EF_EXPECTED_DB_SCHEMA ?? "3");

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const rustFiles = walk(root).filter((path) => path.endsWith(".rs"));
const migrationFiles = rustFiles.filter((path) => {
  const text = readFileSync(path, "utf8");
  return text.includes("database_schema_version") || text.includes("schema_metadata") || path.includes("migration");
});

if (migrationFiles.length === 0) {
  console.error("✗ No Rust migration source was found.");
  process.exit(1);
}

const combined = migrationFiles.map((path) => readFileSync(path, "utf8")).join("\n");
const missingVersions = [];
for (let version = 1; version <= expectedCurrentVersion; version += 1) {
  const patterns = [
    new RegExp(`\\b${version}\\b`),
    new RegExp(`\"${version}\"`),
    new RegExp(`version[^\\n]{0,40}${version}`, "i")
  ];
  if (!patterns.some((pattern) => pattern.test(combined))) missingVersions.push(version);
}

if (missingVersions.length > 0) {
  console.error(`✗ Migration source does not visibly cover schema version(s): ${missingVersions.join(", ")}`);
  process.exit(1);
}

console.log(`✓ Migration source found in ${migrationFiles.length} file(s); visible schema coverage 1 → ${expectedCurrentVersion}.`);
