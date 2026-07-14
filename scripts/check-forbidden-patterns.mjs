import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["apps", "packages"];
const forbidden = [
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "GEMINI_API_KEY",
  "localhost:11434",
  "ollama",
  "glassmorphism",
  "streak",
  "experience points"
];

function walk(path) {
  const entries = readdirSync(path);
  const files = [];

  for (const entry of entries) {
    const fullPath = join(path, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) files.push(...walk(fullPath));
    else if (/\.(ts|tsx|rs|json|md|css)$/.test(fullPath)) files.push(fullPath);
  }

  return files;
}

const violations = [];

for (const root of roots) {
  for (const file of walk(root)) {
    const content = readFileSync(file, "utf8").toLowerCase();

    for (const pattern of forbidden) {
      if (content.includes(pattern.toLowerCase())) {
        violations.push(`${file}: ${pattern}`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error("Forbidden product patterns found:");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("Forbidden-pattern check passed.");
