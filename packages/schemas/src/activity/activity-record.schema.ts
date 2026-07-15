import { z } from "zod";

import { activityKinds, activityScopes } from "@platform/domain";

export const activityRecordSchema = z
  .object({
    id: z.string().trim().min(1).max(160),
    kind: z.enum(activityKinds),
    scope: z.enum(activityScopes),
    label: z.string().trim().min(1).max(160),
    target: z.string().trim().min(1).max(160).optional(),
    occurredAt: z.string().datetime({ offset: true })
  })
  .strict();

export const activityRecordListSchema = z.array(activityRecordSchema).max(250);
