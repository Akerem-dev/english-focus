export const SENTENCE_FORMS = [
  "affirmative",
  "negative",
  "question",
  "imperative",
  "conditional",
  "passive",
  "other"
] as const;

export type SentenceForm = (typeof SENTENCE_FORMS)[number];

export interface SentenceFormExample {
  form: SentenceForm;
  sentenceEn: string;
  translationTr: string;
}
