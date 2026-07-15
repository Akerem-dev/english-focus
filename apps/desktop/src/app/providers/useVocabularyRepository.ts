import { useContext } from "react";

import { VocabularyRepositoryContext } from "./VocabularyRepositoryContext";

export function useVocabularyRepository() {
  const context = useContext(VocabularyRepositoryContext);

  if (context === undefined) {
    throw new Error("useVocabularyRepository must be used inside VocabularyRepositoryProvider.");
  }

  return context;
}
