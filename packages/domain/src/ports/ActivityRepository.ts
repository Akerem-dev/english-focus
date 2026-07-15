import type { ActivityRecord, RecordActivityInput } from "../activity";

export interface ActivityRepository {
  listActivity(limit?: number): Promise<readonly ActivityRecord[]>;
  recordActivity(input: RecordActivityInput): Promise<ActivityRecord>;
  clearActivity(): Promise<number>;
}
