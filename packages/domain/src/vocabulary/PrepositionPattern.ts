import type { GrammarPatternExample } from "./GrammarPattern";

export interface PrepositionPattern {
  pattern: string;
  preposition: string;
  explanationEn: string;
  explanationTr: string;
  examples: readonly GrammarPatternExample[];
}
