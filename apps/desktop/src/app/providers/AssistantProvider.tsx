import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import type { InstructionPreferences } from "@platform/domain";

import {
  ASSISTANT_MODEL,
  TauriAssistantRepository,
  type AssistantConnectionStatus,
  type AssistantPreparationStrategy
} from "../../infrastructure/assistant/TauriAssistantRepository";
import { AssistantContext, type AssistantConnectionLoadStatus } from "./AssistantContext";

const INITIAL_CONNECTION: AssistantConnectionStatus = Object.freeze({
  runtime: "browser",
  configured: false,
  model: ASSISTANT_MODEL
});

function messageFromError(cause: unknown): string {
  if (cause instanceof Error) {
    return cause.message;
  }

  return typeof cause === "string" ? cause : "The word helper connection could not be checked.";
}

export function AssistantProvider({ children }: PropsWithChildren) {
  const repository = useMemo(() => new TauriAssistantRepository(), []);
  const [connection, setConnection] = useState<AssistantConnectionStatus>(INITIAL_CONNECTION);
  const [status, setStatus] = useState<AssistantConnectionLoadStatus>("loading");
  const [error, setError] = useState<string | undefined>();

  const refreshConnection = useCallback(async () => {
    setStatus("loading");
    setError(undefined);

    try {
      setConnection(await repository.getStatus());
      setStatus("ready");
    } catch (cause) {
      setError(messageFromError(cause));
      setStatus("error");
    }
  }, [repository]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void refreshConnection();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [refreshConnection]);

  const saveApiKey = useCallback(
    async (apiKey: string) => {
      setError(undefined);
      setConnection(await repository.saveApiKey(apiKey));
      setStatus("ready");
    },
    [repository]
  );

  const clearApiKey = useCallback(async () => {
    setError(undefined);
    setConnection(await repository.clearApiKey());
    setStatus("ready");
  }, [repository]);

  const prepareWord = useCallback(
    (word: string, preferences: InstructionPreferences, strategy?: AssistantPreparationStrategy) =>
      repository.prepareWord(word, preferences, strategy),
    [repository]
  );

  const value = useMemo(
    () => ({
      connection,
      status,
      error,
      refreshConnection,
      saveApiKey,
      clearApiKey,
      prepareWord
    }),
    [clearApiKey, connection, error, prepareWord, refreshConnection, saveApiKey, status]
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}
