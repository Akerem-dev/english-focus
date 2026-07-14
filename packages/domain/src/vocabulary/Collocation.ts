import type { Register } from "./Register";

export interface Collocation {
  phrase: string;
  translationTr: string;
  registers: readonly Register[];
  explanationEn?: string | undefined;
  explanationTr?: string | undefined;
  exampleEn?: string | undefined;
  exampleTr?: string | undefined;
}
