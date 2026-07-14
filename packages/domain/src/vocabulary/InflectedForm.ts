export const INFLECTION_TYPES = [
  "base",
  "plural",
  "past",
  "past-participle",
  "present-participle",
  "third-person-singular",
  "comparative",
  "superlative",
  "other"
] as const;

export type InflectionType = (typeof INFLECTION_TYPES)[number];

export interface InflectedForm {
  form: string;
  normalizedForm: string;
  type: InflectionType;
}
