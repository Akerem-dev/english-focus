import type { GrammarAnalysis } from "@platform/domain";
import { z } from "zod";

import {
  vocabularyEnglishTextSchema,
  vocabularyTurkishTextSchema
} from "./vocabulary-components.schema";

export const grammarAnalysisSchema: z.ZodType<GrammarAnalysis> = z.strictObject({
  summaryEn: vocabularyEnglishTextSchema,
  summaryTr: vocabularyTurkishTextSchema
});
