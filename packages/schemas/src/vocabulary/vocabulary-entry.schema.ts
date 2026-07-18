import { VOCABULARY_SCHEMA_VERSION, type VocabularyEntry } from "@platform/domain";
import { z } from "zod";

import { exampleSentenceSchema } from "./example-sentence.schema";
import { grammarAnalysisSchema } from "./grammar-analysis.schema";
import {
  etymologySchema,
  generationMetadataSchema,
  meaningSchema,
  morphologySchema,
  pronunciationSchema,
  vocabularyCompactIdSchema,
  vocabularyEnglishTextSchema,
  vocabularyEntrySourceSchema,
  vocabularyNormalizedWordSchema,
  vocabularyShortTextSchema,
  vocabularyTurkishTextSchema,
  vocabularyUtcDateTimeSchema
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
  etymology: etymologySchema.optional(),
  grammar: grammarAnalysisSchema,
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

const canonicalTenExampleSchema = createVocabularyEntryContract(
  z.array(exampleSentenceSchema).length(10)
);

const legacyGrammarCompatibilitySchema = z.strictObject({
  summaryEn: vocabularyEnglishTextSchema,
  summaryTr: vocabularyTurkishTextSchema,
  patterns: z.array(z.unknown()).optional(),
  tenseExamples: z.array(z.unknown()).optional(),
  sentenceForms: z.array(z.unknown()).optional(),
  prepositionPatterns: z.array(z.unknown()).optional()
});

const legacyTenExampleCompatibilitySchema = z.strictObject({
  ...vocabularyEntryBaseShape,
  grammar: legacyGrammarCompatibilitySchema,
  wordFamily: z.array(z.unknown()).optional(),
  collocations: z.array(z.unknown()).optional(),
  phrasalVerbs: z.array(z.unknown()).optional(),
  idioms: z.array(z.unknown()).optional(),
  relatedWords: z.array(z.unknown()).optional(),
  commonMistakes: z.array(z.unknown()).optional(),
  examples: z.array(exampleSentenceSchema).length(10)
});

/** Canonical contract written by current English Focus versions. */
export const vocabularyEntrySchema = createVocabularyEntryContract(
  z.array(exampleSentenceSchema).length(3)
);

/** Native read compatibility for canonical and legacy V1 records after 3→10 adaptation. */
export const vocabularyEntryNativeCompatibilitySchema = z.union([
  canonicalTenExampleSchema,
  legacyTenExampleCompatibilitySchema
]);

const REMOVED_TOP_LEVEL_FIELDS = [
  "wordFamily",
  "collocations",
  "phrasalVerbs",
  "idioms",
  "relatedWords",
  "commonMistakes"
] as const;

function normalizeLegacyEntry(value: unknown): unknown {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return value;
  }

  const candidate = { ...(value as Record<string, unknown>) };

  for (const field of REMOVED_TOP_LEVEL_FIELDS) {
    delete candidate[field];
  }

  if (typeof candidate.grammar === "object" && candidate.grammar !== null) {
    const grammar = candidate.grammar as Record<string, unknown>;
    candidate.grammar = {
      summaryEn: grammar.summaryEn,
      summaryTr: grammar.summaryTr
    };
  }

  if (Array.isArray(candidate.examples) && candidate.examples.length === 10) {
    candidate.examples = candidate.examples.slice(0, 3);
  }

  return candidate;
}

/** Accepts legacy V1 input, strips removed content, and returns the canonical simplified model. */
export const vocabularyEntryInputSchema: z.ZodType<VocabularyEntry> = z.preprocess(
  normalizeLegacyEntry,
  vocabularyEntrySchema
);

export type ParsedVocabularyEntry = z.infer<typeof vocabularyEntrySchema>;
