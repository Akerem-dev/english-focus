import { useMemo } from "react";

import { useActivity, useVocabularyMetadata, useVocabularyRepository } from "../../../app/providers";
import {
  buildPracticeDeck,
  createPracticeSignals,
  summarizePracticeSignals,
  type PracticeFocus
} from "../application/practiceEngine";

export function usePracticeHomeModel(focus: PracticeFocus, durationMinutes: 5 | 10 | 15) {
  const { contentSource, status: vocabularyStatus } = useVocabularyRepository();
  const { metadata, status: metadataStatus } = useVocabularyMetadata();
  const { activity, status: activityStatus } = useActivity();

  const entries = useMemo(() => contentSource.listEntries(), [contentSource]);
  const signals = useMemo(
    () => createPracticeSignals(entries, metadata, activity),
    [activity, entries, metadata]
  );
  const stats = useMemo(() => summarizePracticeSignals(signals), [signals]);
  const deck = useMemo(
    () => buildPracticeDeck(signals, { focus, durationMinutes }),
    [durationMinutes, focus, signals]
  );

  return {
    deck,
    signals,
    stats,
    loading:
      vocabularyStatus === "loading" ||
      metadataStatus === "loading" ||
      activityStatus === "loading"
  };
}
