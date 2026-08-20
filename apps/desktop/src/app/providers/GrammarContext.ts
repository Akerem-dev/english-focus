import { createContext } from "react";

import type { GrammarLocalAnswer } from "../../infrastructure/grammar/TauriGrammarRepository";

export interface GrammarContextValue {
  readonly answerLocalGrammar: (question: string) => Promise<GrammarLocalAnswer | undefined>;
}

export const GrammarContext = createContext<GrammarContextValue | undefined>(undefined);
