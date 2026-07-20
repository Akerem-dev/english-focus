import { z } from "zod";

import {
  activityKinds,
  activityScopes,
  type ActivityListResult,
  type ActivityRecord
} from "@platform/domain";

const activityTargetSchema = z.preprocess(
  (value) => (value === null ? undefined : value),
  z.string().trim().min(1).max(160).optional()
);

export const activityRecordSchema = z
  .object({
    id: z.string().trim().min(1).max(160),
    kind: z.enum(activityKinds),
    scope: z.enum(activityScopes),
    label: z.string().trim().min(1).max(160),
    target: activityTargetSchema,
    occurredAt: z.string().datetime({ offset: true })
  })
  .strict();

export const activityRecordListSchema = z.array(activityRecordSchema).max(250);

export function parseActivityRecordList(payload: unknown): ActivityListResult {
  const items = z.array(z.unknown()).max(250).parse(payload);
  const records: ActivityRecord[] = [];
  let skippedCount = 0;

  for (const item of items) {
    const parsed = activityRecordSchema.safeParse(item);

    if (parsed.success) {
      records.push(parsed.data);
    } else {
      skippedCount += 1;
    }
  }

  return Object.freeze({
    records: Object.freeze(records),
    skippedCount
  });
}
