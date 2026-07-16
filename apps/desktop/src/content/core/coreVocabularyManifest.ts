import rawCoreVocabularyManifest from "./packs/pilot-core-v1.manifest.json";

interface CoreVocabularyQualityPolicy {
  readonly structuralErrorsAllowed: number;
  readonly semanticErrorsAllowed: number;
  readonly maxWarningsPerPilotEntry: number;
  readonly allowedWarningCodes: readonly string[];
  readonly manualSampleWords: readonly string[];
}

export interface CoreVocabularyManifest {
  readonly kind: "english-focus-core-content-manifest";
  readonly contentId: string;
  readonly contentVersion: string;
  readonly schemaVersion: string;
  readonly releasedAt: string;
  readonly status: "editorial-reviewed";
  readonly entryCount: number;
  readonly reviewedEntryCount: number;
  readonly maintainEntrySha256: string;
  readonly cefrCounts: Readonly<Record<string, number>>;
  readonly partOfSpeechCounts: Readonly<Record<string, number>>;
  readonly qualityPolicy: CoreVocabularyQualityPolicy;
  readonly words: readonly string[];
}

export const coreVocabularyManifest = Object.freeze(
  rawCoreVocabularyManifest as CoreVocabularyManifest
);
