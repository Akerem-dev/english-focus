import type { ActivityListResult, ActivityRecord, RecordActivityInput } from "../activity";

export interface ActivityRepository {
  listActivity(limit?: number): Promise<ActivityListResult>;
  recordActivity(input: RecordActivityInput): Promise<ActivityRecord>;
  clearActivity(): Promise<number>;
}
