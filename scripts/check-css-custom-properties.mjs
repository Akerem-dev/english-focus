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

  for (const match of source.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)) {
    const line = source.slice(0, match.index).split(/\r?\n/).length;
    usages.push({ fileName, line, property: match[1] });
  }
}

const missing = usages.filter((usage) => !definitions.has(usage.property));
if (missing.length > 0) {
  console.error("Undefined CSS custom properties:\n");
  for (const usage of missing) {
    console.error(`- ${usage.fileName}:${usage.line} ${usage.property}`);
  }
  process.exit(1);
}

console.log(
  `CSS custom-property check passed: ${definitions.size} definitions cover ${usages.length} usages across ${files.length} files.`
);
