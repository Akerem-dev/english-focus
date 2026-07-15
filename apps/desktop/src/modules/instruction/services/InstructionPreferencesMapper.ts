import { DEFAULT_INSTRUCTION_PREFERENCES, type InstructionPreferences } from "@platform/domain";
import { instructionPreferencesSchema } from "@platform/schemas";

export function createDefaultInstructionPreferences(): InstructionPreferences {
  return instructionPreferencesSchema.parse({ ...DEFAULT_INSTRUCTION_PREFERENCES });
}

export function validateInstructionPreferences(
  preferences: InstructionPreferences
): InstructionPreferences {
  return instructionPreferencesSchema.parse(preferences);
}
