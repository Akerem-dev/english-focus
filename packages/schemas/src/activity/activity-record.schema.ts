import { z } from "zod";

import {
  activityKinds,
  activityScopes,
  type ActivityListResult,
  type ActivityRecord
} from "@platform/domain";

const nullableActivityTargetSchema = z
  .union([z.string().trim().min(1).max(160), z.null()])
  .optional();

export const activityRecordNativeCompatibilitySchema = z
  .object({
    id: z.string().trim().min(1).max(160),
    kind: z.enum(activityKinds),
    scope: z.enum(activityScopes),
    label: z.string().trim().min(1).max(160),
    target: nullableActivityTargetSchema,
    occurredAt: z.string().datetime({ offset: true })
  })
  .strict();

export const activityRecordSchema = activityRecordNativeCompatibilitySchema.transform((record) => ({
  ...record,
  target: record.target ?? undefined
}));

export function parseActivityRecordList(payload: unknown): ActivityListResult {
  const items = z.array(z.unknown()).max(250).parse(payload);
  const records: ActivityRecord[] = [];
  let skippedCount = 0;

  for (const item of items) {
    const parsed = activityRecordSchema.safeParse(item);

    if (parsed.success) {
      records.push(Object.freeze(parsed.data));
    } else {
      skippedCount += 1;
    }
  }

  return Object.freeze({
    records: Object.freeze(records),
    skippedCount
  });
}
