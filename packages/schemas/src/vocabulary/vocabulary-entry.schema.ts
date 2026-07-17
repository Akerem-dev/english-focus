import { VOCABULARY_SCHEMA_VERSION, type VocabularyEntry } from "@platform/domain";
import { z } from "zod";

import { exampleSentenceSchema } from "./example-sentence.schema";
import { grammarAnalysisSchema } from "./grammar-analysis.schema";
import {
  collocationSchema,
  commonMistakeSchema,
  etymologySchema,
  generationMetadataSchema,
  idiomSchema,
  meaningSchema,
  morphologySchema,
  phrasalVerbSchema,
  pronunciationSchema,
  relatedWordSchema,
  vocabularyCompactIdSchema,
  vocabularyEntrySourceSchema,
  vocabularyNormalizedWordSchema,
  vocabularyShortTextSchema,
  vocabularyUtcDateTimeSchema,
  wordFamilyItemSchema
} from "./vocabulary-components.schema";
import { cefrLevelSchema, partOfSpeechSchema, registerSchema } from "./vocabulary-enums.schema";

const vocabularyEntryBaseShape = {
  schemaVersion: z.literal(VOCABULARY_SCHEMA_VERSION),
  id: vocabularyCompactIdSchema,
  word: vocabularyShortTextSchema,
  normalizedWord: vocabularyNormalizedWordSchema,
  aliases: z.array(vocabularyNormalizedWordSchema).max(30),
  pronunciations: z.array(pronunciationSchema).min(1).max(6),
  cefr: cefrLevelSchema,
  registers: z.array(registerSchema).max(12),
  partsOfSpeech: z.array(partOfSpeechSchema).min(1).max(8),
  meanings: z.array(meaningSchema).min(1).max(24),
  morphology: morphologySchema,
  wordFamily: z.array(wordFamilyItemSchema).max(40),
  etymology: etymologySchema.optional(),
  grammar: grammarAnalysisSchema,
  collocations: z.array(collocationSchema).max(60),
  phrasalVerbs: z.array(phrasalVerbSchema).max(30),
  idioms: z.array(idiomSchema).max(30),
  relatedWords: z.array(relatedWordSchema).max(60),
  commonMistakes: z.array(commonMistakeSchema).max(30),
  source: vocabularyEntrySourceSchema,
  generation: generationMetadataSchema,
  createdAt: vocabularyUtcDateTimeSchema,
  updatedAt: vocabularyUtcDateTimeSchema
} as const;

function createVocabularyEntryContract(
  examplesSchema: z.ZodArray<typeof exampleSentenceSchema>
): z.ZodType<VocabularyEntry> {
  return z
    .strictObject({
      ...vocabularyEntryBaseShape,
      examples: examplesSchema
    })
    .superRefine((entry, context) => {
      const meaningParts = new Set(entry.meanings.map((meaning) => meaning.partOfSpeech));
      const declaredParts = new Set(entry.partsOfSpeech);

      for (const partOfSpeech of meaningParts) {
        if (!declaredParts.has(partOfSpeech)) {
          context.addIssue({
            code: "custom",
            message: `Meaning part of speech '${partOfSpeech}' is missing from partsOfSpeech.`,
            path: ["partsOfSpeech"]
          });
        }
      }

      const exampleIds = entry.examples.map((example) => example.id);
      if (new Set(exampleIds).size !== exampleIds.length) {
        context.addIssue({
          code: "custom",
          message: "Primary example identifiers must be unique.",
          path: ["examples"]
        });
      }
    });
}

/** Canonical contract written by current English Focus versions. */
export const vocabularyEntrySchema = createVocabularyEntryContract(
  z.array(exampleSentenceSchema).length(3)
);

/** Read-only native compatibility contract for V1 entries that still contain ten examples. */
export const vocabularyEntryNativeCompatibilitySchema = createVocabularyEntryContract(
  z.array(exampleSentenceSchema).length(10)
);

function normalizeLegacyExamples(value: unknown): unknown {
  if (typeof value !== "object" || value === null || !("examples" in value)) {
    return value;
  }

  const examples = (value as { readonly examples?: unknown }).examples;
  if (!Array.isArray(examples) || examples.length !== 10) {
    return value;
  }

  return {
    ...value,
    examples: examples.slice(0, 3)
  };
}

/**
 * Accepts canonical three-example entries and legacy ten-example entries.
 * Legacy examples beyond the first three are removed before canonical validation.
 */
export const vocabularyEntryInputSchema: z.ZodType<VocabularyEntry> = z.preprocess(
  normalizeLegacyExamples,
  vocabularyEntrySchema
);

export type ParsedVocabularyEntry = z.infer<typeof vocabularyEntrySchema>;
