import {
  CEFR_LEVELS,
  CONTENT_VALIDATION_STATUSES,
  ETYMOLOGY_CERTAINTY_LEVELS,
  GENERATION_METHODS,
  INFLECTION_TYPES,
  PARTS_OF_SPEECH,
  PRONUNCIATION_VARIANTS,
  REGISTERS,
  RELATED_WORD_RELATIONSHIPS,
  SENTENCE_FORMS,
  VOCABULARY_ENTRY_SOURCE_KINDS,
  WORD_FAMILY_RELATIONS
} from "@platform/domain";
import { z } from "zod";

export const cefrLevelSchema = z.enum(CEFR_LEVELS);
export const partOfSpeechSchema = z.enum(PARTS_OF_SPEECH);
export const registerSchema = z.enum(REGISTERS);
export const pronunciationVariantSchema = z.enum(PRONUNCIATION_VARIANTS);
export const inflectionTypeSchema = z.enum(INFLECTION_TYPES);
export const wordFamilyRelationSchema = z.enum(WORD_FAMILY_RELATIONS);
export const etymologyCertaintySchema = z.enum(ETYMOLOGY_CERTAINTY_LEVELS);
export const sentenceFormSchema = z.enum(SENTENCE_FORMS);
export const relatedWordRelationshipSchema = z.enum(RELATED_WORD_RELATIONSHIPS);
export const vocabularyEntrySourceKindSchema = z.enum(VOCABULARY_ENTRY_SOURCE_KINDS);
export const generationMethodSchema = z.enum(GENERATION_METHODS);
export const contentValidationStatusSchema = z.enum(CONTENT_VALIDATION_STATUSES);
