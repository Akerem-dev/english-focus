import { createContext } from "react";

import type { GrammarAnswerResult } from "../../infrastructure/grammar/TauriGrammarRepository";

export interface GrammarLessonFocus {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly compareWith?: string;
}

export interface GrammarContextValue {
  readonly answerGrammarQuestion: (question: string) => Promise<GrammarAnswerResult>;
  readonly lessonFocus: GrammarLessonFocus | undefined;
  readonly setLessonFocus: (focus: GrammarLessonFocus | undefined) => void;
}

export const GrammarContext = createContext<GrammarContextValue | undefined>(undefined);
