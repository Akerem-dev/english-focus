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

/** Structural contract for imported, core, and overridden vocabulary content. */
export const vocabularyEntrySchema: z.ZodType<VocabularyEntry> = z
  .strictObject({
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
    examples: z.array(exampleSentenceSchema).length(10),
    source: vocabularyEntrySourceSchema,
    generation: generationMetadataSchema,
    createdAt: vocabularyUtcDateTimeSchema,
    updatedAt: vocabularyUtcDateTimeSchema
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

export type ParsedVocabularyEntry = z.infer<typeof vocabularyEntrySchema>;
