import type { InstructionPreferences } from "@platform/domain";
import { z } from "zod";

import { cefrLevelSchema } from "../vocabulary/vocabulary-enums.schema";

export const instructionDetailLevelSchema = z.enum(["balanced", "detailed", "maximum"]);

export const instructionPreferencesSchema: z.ZodType<InstructionPreferences> = z.strictObject({
  explanationLanguage: z.literal("tr"),
  detailLevel: instructionDetailLevelSchema,
  targetProficiency: cefrLevelSchema,
  exampleCount: z.literal(10),
  includeWordFamily: z.boolean(),
  includeGrammarNotes: z.boolean(),
  includeCommonMistakes: z.boolean(),
  includeEtymology: z.boolean(),
  includeUsageTips: z.boolean()
});
