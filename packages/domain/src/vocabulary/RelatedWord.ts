import type { PartOfSpeech } from "./PartOfSpeech";

export const RELATED_WORD_RELATIONSHIPS = [
  "synonym",
  "antonym",
  "near-synonym",
  "commonly-confused",
  "related"
] as const;

export type RelatedWordRelationship = (typeof RELATED_WORD_RELATIONSHIPS)[number];

export interface RelatedWord {
  word: string;
  normalizedWord: string;
  relationship: RelatedWordRelationship;
  partOfSpeech?: PartOfSpeech | undefined;
  distinctionEn?: string | undefined;
  distinctionTr?: string | undefined;
}
