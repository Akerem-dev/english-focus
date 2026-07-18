import type { CefrLevel } from "./CefrLevel";
import type { Etymology } from "./Etymology";
import type { ExampleSentence } from "./ExampleSentence";
import type { GenerationMetadata } from "./GenerationMetadata";
import type { GrammarAnalysis } from "./GrammarAnalysis";
import type { Meaning } from "./Meaning";
import type { Morphology } from "./Morphology";
import type { PartOfSpeech } from "./PartOfSpeech";
import type { Pronunciation } from "./Pronunciation";
import type { Register } from "./Register";
import type { VocabularyEntrySource } from "./VocabularyEntrySource";
import type { VocabularySchemaVersion } from "./VocabularySchemaVersion";

/** Immutable simplified content record. User-owned notes and favorite state live separately. */
export interface VocabularyEntry {
  schemaVersion: VocabularySchemaVersion;
  id: string;
  word: string;
  normalizedWord: string;
  aliases: readonly string[];
  pronunciations: readonly Pronunciation[];
  cefr: CefrLevel;
  registers: readonly Register[];
  partsOfSpeech: readonly PartOfSpeech[];
  meanings: readonly Meaning[];
  morphology: Morphology;
  etymology?: Etymology | undefined;
  grammar: GrammarAnalysis;
  examples: readonly ExampleSentence[];
  source: VocabularyEntrySource;
  generation: GenerationMetadata;
  createdAt: string;
  updatedAt: string;
}
