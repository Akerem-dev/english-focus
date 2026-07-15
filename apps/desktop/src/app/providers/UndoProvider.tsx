import { useCallback, useMemo, type PropsWithChildren } from "react";

import { mapErrorToUserMessage } from "../errors";
import type { UndoableActionOptions } from "../../modules/undo";
import { UndoContext, type UndoContextValue } from "./UndoContext";
import { useToast } from "./useToast";

export function UndoProvider({ children }: PropsWithChildren) {
  const { showToast } = useToast();

  const runUndoableAction = useCallback(
    async <TResult,>(options: UndoableActionOptions<TResult>): Promise<TResult> => {
      try {
        const result = await options.perform();

        showToast({
          title: options.successTitle,
          ...(options.successMessage === undefined ? {} : { message: options.successMessage }),
          tone: "success",
          durationMs: 8_000,
          action: {
            label: "Undo",
            onAction: async () => {
              try {
                await options.undo();
                showToast({
                  title: options.undoSuccessTitle ?? "Change undone",
                  ...(options.undoSuccessMessage === undefined
                    ? {}
                    : { message: options.undoSuccessMessage }),
                  tone: "info",
                  dedupeKey: "undo-result"
                });
              } catch (cause) {
                const failure = mapErrorToUserMessage(
                  cause,
                  options.undoFailureTitle ?? "The change could not be undone."
                );
                showToast({
                  title: failure.title,
                  message: failure.message,
                  tone: "error",
                  durationMs: 8_000,
                  dedupeKey: "undo-result"
                });
              }
            }
          }
        });

        return result;
      } catch (cause) {
        const failure = mapErrorToUserMessage(
          cause,
          options.failureTitle ?? "The action could not be completed."
        );
        showToast({
          title: failure.title,
          message: failure.message,
          tone: "error",
          durationMs: 8_000
        });
        throw cause;
      }
    },
    [showToast]
  );

  const value = useMemo<UndoContextValue>(() => ({ runUndoableAction }), [runUndoableAction]);

  return <UndoContext.Provider value={value}>{children}</UndoContext.Provider>;
}
