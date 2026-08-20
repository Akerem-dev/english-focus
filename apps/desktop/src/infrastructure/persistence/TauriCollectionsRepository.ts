import { invoke } from "@tauri-apps/api/core";

interface PersistedCollection {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly tone: string;
  readonly coverPreset: string;
  readonly coverImage?: string | undefined;
  readonly wordIds: readonly string[];
}

interface CollectionsState {
  readonly version: 1;
  readonly collections: readonly PersistedCollection[];
}

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`Stored collection field '${field}' is invalid.`);
  }
  return value;
}

function parseCollection(payload: unknown): PersistedCollection {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Stored collection record is invalid.");
  }

  const record = payload as Record<string, unknown>;
  const wordIds = record.wordIds;
  if (!Array.isArray(wordIds) || wordIds.some((wordId) => typeof wordId !== "string")) {
    throw new Error("Stored collection word list is invalid.");
  }

  const coverImage = record.coverImage;
  if (coverImage !== undefined && typeof coverImage !== "string") {
    throw new Error("Stored collection cover image is invalid.");
  }

  return Object.freeze({
    id: requiredString(record.id, "id"),
    title: requiredString(record.title, "title"),
    description: requiredString(record.description, "description"),
    tone: requiredString(record.tone, "tone"),
    coverPreset: requiredString(record.coverPreset, "coverPreset"),
    ...(coverImage === undefined ? {} : { coverImage }),
    wordIds: Object.freeze([...wordIds])
  });
}

function parseCollectionsState(payload: unknown): CollectionsState {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Stored collections state is invalid.");
  }

  const record = payload as Record<string, unknown>;
  if (record.version !== 1 || !Array.isArray(record.collections)) {
    throw new Error("Stored collections state is not supported by this application build.");
  }

  return Object.freeze({
    version: 1,
    collections: Object.freeze(record.collections.map(parseCollection))
  });
}

export class TauriCollectionsRepository {
  async getState(): Promise<CollectionsState | undefined> {
    if (!isTauriRuntime()) {
      return undefined;
    }

    const payload = await invoke<unknown | null>("get_collections_state");
    return payload === null ? undefined : parseCollectionsState(payload);
  }

  async saveState(state: CollectionsState): Promise<CollectionsState> {
    const validated = parseCollectionsState(state);

    if (!isTauriRuntime()) {
      return validated;
    }

    const payload = await invoke<unknown>("save_collections_state", {
      collectionsState: validated
    });
    return parseCollectionsState(payload);
  }
}
