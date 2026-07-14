/** Stable JSON values used to classify vocabulary meanings. */
export const PARTS_OF_SPEECH = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "pronoun",
  "preposition",
  "conjunction",
  "determiner",
  "interjection",
  "modal",
  "auxiliary",
  "phrase",
  "phrasal-verb",
  "idiom",
  "other"
] as const;

export type PartOfSpeech = (typeof PARTS_OF_SPEECH)[number];
