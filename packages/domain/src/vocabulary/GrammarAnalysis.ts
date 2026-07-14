import type { GrammarPattern } from "./GrammarPattern";
import type { PrepositionPattern } from "./PrepositionPattern";
import type { SentenceFormExample } from "./SentenceFormExample";
import type { TenseExample } from "./TenseExample";

/**
 * Only naturally applicable grammar structures belong here.
 * Empty arrays are valid and preferred over fabricated examples.
 */
export interface GrammarAnalysis {
  summaryEn: string;
  summaryTr: string;
  patterns: readonly GrammarPattern[];
  tenseExamples: readonly TenseExample[];
  sentenceForms: readonly SentenceFormExample[];
  prepositionPatterns: readonly PrepositionPattern[];
}
