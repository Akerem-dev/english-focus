import { useContext } from "react";

import { VocabularyMetadataContext } from "./VocabularyMetadataContext";

export function useVocabularyMetadata() {
  const context = useContext(VocabularyMetadataContext);

  if (context === undefined) {
    throw new Error("useVocabularyMetadata must be used inside VocabularyMetadataProvider.");
  }

  return context;
}
