import type { CefrLevel } from "../vocabulary/CefrLevel";

export type InstructionDetailLevel = "balanced" | "detailed" | "maximum";
export type InstructionExplanationLanguage = "tr";

/**
 * Provider-independent preferences used when English Focus prepares a prompt
 * for an external AI account. These settings never contain a provider name,
 * API credential, model identifier, or network endpoint.
 */
export interface InstructionPreferences {
  readonly explanationLanguage: InstructionExplanationLanguage;
  readonly detailLevel: InstructionDetailLevel;
  readonly targetProficiency: CefrLevel;
  readonly exampleCount: 10;
  readonly includeWordFamily: boolean;
  readonly includeGrammarNotes: boolean;
  readonly includeCommonMistakes: boolean;
  readonly includeEtymology: boolean;
  readonly includeUsageTips: boolean;
}

export const DEFAULT_INSTRUCTION_PREFERENCES: InstructionPreferences = Object.freeze({
  explanationLanguage: "tr",
  detailLevel: "detailed",
  targetProficiency: "B2",
  exampleCount: 10,
  includeWordFamily: true,
  includeGrammarNotes: true,
  includeCommonMistakes: true,
  includeEtymology: true,
  includeUsageTips: true
});
