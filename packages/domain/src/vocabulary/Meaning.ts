import type { PartOfSpeech } from "./PartOfSpeech";
import type { Register } from "./Register";

export interface Meaning {
  id: string;
  partOfSpeech: PartOfSpeech;
  definitionEn: string;
  translationsTr: readonly string[];
  registers: readonly Register[];
  usageNoteEn?: string | undefined;
  usageNoteTr?: string | undefined;
}
