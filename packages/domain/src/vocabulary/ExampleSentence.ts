import type { Register } from "./Register";

export interface ExampleSentence {
  id: string;
  sentenceEn: string;
  translationTr: string;
  registers: readonly Register[];
  grammarLabel?: string | undefined;
  targetForm?: string | undefined;
  context?: string | undefined;
}
