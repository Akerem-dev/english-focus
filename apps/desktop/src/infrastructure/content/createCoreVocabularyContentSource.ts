import { coreVocabularyEntries } from "../../content";
import { ValidatedVocabularyContentSource } from "./ValidatedVocabularyContentSource";

export function createCoreVocabularyContentSource(): ValidatedVocabularyContentSource {
  return new ValidatedVocabularyContentSource(coreVocabularyEntries);
}
