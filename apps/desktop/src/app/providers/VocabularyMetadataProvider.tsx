import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import type { SaveVocabularyUserMetadataInput, VocabularyUserMetadata } from "@platform/domain";

import { TauriVocabularyUserMetadataRepository } from "../../infrastructure/persistence";
import { publishActivity } from "../../modules/history";
import {
  VocabularyMetadataContext,
  type VocabularyMetadataStatus
} from "./VocabularyMetadataContext";

function sameTags(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((tag, index) => tag === right[index]);
}

function isFavoriteOnlyChange(
  previous: VocabularyUserMetadata | undefined,
  saved: VocabularyUserMetadata
): boolean {
  return (
    previous !== undefined &&
    previous.favorite !== saved.favorite &&
    sameTags(previous.tags, saved.tags) &&
    previous.note === saved.note &&
    previous.learningStatus === saved.learningStatus &&
    previous.reviewStatus === saved.reviewStatus &&
    previous.lastViewedAt === saved.lastViewedAt &&
    previous.viewCount === saved.viewCount &&
    previous.createdAt === saved.createdAt
  );
}

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
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [refresh]);

  const getMetadata = useCallback(
    (normalizedWord: string) => metadata.find((record) => record.normalizedWord === normalizedWord),
    [metadata]
  );

  const saveMetadata = useCallback(
    async (input: SaveVocabularyUserMetadataInput) => {
      setStatus("saving");
      setError(undefined);

      try {
        const previous = metadata.find((record) => record.normalizedWord === input.normalizedWord);
        const saved = await repository.saveMetadata(input);
        setMetadata((current) =>
          Object.freeze([
            saved,
            ...current.filter((record) => record.normalizedWord !== saved.normalizedWord)
          ])
        );
        setStatus("ready");

        if (isFavoriteOnlyChange(previous, saved)) {
          publishActivity({
            kind: "favorite-changed",
            scope: "vocabulary",
            label: saved.favorite ? "Added to favorites" : "Removed from favorites",
            target: saved.normalizedWord
          });
        } else {
          publishActivity({
            kind: "study-details-saved",
            scope: "vocabulary",
            label: "Personal details saved",
            target: saved.normalizedWord
          });
        }

        return saved;
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : "Vocabulary metadata could not be saved.";
        setError(message);
        setStatus("error");
        throw cause;
      }
    },
    [metadata, repository]
  );

  const recordView = useCallback(
    async (normalizedWord: string) => {
      try {
        const saved = await repository.recordView(normalizedWord, new Date().toISOString());
        publishActivity({
          kind: "vocabulary-viewed",
          scope: "vocabulary",
          label: "Viewed vocabulary entry",
          target: normalizedWord
        });
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
