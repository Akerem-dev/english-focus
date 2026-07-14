import type { GrammarAnalysis } from "@platform/domain";
import { z } from "zod";

import {
  grammarPatternSchema,
  prepositionPatternSchema,
  sentenceFormExampleSchema,
  tenseExampleSchema,
  vocabularyEnglishTextSchema,
  vocabularyTurkishTextSchema
} from "./vocabulary-components.schema";

export const grammarAnalysisSchema: z.ZodType<GrammarAnalysis> = z.strictObject({
  summaryEn: vocabularyEnglishTextSchema,
  summaryTr: vocabularyTurkishTextSchema,
  patterns: z.array(grammarPatternSchema).max(24),
  tenseExamples: z.array(tenseExampleSchema).max(24),
  sentenceForms: z.array(sentenceFormExampleSchema).max(24),
  prepositionPatterns: z.array(prepositionPatternSchema).max(24)
});
