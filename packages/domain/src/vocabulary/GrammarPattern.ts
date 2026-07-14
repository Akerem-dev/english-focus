export interface GrammarPatternExample {
  sentenceEn: string;
  translationTr: string;
}

export interface GrammarPattern {
  pattern: string;
  explanationEn: string;
  explanationTr: string;
  examples: readonly GrammarPatternExample[];
}
