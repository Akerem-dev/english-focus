import { invoke } from "@tauri-apps/api/core";
import type {
  ActivityListResult,
  ActivityRecord,
  ActivityRepository,
  RecordActivityInput
} from "@platform/domain";
import { activityRecordSchema, parseActivityRecordList } from "@platform/schemas";

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export class TauriActivityRepository implements ActivityRepository {
  async listActivity(limit = 100): Promise<ActivityListResult> {
    if (!isTauriRuntime()) {
      return Object.freeze({ records: Object.freeze([]), skippedCount: 0 });
    }

    const payload = await invoke<unknown>("list_activity", { limit });
    return parseActivityRecordList(payload);
  }

  async recordActivity(input: RecordActivityInput): Promise<ActivityRecord> {
    const parsed = activityRecordSchema.parse(input);

    if (!isTauriRuntime()) {
      return Object.freeze(parsed);
    }

    const payload = await invoke<unknown>("record_activity", { request: parsed });
    return Object.freeze(activityRecordSchema.parse(payload));
  }

  async clearActivity(): Promise<number> {
    if (!isTauriRuntime()) {
      return 0;
    }

    return invoke<number>("clear_activity");
  }
}
