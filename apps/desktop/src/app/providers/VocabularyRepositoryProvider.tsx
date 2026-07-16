import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import type { SaveVocabularyEntryInput, StoredVocabularyEntry } from "@platform/domain";

import {
  createCoreVocabularyContentSource,
  LayeredVocabularyContentSource
} from "../../infrastructure/content";
import { TauriVocabularyRepository } from "../../infrastructure/persistence";
import {
  VocabularyRepositoryContext,
  type VocabularyRepositoryStatus
} from "./VocabularyRepositoryContext";

export function VocabularyRepositoryProvider({ children }: PropsWithChildren) {
  const repository = useMemo(() => new TauriVocabularyRepository(), []);
  const coreSource = useMemo(() => createCoreVocabularyContentSource(), []);
  const [storedEntries, setStoredEntries] = useState<readonly StoredVocabularyEntry[]>([]);
  const [status, setStatus] = useState<VocabularyRepositoryStatus>("ready");
  const [error, setError] = useState<string | undefined>();

  const refresh = useCallback(async () => {
    setStatus("loading");
    setError(undefined);

    try {
      setStoredEntries(await repository.listEntries());
      setStatus("ready");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Local vocabulary could not be loaded.");
      setStatus("error");
    }
  }, [repository]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [refresh]);

  const saveEntry = useCallback(
    async (input: SaveVocabularyEntryInput) => {
      const saved = await repository.saveEntry(input);
      setStoredEntries((current) =>
        Object.freeze([
          saved,
          ...current.filter((record) => record.entry.normalizedWord !== saved.entry.normalizedWord)
        ])
      );
      setStatus("ready");
      setError(undefined);
      return saved;
    },
    [repository]
  );

  const saveEntries = useCallback(
    async (inputs: readonly SaveVocabularyEntryInput[]) => {
      const saved = await repository.saveEntries(inputs);
      const savedWords = new Set(saved.map((record) => record.entry.normalizedWord));
      setStoredEntries((current) =>
        Object.freeze([
          ...saved,
          ...current.filter((record) => !savedWords.has(record.entry.normalizedWord))
        ])
      );
      setStatus("ready");
      setError(undefined);
      return saved;
    },
    [repository]
  );

  const contentSource = useMemo(
    () => new LayeredVocabularyContentSource(coreSource, storedEntries),
    [coreSource, storedEntries]
  );
  const value = useMemo(
    () => ({ contentSource, storedEntries, status, error, refresh, saveEntry, saveEntries }),
    [contentSource, storedEntries, status, error, refresh, saveEntries, saveEntry]
  );

  return (
    <VocabularyRepositoryContext.Provider value={value}>
      {children}
    </VocabularyRepositoryContext.Provider>
  );
}
