export const ETYMOLOGY_CERTAINTY_LEVELS = ["high", "medium", "low"] as const;

export type EtymologyCertainty = (typeof ETYMOLOGY_CERTAINTY_LEVELS)[number];

export interface Etymology {
  explanationEn: string;
  explanationTr: string;
  certainty: EtymologyCertainty;
  originLanguage?: string | undefined;
  originForm?: string | undefined;
}
