import type { CefrLevel } from "./CefrLevel";
import type { Collocation } from "./Collocation";
import type { CommonMistake } from "./CommonMistake";
import type { Etymology } from "./Etymology";
import type { ExampleSentence } from "./ExampleSentence";
import type { GenerationMetadata } from "./GenerationMetadata";
import type { GrammarAnalysis } from "./GrammarAnalysis";
import type { Idiom } from "./Idiom";
import type { Meaning } from "./Meaning";
import type { Morphology } from "./Morphology";
import type { PartOfSpeech } from "./PartOfSpeech";
import type { PhrasalVerb } from "./PhrasalVerb";
import type { Pronunciation } from "./Pronunciation";
import type { Register } from "./Register";
import type { RelatedWord } from "./RelatedWord";
import type { VocabularyEntrySource } from "./VocabularyEntrySource";
import type { VocabularySchemaVersion } from "./VocabularySchemaVersion";
import type { WordFamilyItem } from "./WordFamilyItem";

/** Immutable content record. User-owned notes and learning state live separately. */
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
  wordFamily: readonly WordFamilyItem[];
  etymology?: Etymology | undefined;
  grammar: GrammarAnalysis;
  collocations: readonly Collocation[];
  phrasalVerbs: readonly PhrasalVerb[];
  idioms: readonly Idiom[];
  relatedWords: readonly RelatedWord[];
  commonMistakes: readonly CommonMistake[];
  examples: readonly ExampleSentence[];
  source: VocabularyEntrySource;
  generation: GenerationMetadata;
  createdAt: string;
  updatedAt: string;
}
