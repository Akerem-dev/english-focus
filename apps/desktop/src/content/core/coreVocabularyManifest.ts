import rawCoreVocabularyManifest from "./packs/pilot-core-v1.manifest.json";

export interface CoreVocabularyQualityPolicy {
  readonly structuralErrorsAllowed: number;
  readonly semanticErrorsAllowed: number;
  readonly maxWarningsPerPilotEntry: number;
  readonly allowedWarningCodes: readonly string[];
  readonly manualSampleWords: readonly string[];
}

export interface CoreVocabularyBatchManifest {
  readonly file: string;
  readonly entryCount: number;
  readonly sha256: string;
}

export interface CoreVocabularyManifest {
  readonly kind: "english-focus-core-content-manifest";
  readonly contentId: string;
  readonly contentVersion: string;
  readonly schemaVersion: string;
  readonly releasedAt: string;
  readonly status: "pilot-validated";
  readonly entryCount: number;
  readonly fixtureEntryCount: number;
  readonly pilotEntryCount: number;
  readonly maintainEntrySha256: string;
  readonly pilotBatches: readonly CoreVocabularyBatchManifest[];
  readonly cefrCounts: Readonly<Record<string, number>>;
  readonly partOfSpeechCounts: Readonly<Record<string, number>>;
  readonly qualityPolicy: CoreVocabularyQualityPolicy;
  readonly words: readonly string[];
}

export const coreVocabularyManifest = Object.freeze(
  rawCoreVocabularyManifest as CoreVocabularyManifest
);
