import { invoke } from "@tauri-apps/api/core";
import type {
  SaveVocabularyUserMetadataInput,
  VocabularyUserMetadata,
  VocabularyUserMetadataRepository
} from "@platform/domain";
import { vocabularyUserMetadataSchema } from "@platform/schemas";

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function parseMetadata(payload: unknown): VocabularyUserMetadata {
  return Object.freeze(vocabularyUserMetadataSchema.parse(payload));
}

export class TauriVocabularyUserMetadataRepository implements VocabularyUserMetadataRepository {
  async listMetadata(): Promise<readonly VocabularyUserMetadata[]> {
    if (!isTauriRuntime()) {
      return [];
    }

    const payloads = await invoke<readonly unknown[]>(
      "contract_list_vocabulary_user_metadata"
    );
    return Object.freeze(payloads.map(parseMetadata));
  }

  async getMetadataByNormalizedWord(
    normalizedWord: string
  ): Promise<VocabularyUserMetadata | undefined> {
    if (!isTauriRuntime()) {
      return undefined;
    }

    const payload = await invoke<unknown | null>("contract_get_vocabulary_user_metadata", {
      normalizedWord
    });
    return payload === null ? undefined : parseMetadata(payload);
  }

  async saveMetadata(input: SaveVocabularyUserMetadataInput): Promise<VocabularyUserMetadata> {
    if (!isTauriRuntime()) {
      throw new Error("Vocabulary metadata saving is available only in the desktop app.");
    }

    const payload = await invoke<unknown>("contract_save_vocabulary_user_metadata", {
      request: input
    });
    return parseMetadata(payload);
  }

  async recordView(normalizedWord: string, viewedAt: string): Promise<VocabularyUserMetadata> {
    if (!isTauriRuntime()) {
      const existing = await this.getMetadataByNormalizedWord(normalizedWord);
      const createdAt = existing?.createdAt ?? viewedAt;
      return parseMetadata({
        normalizedWord,
        favorite: existing?.favorite ?? false,
        tags: existing?.tags ?? [],
        note: existing?.note ?? "",
        learningStatus: existing?.learningStatus ?? "new",
        reviewStatus: existing?.reviewStatus ?? "reviewed",
        lastViewedAt: viewedAt,
        viewCount: (existing?.viewCount ?? 0) + 1,
        createdAt,
        updatedAt: viewedAt
      });
    }

    const payload = await invoke<unknown>("contract_record_vocabulary_view", {
      normalizedWord,
      viewedAt
    });
    return parseMetadata(payload);
  }
}
