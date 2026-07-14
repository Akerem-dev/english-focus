import type { GrammarPatternExample } from "./GrammarPattern";
import type { Register } from "./Register";

export interface PhrasalVerb {
  phrase: string;
  meaningEn: string;
  translationTr: string;
  separable: boolean | null;
  registers: readonly Register[];
  examples: readonly GrammarPatternExample[];
}
