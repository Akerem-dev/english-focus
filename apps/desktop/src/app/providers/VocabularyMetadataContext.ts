import { createContext } from "react";
import type { SaveVocabularyUserMetadataInput, VocabularyUserMetadata } from "@platform/domain";

export type VocabularyMetadataStatus = "loading" | "ready" | "saving" | "error";

export interface VocabularyMetadataContextValue {
  readonly metadata: readonly VocabularyUserMetadata[];
  readonly status: VocabularyMetadataStatus;
  readonly error?: string | undefined;
  readonly getMetadata: (normalizedWord: string) => VocabularyUserMetadata | undefined;
  readonly refresh: () => Promise<void>;
  readonly saveMetadata: (
    input: SaveVocabularyUserMetadataInput
  ) => Promise<VocabularyUserMetadata>;
  readonly recordView: (normalizedWord: string) => Promise<VocabularyUserMetadata | undefined>;
}

export const VocabularyMetadataContext = createContext<VocabularyMetadataContextValue | undefined>(
  undefined
);
