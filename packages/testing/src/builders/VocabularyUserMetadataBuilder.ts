import type { VocabularyUserMetadata } from "@platform/domain";

const DEFAULT_TIMESTAMP = "2026-01-01T00:00:00.000Z";

function createDefaultMetadata(): VocabularyUserMetadata {
  return {
    normalizedWord: "maintain",
    favorite: false,
    tags: [],
    note: "",
    learningStatus: "new",
    reviewStatus: "imported",
    viewCount: 0,
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP
  };
}

/** Builder for user-owned state kept separate from replaceable vocabulary content. */
export class VocabularyUserMetadataBuilder {
  private metadata: VocabularyUserMetadata;

  constructor(seed: VocabularyUserMetadata = createDefaultMetadata()) {
    this.metadata = structuredClone(seed);
  }

  with(overrides: Partial<VocabularyUserMetadata>): this {
    this.metadata = {
      ...this.metadata,
      ...structuredClone(overrides)
    };
    return this;
  }

  build(): VocabularyUserMetadata {
    return structuredClone(this.metadata);
  }
}

export function createVocabularyUserMetadataBuilder(
  seed?: VocabularyUserMetadata
): VocabularyUserMetadataBuilder {
  return seed === undefined
    ? new VocabularyUserMetadataBuilder()
    : new VocabularyUserMetadataBuilder(seed);
}
