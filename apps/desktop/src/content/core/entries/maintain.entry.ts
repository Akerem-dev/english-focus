import { vocabularyEntrySchema } from "@platform/schemas";

import rawMaintainEntry from "./maintain.entry.json";

/** Canonical reviewed entry used by the first read-only vocabulary vertical slice. */
export const maintainVocabularyEntry = vocabularyEntrySchema.parse(rawMaintainEntry);
