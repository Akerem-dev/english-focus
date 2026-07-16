import { invoke } from "@tauri-apps/api/core";
import type {
  LocalDataRepository,
  LocalDataSnapshot,
  ResetLocalDataInput,
  ResetLocalDataResult
} from "@platform/domain";
import { localDataSnapshotSchema, resetLocalDataResultSchema } from "@platform/schemas";

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

const emptySnapshot: LocalDataSnapshot = Object.freeze({
  studyMetadataRecords: 0,
  userVocabularyEntries: 0,
  overrideVocabularyEntries: 0,
  settingsRecords: 0,
  activityRecords: 0,
  backupFiles: 0
});

export class TauriLocalDataRepository implements LocalDataRepository {
  async getSnapshot(): Promise<LocalDataSnapshot> {
    if (!isTauriRuntime()) {
      return emptySnapshot;
    }

    const payload = await invoke<unknown>("get_local_data_snapshot");
    return Object.freeze(localDataSnapshotSchema.parse(payload));
  }

  async resetLocalData(input: ResetLocalDataInput): Promise<ResetLocalDataResult> {
    if (!isTauriRuntime()) {
      throw new Error("Local data removal is available only in the English Focus desktop app.");
    }

    const payload = await invoke<unknown>("reset_local_data", { request: input });
    return Object.freeze(resetLocalDataResultSchema.parse(payload));
  }
}
