import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { format, resolveConfig } from "prettier";

import {
  appSettingsSchema,
  vocabularyEntrySchema,
  vocabularyUserMetadataSchema
} from "@platform/schemas";
import { z } from "zod";

const root = resolve(import.meta.dirname, "..");
const prettierConfig = (await resolveConfig(resolve(root, "package.json"))) ?? {};
const checkOnly = process.argv.includes("--check");
const outputs = [
  {
    path: "apps/desktop/src-tauri/schemas/vocabulary-entry.schema.json",
    schema: vocabularyEntrySchema
  },
  {
    path: "apps/desktop/src-tauri/schemas/app-settings.schema.json",
    schema: appSettingsSchema
  },
  {
    path: "apps/desktop/src-tauri/schemas/vocabulary-user-metadata.schema.json",
    schema: vocabularyUserMetadataSchema
  }
] as const;

let failed = false;

for (const output of outputs) {
  const absolutePath = resolve(root, output.path);
  const jsonSchema = z.toJSONSchema(output.schema, {
    target: "draft-7"
  });
  const expected = await format(JSON.stringify(jsonSchema), {
    ...prettierConfig,
    filepath: absolutePath
  });

  if (checkOnly) {
    const actual = existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : undefined;
    if (actual !== expected) {
      console.error(`Native JSON Schema is stale or missing: ${output.path}`);
      failed = true;
    } else {
      console.log(`Native JSON Schema is current: ${output.path}`);
    }
    continue;
  }

  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, expected, "utf8");
  console.log(`Generated ${output.path}`);
}

if (failed) {
  console.error("Run npm run generate:native-schemas and commit the generated contracts.");
  process.exit(1);
}
