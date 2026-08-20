import { createContext } from "react";

import type { GrammarAnswerResult } from "../../infrastructure/grammar/TauriGrammarRepository";

export interface GrammarContextValue {
  readonly answerGrammarQuestion: (question: string) => Promise<GrammarAnswerResult>;
}

export const GrammarContext = createContext<GrammarContextValue | undefined>(undefined);
