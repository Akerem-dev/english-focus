import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const rustMigrationPath = resolve(
  root,
  "apps/desktop/src-tauri/src/database/migrations.rs"
);
const sqlDirectory = resolve(root, "apps/desktop/src/infrastructure/database/migrations");

const expectedSources = new Map([
  ["METADATA_SCHEMA", "0000_schema_metadata.sql"],
  ["MIGRATION_1", "0001_initial.sql"],
  ["MIGRATION_2", "0002_activity_settings.sql"],
  ["MIGRATION_3", "0003_user_metadata.sql"]
]);

function normalizeSql(value) {
  return value
    .replaceAll("\r\n", "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ");
}

function extractRustSql(source, constantName) {
  const expression = new RegExp(
    `const\\s+${constantName}:\\s*&str\\s*=\\s*r#"([\\s\\S]*?)"#;`
  );
  const match = source.match(expression);

  if (match?.[1] === undefined) {
    throw new Error(`Rust migration constant ${constantName} could not be found.`);
  }

  return normalizeSql(match[1]);
}

const rustSource = readFileSync(rustMigrationPath, "utf8");
const actualSqlFiles = readdirSync(sqlDirectory)
  .filter((fileName) => fileName.endsWith(".sql"))
  .sort();
const expectedSqlFiles = [...expectedSources.values()].sort();

if (actualSqlFiles.join("\n") !== expectedSqlFiles.join("\n")) {
  console.error("Migration source files do not match the versioned native migration set.");
  console.error(`Expected: ${expectedSqlFiles.join(", ")}`);
  console.error(`Actual: ${actualSqlFiles.join(", ")}`);
  process.exit(1);
}

let failed = false;

for (const [constantName, fileName] of expectedSources) {
  const rustSql = extractRustSql(rustSource, constantName);
  const fileSql = normalizeSql(readFileSync(resolve(sqlDirectory, fileName), "utf8"));

  if (rustSql !== fileSql) {
    console.error(`${fileName} has drifted from ${constantName} in the native migration runner.`);
    failed = true;
  }

  if (!/\bCREATE\s+(?:TABLE|INDEX)\b/i.test(fileSql)) {
    console.error(`${fileName} does not contain an executable schema statement.`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log(
  `Migration sources OK: ${expectedSqlFiles.length} executable SQL files match the native version chain.`
);
