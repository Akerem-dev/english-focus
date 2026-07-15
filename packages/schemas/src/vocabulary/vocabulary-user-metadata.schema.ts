import {
  LEARNING_STATUSES,
  REVIEW_STATUSES,
  type Tag,
  type VocabularyUserMetadata
} from "@platform/domain";
import { z } from "zod";

import {
  vocabularyCompactIdSchema,
  vocabularyShortTextSchema,
  vocabularyUtcDateTimeSchema
} from "./vocabulary-components.schema";

const normalizedTagNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(
    /^[a-z0-9][a-z0-9 _-]*$/,
    "Use lowercase letters, numbers, spaces, underscores, or hyphens."
  );

export const tagSchema: z.ZodType<Tag> = z.strictObject({
  id: vocabularyCompactIdSchema,
  name: vocabularyShortTextSchema,
  normalizedName: normalizedTagNameSchema,
  createdAt: vocabularyUtcDateTimeSchema
});

export const vocabularyUserMetadataSchema: z.ZodType<VocabularyUserMetadata> = z.strictObject({
  normalizedWord: z.string().trim().min(1).max(120),
  favorite: z.boolean(),
  tags: z.array(tagSchema).max(30),
  note: z.string().max(5_000),
  learningStatus: z.enum(LEARNING_STATUSES),
  reviewStatus: z.enum(REVIEW_STATUSES),
  lastViewedAt: vocabularyUtcDateTimeSchema.optional(),
  viewCount: z.number().int().nonnegative(),
  createdAt: vocabularyUtcDateTimeSchema,
  updatedAt: vocabularyUtcDateTimeSchema
});

export type ParsedVocabularyUserMetadata = z.infer<typeof vocabularyUserMetadataSchema>;
