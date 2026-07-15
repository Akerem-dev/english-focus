import { createContext } from "react";
import type { ActivityRecord, RecordActivityInput } from "@platform/domain";

export type ActivityStatus = "loading" | "ready" | "recording" | "clearing" | "error";

export interface ActivityContextValue {
  readonly activity: readonly ActivityRecord[];
  readonly status: ActivityStatus;
  readonly error?: string | undefined;
  readonly refreshActivity: () => Promise<readonly ActivityRecord[]>;
  readonly recordActivity: (input: Omit<RecordActivityInput, "id" | "occurredAt">) => Promise<ActivityRecord>;
  readonly clearActivity: () => Promise<number>;
}

export const ActivityContext = createContext<ActivityContextValue | undefined>(undefined);
