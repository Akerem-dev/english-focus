import type { VocabularyEntry } from "@platform/domain";
import { vocabularyEntrySchema } from "@platform/schemas";

import rawPilotBatch1 from "./packs/pilot-core-v1.batch-1.json";
import rawPilotBatch2 from "./packs/pilot-core-v1.batch-2.json";
import rawPilotBatch3 from "./packs/pilot-core-v1.batch-3.json";
import rawPilotBatch4 from "./packs/pilot-core-v1.batch-4.json";

function parsePilotEntry(candidate: unknown, index: number): VocabularyEntry {
  const result = vocabularyEntrySchema.safeParse(candidate);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const path = firstIssue?.path.join(".") ?? "entry";
    const message = firstIssue?.message ?? "Unknown schema issue";

    throw new Error(`Pilot core entry ${index + 1} is invalid at '${path}': ${message}`);
  }

  return result.data;
}

const rawPilotEntries: readonly unknown[] = [
  ...rawPilotBatch1,
  ...rawPilotBatch2,
  ...rawPilotBatch3,
  ...rawPilotBatch4
];

/**
 * Versioned 99-entry pilot batch. The canonical reviewed `maintain` fixture is added separately,
 * producing the 100-entry V1 pilot catalog exposed by `coreVocabularyEntries`.
 */
export const pilotCoreVocabularyEntries: readonly VocabularyEntry[] = Object.freeze(
  rawPilotEntries.map(parsePilotEntry)
);
