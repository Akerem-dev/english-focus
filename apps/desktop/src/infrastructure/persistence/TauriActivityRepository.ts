import { invoke } from "@tauri-apps/api/core";
import type {
  ActivityListResult,
  ActivityRecord,
  ActivityRepository,
  RecordActivityInput
} from "@platform/domain";
import {
  activityRecordSchema,
  parseActivityRecordList as parseActivityRecordListResult
} from "@platform/schemas";

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function parseActivityListResult(payload: unknown): ActivityListResult {
  if (!Array.isArray(payload)) {
    throw new Error("Recent activity list response is invalid.");
  }

  return parseActivityRecordListResult(payload);
}

export function parseActivityRecordList(payload: unknown): readonly ActivityRecord[] {
  return parseActivityListResult(payload).records;
}

export class TauriActivityRepository implements ActivityRepository {
  async listActivity(limit = 100): Promise<ActivityListResult> {
    if (!isTauriRuntime()) {
      return Object.freeze({
        records: Object.freeze([]),
        skippedCount: 0
      });
    }

    const payload = await invoke<unknown>("list_resilient_activity", { limit });
    return parseActivityListResult(payload);
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
