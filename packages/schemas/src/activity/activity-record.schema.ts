import { z } from "zod";

import { activityKinds, activityScopes } from "@platform/domain";

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

export const activityRecordListSchema = z.array(activityRecordSchema).max(250);
