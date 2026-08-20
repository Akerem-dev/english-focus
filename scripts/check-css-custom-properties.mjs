import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const stylesDirectory = resolve(process.cwd(), "apps/desktop/src/styles");
const files = readdirSync(stylesDirectory)
  .filter((fileName) => fileName.endsWith(".css"))
  .sort();
const definitions = new Set();
const usages = [];

for (const fileName of files) {
  const source = readFileSync(resolve(stylesDirectory, fileName), "utf8");

  for (const match of source.matchAll(/(--[a-z0-9-]+)\s*:/gi)) {
    definitions.add(match[1]);
  }

  // An undefined custom property is only a broken reference when the var() call has no
  // CSS fallback. Historical cleanroom packages intentionally use self-contained fallback
  // values so their approved visual output does not depend on the current token namespace.
  for (const match of source.matchAll(/var\(\s*(--[a-z0-9-]+)([^)]*)\)/gi)) {
    const line = source.slice(0, match.index).split(/\r?\n/).length;
    const hasFallback = match[2].includes(",");
    usages.push({ fileName, line, property: match[1], hasFallback });
  }
}

const missing = usages.filter(
  (usage) => !usage.hasFallback && !definitions.has(usage.property)
);
if (missing.length > 0) {
  console.error("Undefined CSS custom properties without fallbacks:\n");
  for (const usage of missing) {
    console.error(`- ${usage.fileName}:${usage.line} ${usage.property}`);
  }
  process.exit(1);
}

console.log(
  `CSS custom-property check passed: ${definitions.size} definitions cover ${usages.length} usages across ${files.length} files; fallback-backed legacy references are accepted.`
);
