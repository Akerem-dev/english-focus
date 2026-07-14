import type { PartOfSpeech } from "./PartOfSpeech";

export const WORD_FAMILY_RELATIONS = ["derived", "compound", "variant", "root"] as const;

export type WordFamilyRelation = (typeof WORD_FAMILY_RELATIONS)[number];

export interface WordFamilyItem {
  word: string;
  normalizedWord: string;
  partOfSpeech: PartOfSpeech;
  relation: WordFamilyRelation;
  translationTr?: string | undefined;
}
