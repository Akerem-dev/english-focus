import { createContext } from "react";

import type {
  SaveVocabularyEntryInput,
  StoredVocabularyEntry,
  VocabularyContentSource
} from "@platform/domain";

export type VocabularyRepositoryStatus = "loading" | "ready" | "error";

export interface VocabularyRepositoryContextValue {
  readonly contentSource: VocabularyContentSource;
  readonly storedEntries: readonly StoredVocabularyEntry[];
  readonly status: VocabularyRepositoryStatus;
  readonly error?: string | undefined;
  readonly refresh: () => Promise<void>;
  readonly saveEntry: (input: SaveVocabularyEntryInput) => Promise<StoredVocabularyEntry>;
}

export const VocabularyRepositoryContext = createContext<
  VocabularyRepositoryContextValue | undefined
>(undefined);
