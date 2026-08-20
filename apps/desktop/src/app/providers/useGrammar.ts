import { useContext } from "react";

import { GrammarContext, type GrammarContextValue } from "./GrammarContext";

export function useGrammar(): GrammarContextValue {
  const value = useContext(GrammarContext);
  if (value === undefined) {
    throw new Error("useGrammar must be used inside GrammarProvider.");
  }
  return value;
}
