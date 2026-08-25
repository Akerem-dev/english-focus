import { useMemo, useState, type PropsWithChildren } from "react";

import { TauriGrammarRepository } from "../../infrastructure/grammar/TauriGrammarRepository";
import {
  GrammarContext,
  type GrammarContextValue,
  type GrammarLessonFocus
} from "./GrammarContext";

export function GrammarProvider({ children }: PropsWithChildren) {
  const [lessonFocus, setLessonFocus] = useState<GrammarLessonFocus | undefined>();
  const repository = useMemo(() => new TauriGrammarRepository(), []);

  const value = useMemo<GrammarContextValue>(
    () =>
      Object.freeze({
        answerGrammarQuestion: (question: string) => repository.answerQuestion(question),
        lessonFocus,
        setLessonFocus
      }),
    [lessonFocus, repository]
  );

  return <GrammarContext.Provider value={value}>{children}</GrammarContext.Provider>;
}
