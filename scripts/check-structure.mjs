import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const required = [
  "apps/desktop/src/modules/vocabulary/pages/VocabularyPage.tsx",
  "apps/desktop/src/modules/library/pages/LibraryPage.tsx",
  "apps/desktop/src/modules/settings/pages/SettingsPage.tsx",
  "apps/desktop/src/modules/import-export/overlays/PasteGeneratedJsonDialog.tsx",
  "apps/desktop/src/modules/import-export/overlays/VocabularyPreviewDialog.tsx",
  "apps/desktop/src/modules/import-export/overlays/DuplicateComparisonDialog.tsx",
  "apps/desktop/src/modules/instruction/application/BuildVocabularyInstruction.ts",
  "apps/desktop/src/modules/instruction/application/BuildCorrectionInstruction.ts",
  "apps/desktop/src/modules/search/services/normalizeSearchQuery.ts",
  "apps/desktop/src/app/providers/ClipboardProvider.tsx",
  "apps/desktop/src/app/providers/FileTransferProvider.tsx",
  "apps/desktop/src/app/providers/MaintenanceProvider.tsx",
  "packages/domain/src/ports/LocalFileTransfer.ts",
  "packages/domain/src/vocabulary/VocabularyEntry.ts",
  "packages/domain/src/library/VocabularyUserMetadata.ts",
  "packages/schemas/src/vocabulary/vocabulary-entry.schema.ts",
  "packages/schemas/src/vocabulary/vocabulary-pack.schema.ts",
  "apps/desktop/src/infrastructure/database/migrations/0000_schema_metadata.sql",
  "apps/desktop/src/infrastructure/database/migrations/0001_initial.sql",
  "apps/desktop/src/infrastructure/database/migrations/0002_activity_settings.sql",
  "apps/desktop/src/infrastructure/database/migrations/0003_user_metadata.sql",
  "apps/desktop/src-tauri/src/commands/clipboard.rs",
  "apps/desktop/src-tauri/src/commands/filesystem.rs",
  "testing/e2e/missing-word-json-flow.spec.ts",
  "testing/performance/search-10000-entries.test.ts"
];
const missing = required.filter((path) => !existsSync(path));

if (missing.length > 0) {
  console.error("Missing required product landmarks:");
  for (const path of missing) console.error(`- ${path}`);
  process.exit(1);
}

function walk(path) {
  return readdirSync(path).flatMap((entry) => {
    const fullPath = join(path, entry);
    return statSync(fullPath).isDirectory() ? walk(fullPath) : [fullPath];
  });
}

const presentationViolations = [];
const presentationPatterns = [
  ["infrastructure import", /from\s+["'][^"']*infrastructure\//],
  ["direct Tauri invocation", /@tauri-apps|\binvoke\s*\(/],
  ["direct clipboard access", /navigator\.clipboard/],
  ["direct Blob export", /new\s+Blob\s*\(/],
  ["direct object URL export", /URL\.createObjectURL\s*\(/],
  ["direct local file read", /\bfile\.text\s*\(/]
];

for (const file of walk("apps/desktop/src/modules").filter((path) => /\.tsx?$/.test(path))) {
  const content = readFileSync(file, "utf8");
  for (const [label, pattern] of presentationPatterns) {
    if (pattern.test(content)) {
      presentationViolations.push(`${file}: ${label}`);
    }
  }
}

const testViolations = [];
for (const file of walk("testing/e2e").filter((path) => path.endsWith(".spec.ts"))) {
  const content = readFileSync(file, "utf8");
  if (!/\btest\s*\(/.test(content) || /^\s*export\s*\{\s*\};?\s*$/m.test(content)) {
    testViolations.push(`${file}: missing an executable Playwright test`);
  }
}
for (const file of walk("testing/performance").filter((path) => path.endsWith(".test.ts"))) {
  const content = readFileSync(file, "utf8");
  if (/\b(?:describe|it|test)\.skip\s*\(/.test(content)) {
    testViolations.push(`${file}: skipped performance coverage`);
  }
}

const violations = [...presentationViolations, ...testViolations];
if (violations.length > 0) {
  console.error("Architecture or executable-test boundary violations found:");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  `Structure OK: ${required.length} landmarks and presentation/test boundaries verified.`
);
