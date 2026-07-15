import { invoke } from "@tauri-apps/api/core";
import type {
  SaveVocabularyEntryInput,
  StoredVocabularyEntry,
  VocabularyRepository,
  VocabularyStorageLayer
} from "@platform/domain";
import { vocabularyEntrySchema } from "@platform/schemas";

interface StoredVocabularyEntryPayload {
  readonly entry: unknown;
  readonly layer: VocabularyStorageLayer;
}

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function parseStoredEntry(payload: StoredVocabularyEntryPayload): StoredVocabularyEntry {
  return Object.freeze({
    entry: vocabularyEntrySchema.parse(payload.entry),
    layer: payload.layer
  });
}

export class TauriVocabularyRepository implements VocabularyRepository {
  async listEntries(): Promise<readonly StoredVocabularyEntry[]> {
    if (!isTauriRuntime()) {
      return [];
    }

    const payloads =
      await invoke<readonly StoredVocabularyEntryPayload[]>("list_vocabulary_entries");
    return Object.freeze(payloads.map(parseStoredEntry));
  }

  async getEntryByNormalizedWord(
    normalizedWord: string
  ): Promise<StoredVocabularyEntry | undefined> {
    if (!isTauriRuntime()) {
      return undefined;
    }

    const payload = await invoke<StoredVocabularyEntryPayload | null>(
      "get_vocabulary_entry_by_normalized_word",
      { normalizedWord }
    );

    return payload === null ? undefined : parseStoredEntry(payload);
  }

  async saveEntry(input: SaveVocabularyEntryInput): Promise<StoredVocabularyEntry> {
    if (!isTauriRuntime()) {
      throw new Error("Local SQLite saving is available only in the English Focus desktop app.");
    }

    const payload = await invoke<StoredVocabularyEntryPayload>("save_vocabulary_entry", {
      request: input
    });
    return parseStoredEntry(payload);
  }
}
