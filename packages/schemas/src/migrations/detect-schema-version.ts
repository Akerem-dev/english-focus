import type { SupportedVocabularySchemaVersion } from "./schema-version";
import { SUPPORTED_VOCABULARY_SCHEMA_VERSIONS } from "./schema-version";

export function detectSchemaVersion(input: unknown): SupportedVocabularySchemaVersion | null {
  if (typeof input !== "object" || input === null || !("schemaVersion" in input)) {
    return null;
  }

  const schemaVersion = input.schemaVersion;
  return SUPPORTED_VOCABULARY_SCHEMA_VERSIONS.find((version) => version === schemaVersion) ?? null;
}
