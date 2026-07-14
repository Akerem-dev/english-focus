import type { GrammarPatternExample } from "./GrammarPattern";
import type { Register } from "./Register";

export interface Idiom {
  phrase: string;
  meaningEn: string;
  translationTr: string;
  registers: readonly Register[];
  examples: readonly GrammarPatternExample[];
}
