const HYPHEN_VARIANTS = /[\u2010\u2011\u2012\u2013\u2014\u2212]/g;

export function normalizeHyphens(value: string): string {
  return value.replace(HYPHEN_VARIANTS, "-");
}
