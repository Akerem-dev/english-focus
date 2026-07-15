import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import type {
  SaveVocabularyUserMetadataInput,
  VocabularyUserMetadata
} from "@platform/domain";

import { TauriVocabularyUserMetadataRepository } from "../../infrastructure/persistence";
import {
  VocabularyMetadataContext,
  type VocabularyMetadataStatus
} from "./VocabularyMetadataContext";

export function VocabularyMetadataProvider({ children }: PropsWithChildren) {
  const repository = useMemo(() => new TauriVocabularyUserMetadataRepository(), []);
  const [metadata, setMetadata] = useState<readonly VocabularyUserMetadata[]>([]);
  const [status, setStatus] = useState<VocabularyMetadataStatus>("ready");
  const [error, setError] = useState<string | undefined>();

  const refresh = useCallback(async () => {
    setStatus("loading");
    setError(undefined);

    try {
      setMetadata(await repository.listMetadata());
      setStatus("ready");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Vocabulary metadata could not be loaded.");
      setStatus("error");
    }
  }, [repository]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const getMetadata = useCallback(
    (normalizedWord: string) =>
      metadata.find((record) => record.normalizedWord === normalizedWord),
    [metadata]
  );

  const saveMetadata = useCallback(
    async (input: SaveVocabularyUserMetadataInput) => {
      setStatus("saving");
      setError(undefined);

      try {
        const saved = await repository.saveMetadata(input);
        setMetadata((current) =>
          Object.freeze([
            saved,
            ...current.filter((record) => record.normalizedWord !== saved.normalizedWord)
          ])
        );
        setStatus("ready");
        return saved;
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : "Vocabulary metadata could not be saved.";
        setError(message);
        setStatus("error");
        throw cause;
      }
    },
    [repository]
  );

  const recordView = useCallback(
    async (normalizedWord: string) => {
      try {
        const saved = await repository.recordView(normalizedWord, new Date().toISOString());
        setMetadata((current) =>
          Object.freeze([
            saved,
            ...current.filter((record) => record.normalizedWord !== saved.normalizedWord)
          ])
        );
        return saved;
      } catch {
        return undefined;
      }
    },
    [repository]
  );

  const value = useMemo(
    () => ({ metadata, status, error, getMetadata, refresh, saveMetadata, recordView }),
    [error, getMetadata, metadata, recordView, refresh, saveMetadata, status]
  );

  return (
    <VocabularyMetadataContext.Provider value={value}>
      {children}
    </VocabularyMetadataContext.Provider>
  );
}
