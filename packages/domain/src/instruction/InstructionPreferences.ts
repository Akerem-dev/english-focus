import type { CefrLevel } from "../vocabulary/CefrLevel";

export type InstructionDetailLevel = "balanced" | "detailed" | "maximum";
export type InstructionExplanationLanguage = "tr";

/** Provider-independent preferences for simplified external-AI vocabulary prompts. */
export interface InstructionPreferences {
  readonly explanationLanguage: InstructionExplanationLanguage;
  readonly detailLevel: InstructionDetailLevel;
  readonly targetProficiency: CefrLevel;
  readonly includeGrammarNotes: boolean;
  readonly includeEtymology: boolean;
  readonly includeUsageTips: boolean;
}

export const DEFAULT_INSTRUCTION_PREFERENCES: InstructionPreferences = Object.freeze({
  explanationLanguage: "tr",
  detailLevel: "detailed",
  targetProficiency: "B2",
  includeGrammarNotes: true,
  includeEtymology: true,
  includeUsageTips: true
});
