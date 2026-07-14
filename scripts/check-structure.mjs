import { existsSync } from "node:fs";

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
  "packages/domain/src/vocabulary/VocabularyEntry.ts",
  "packages/domain/src/vocabulary/VocabularyUserMetadata.ts",
  "packages/schemas/src/vocabulary/vocabulary-entry.schema.ts",
  "packages/schemas/src/vocabulary/vocabulary-pack.schema.ts",
  "apps/desktop/src/infrastructure/database/migrations/0001_initial.sql",
  "apps/desktop/src/infrastructure/database/migrations/0002_fts.sql",
  "apps/desktop/src/infrastructure/database/migrations/0003_user_metadata.sql",
  "apps/desktop/src-tauri/src/commands/clipboard.rs",
  "apps/desktop/src-tauri/src/commands/filesystem.rs",
  "testing/e2e/missing-word-json-flow.spec.ts",
  "testing/performance/search-10000-entries.test.ts"
];
const missing = required.filter((path) => !existsSync(path));

if (missing.length > 0) {
  console.error("Missing final-skeleton landmarks:");
  for (const path of missing) console.error(`- ${path}`);
  process.exit(1);
}

console.log(`Structure OK: ${required.length} final-skeleton landmarks found.`);
