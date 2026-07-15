const APOSTROPHE_VARIANTS = /[\u2018\u2019\u201B\u2032\u00B4`]/g;

export function normalizeApostrophes(value: string): string {
  return value.replace(APOSTROPHE_VARIANTS, "'");
}
