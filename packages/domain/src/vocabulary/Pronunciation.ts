export const PRONUNCIATION_VARIANTS = ["general", "uk", "us", "au", "other"] as const;

export type PronunciationVariant = (typeof PRONUNCIATION_VARIANTS)[number];

export interface Pronunciation {
  ipa: string;
  variant: PronunciationVariant;
  syllableBreakdown?: string | undefined;
  stress?: string | undefined;
}
