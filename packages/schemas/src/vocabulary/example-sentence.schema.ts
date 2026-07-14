import type { ExampleSentence } from "@platform/domain";
import { z } from "zod";

import { registerSchema } from "./vocabulary-enums.schema";
import {
  vocabularyCompactIdSchema,
  vocabularyEnglishTextSchema,
  vocabularyShortTextSchema,
  vocabularyTurkishTextSchema
} from "./vocabulary-components.schema";

export const exampleSentenceSchema: z.ZodType<ExampleSentence> = z.strictObject({
  id: vocabularyCompactIdSchema,
  sentenceEn: vocabularyEnglishTextSchema,
  translationTr: vocabularyTurkishTextSchema,
  registers: z.array(registerSchema).max(12),
  grammarLabel: vocabularyShortTextSchema.optional(),
  targetForm: vocabularyShortTextSchema.optional(),
  context: vocabularyShortTextSchema.optional()
});
