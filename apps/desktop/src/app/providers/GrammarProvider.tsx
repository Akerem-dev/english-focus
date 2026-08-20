import { useMemo, type PropsWithChildren } from "react";

import { TauriGrammarRepository } from "../../infrastructure/grammar/TauriGrammarRepository";
import { GrammarContext, type GrammarContextValue } from "./GrammarContext";

export function GrammarProvider({ children }: PropsWithChildren) {
  const value = useMemo<GrammarContextValue>(() => {
    const repository = new TauriGrammarRepository();
    return Object.freeze({
      answerGrammarQuestion: (question: string) => repository.answerQuestion(question)
    });
  }, []);

  return <GrammarContext.Provider value={value}>{children}</GrammarContext.Provider>;
}
