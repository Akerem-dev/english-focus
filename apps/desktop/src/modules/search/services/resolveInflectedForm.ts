import type { VocabularyEntry } from "@platform/domain";

import { normalizeSearchQuery } from "./normalizeSearchQuery";

export interface ResolvedVocabularyForm {
  readonly entry: VocabularyEntry;
  readonly matchedForm: string;
}

export function resolveInflectedForm(
  entries: readonly VocabularyEntry[],
  normalizedQuery: string
): ResolvedVocabularyForm | undefined {
  for (const entry of entries) {
    for (const alias of entry.aliases) {
      const normalizedAlias = normalizeSearchQuery(alias);

      if (normalizedAlias.isValid && normalizedAlias.normalized === normalizedQuery) {
        return {
          entry,
          matchedForm: alias
        };
      }
    }
  }

  return undefined;
}
