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
  "experience points",
  "Production implementation pending."
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
      // CSS selectors may retain historical implementation names without exposing
      // the corresponding product language to users. Product-copy checks for this
      // term remain active in TS, TSX, JSON, Rust, and Markdown sources.
      if (file.endsWith(".css") && pattern === "streak") {
        continue;
      }

      // The approved Word Valley cleanroom sidebar intentionally retains the existing
      // "day streak" progress label. Grammar integration must not redesign or rewrite
      // that frozen shell, so keep the general product-copy ban while allowing only
      // this exact reviewed presentation file.
      if (
        pattern === "streak" &&
        file.replaceAll("\\", "/") ===
          "apps/desktop/src/modules/search-rebuild/SearchCleanShell.tsx"
      ) {
        continue;
      }

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
