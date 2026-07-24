import { invoke } from "@tauri-apps/api/core";
import type {
  SaveVocabularyEntryInput,
  StoredVocabularyEntry,
  VocabularyRepository,
  VocabularyStorageLayer
} from "@platform/domain";
import { vocabularyEntryInputSchema } from "@platform/schemas";

interface StoredVocabularyEntryPayload {
  readonly entry: unknown;
  readonly layer: unknown;
}

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function isStoredVocabularyEntryPayload(value: unknown): value is StoredVocabularyEntryPayload {
  return typeof value === "object" && value !== null && "entry" in value && "layer" in value;
}

function parseStorageLayer(layer: unknown): VocabularyStorageLayer {
  if (layer === "user" || layer === "override") {
    return layer;
  }

  throw new Error("Stored vocabulary layer is not supported by this application build.");
}

function parseStoredVocabularyEntry(payload: unknown): StoredVocabularyEntry {
  if (!isStoredVocabularyEntryPayload(payload)) {
    throw new Error("Stored vocabulary record is incomplete.");
  }

  return Object.freeze({
    entry: vocabularyEntryInputSchema.parse(payload.entry),
    layer: parseStorageLayer(payload.layer)
  });
}

export function parseStoredVocabularyEntryList(payload: unknown): readonly StoredVocabularyEntry[] {
  if (!Array.isArray(payload)) {
    throw new Error("Stored vocabulary list response is invalid.");
  }

  return Object.freeze(
    payload.flatMap((record) => {
      try {
        return [parseStoredVocabularyEntry(record)];
      } catch {
        return [];
      }
    })
  );
}

export class TauriVocabularyRepository implements VocabularyRepository {
  async listEntries(): Promise<readonly StoredVocabularyEntry[]> {
    if (!isTauriRuntime()) {
      return [];
    }

    const payload = await invoke<unknown>("contract_list_resilient_vocabulary_entries");
    return parseStoredVocabularyEntryList(payload);
  }

  async getEntryByNormalizedWord(
    normalizedWord: string
  ): Promise<StoredVocabularyEntry | undefined> {
    if (!isTauriRuntime()) {
      return undefined;
    }

    const payload = await invoke<unknown>("contract_get_vocabulary_entry_by_normalized_word", {
      normalizedWord
    });

    return payload === null ? undefined : parseStoredVocabularyEntry(payload);
  }

  async saveEntry(input: SaveVocabularyEntryInput): Promise<StoredVocabularyEntry> {
    if (!isTauriRuntime()) {
      throw new Error("Local SQLite saving is available only in the English Focus desktop app.");
    }

    const payload = await invoke<unknown>("contract_save_vocabulary_entry", {
      request: input
    });
    return parseStoredVocabularyEntry(payload);
  }

  async saveEntries(
    inputs: readonly SaveVocabularyEntryInput[]
  ): Promise<readonly StoredVocabularyEntry[]> {
    if (!isTauriRuntime()) {
      throw new Error("Local SQLite saving is available only in the English Focus desktop app.");
    }

    const payloads = await invoke<readonly unknown[]>("contract_save_vocabulary_entries", {
      requests: inputs
    });
    return Object.freeze(payloads.map(parseStoredVocabularyEntry));
  }
}
