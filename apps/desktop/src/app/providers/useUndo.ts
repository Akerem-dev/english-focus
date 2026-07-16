import { useContext } from "react";

import { UndoContext, type UndoContextValue } from "./UndoContext";

const OPTIONAL_UNDO_FALLBACK: UndoContextValue = Object.freeze({
  runUndoableAction: async <TResult>(options: {
    readonly perform: () => TResult | Promise<TResult>;
  }) => options.perform()
});

/**
 * Returns undo orchestration inside the full application and safely executes the original action in
 * isolated component tests where the provider is intentionally absent.
 */
export function useUndo() {
  return useContext(UndoContext) ?? OPTIONAL_UNDO_FALLBACK;
}
