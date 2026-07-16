import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const candidates = [
  "apps/desktop/src/app/RuntimeBaseline.tsx",
  "apps/desktop/src/app/runtime/RuntimeBaseline.tsx"
];
const testPath = resolve(root, "apps/desktop/tests/runtime/RuntimeBaseline.test.tsx");
const test = existsSync(testPath) ? readFileSync(testPath, "utf8") : "";
let failed = false;

for (const relativePath of candidates) {
  const path = resolve(root, relativePath);
  if (!existsSync(path)) continue;
  const source = readFileSync(path, "utf8");
  const sourceIsCp03 = source.includes("Checkpoint CP03") || source.includes("Checking application runtime");
  const testExpectsCp04 = test.includes("Checkpoint CP04B") || test.includes("Accessible component foundation ready");
  if (sourceIsCp03 && testExpectsCp04) {
    console.error(`✗ Stale checkpoint mismatch: ${relativePath} still renders CP03 while RuntimeBaseline.test.tsx expects CP04B.`);
    failed = true;
  }
}

if (!failed) {
  console.log("✓ No stale RuntimeBaseline checkpoint mismatch detected.");
}
if (failed) process.exit(1);
