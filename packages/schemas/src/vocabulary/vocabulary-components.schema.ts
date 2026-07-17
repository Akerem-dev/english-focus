import type {
  Etymology,
  GenerationMetadata,
  InflectedForm,
  Meaning,
  Morphology,
  Pronunciation,
  VocabularyEntrySource
} from "@platform/domain";
import { z } from "zod";

import {
  contentValidationStatusSchema,
  etymologyCertaintySchema,
  generationMethodSchema,
  inflectionTypeSchema,
  partOfSpeechSchema,
  pronunciationVariantSchema,
  registerSchema,
  vocabularyEntrySourceKindSchema
} from "./vocabulary-enums.schema";

const compactIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/, "Use a stable compact identifier.");

const englishTextSchema = z.string().trim().min(1).max(4_000);
const turkishTextSchema = z.string().trim().min(1).max(4_000);
const shortTextSchema = z.string().trim().min(1).max(240);
const normalizedWordSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z][a-z' -]*$/, "Use lowercase English letters, spaces, apostrophes, or hyphens.");
const utcDateTimeSchema = z.iso.datetime();

export const pronunciationSchema: z.ZodType<Pronunciation> = z.strictObject({
  ipa: shortTextSchema,
  variant: pronunciationVariantSchema,
  syllableBreakdown: shortTextSchema.optional(),
  stress: shortTextSchema.optional()
});

export const meaningSchema: z.ZodType<Meaning> = z.strictObject({
  id: compactIdSchema,
  partOfSpeech: partOfSpeechSchema,
  definitionEn: englishTextSchema,
  translationsTr: z.array(shortTextSchema).min(1).max(12),
  registers: z.array(registerSchema).max(12),
  usageNoteEn: englishTextSchema.optional(),
  usageNoteTr: turkishTextSchema.optional()
});

export const inflectedFormSchema: z.ZodType<InflectedForm> = z.strictObject({
  form: shortTextSchema,
  normalizedForm: normalizedWordSchema,
  type: inflectionTypeSchema
});

export const morphologySchema: z.ZodType<Morphology> = z.strictObject({
  baseForm: shortTextSchema,
  root: shortTextSchema.optional(),
  prefix: shortTextSchema.optional(),
  suffix: shortTextSchema.optional(),
  inflectedForms: z.array(inflectedFormSchema).max(24),
  notesEn: englishTextSchema.optional(),
  notesTr: turkishTextSchema.optional()
});

export const etymologySchema: z.ZodType<Etymology> = z.strictObject({
  explanationEn: englishTextSchema,
  explanationTr: turkishTextSchema,
  certainty: etymologyCertaintySchema,
  originLanguage: shortTextSchema.optional(),
  originForm: shortTextSchema.optional()
});

export const vocabularyEntrySourceSchema: z.ZodType<VocabularyEntrySource> = z.strictObject({
  kind: vocabularyEntrySourceKindSchema,
  sourceId: compactIdSchema.optional(),
  sourceLabel: shortTextSchema.optional()
});

export const generationMetadataSchema: z.ZodType<GenerationMetadata> = z.strictObject({
  method: generationMethodSchema,
  generatedAt: utcDateTimeSchema,
  validationStatus: contentValidationStatusSchema,
  generatorLabel: shortTextSchema.optional(),
  warnings: z.array(shortTextSchema).max(50)
});

export const vocabularyCompactIdSchema = compactIdSchema;
export const vocabularyNormalizedWordSchema = normalizedWordSchema;
export const vocabularyShortTextSchema = shortTextSchema;
export const vocabularyEnglishTextSchema = englishTextSchema;
export const vocabularyTurkishTextSchema = turkishTextSchema;
export const vocabularyUtcDateTimeSchema = utcDateTimeSchema;
