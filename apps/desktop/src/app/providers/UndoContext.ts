import { createContext } from "react";

import type { UndoableActionOptions } from "../../modules/undo";

export interface UndoContextValue {
  readonly runUndoableAction: <TResult>(
    options: UndoableActionOptions<TResult>
  ) => Promise<TResult>;
}

export const UndoContext = createContext<UndoContextValue | undefined>(undefined);
