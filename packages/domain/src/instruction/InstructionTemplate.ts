import type { VocabularySchemaVersion } from "../vocabulary/VocabularySchemaVersion";
import type { InstructionPreferences } from "./InstructionPreferences";

export const VOCABULARY_INSTRUCTION_TEMPLATE_VERSION = "1.0.0" as const;

export interface InstructionTemplate {
  readonly templateId: "english-focus-vocabulary-entry";
  readonly templateVersion: typeof VOCABULARY_INSTRUCTION_TEMPLATE_VERSION;
  readonly targetWord: string;
  readonly vocabularySchemaVersion: VocabularySchemaVersion;
  readonly preferences: InstructionPreferences;
  readonly text: string;
}
