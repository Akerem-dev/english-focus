import { vocabularyEntryInputSchema } from "@platform/schemas";

import rawMaintainEntry from "./maintain.entry.json";

/** Canonical reviewed entry normalized from the bundled compatibility fixture. */
export const maintainVocabularyEntry = vocabularyEntryInputSchema.parse(rawMaintainEntry);
