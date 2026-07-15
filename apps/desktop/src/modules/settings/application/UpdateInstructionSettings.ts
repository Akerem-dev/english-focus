import type { AppSettings, InstructionSettings } from "@platform/domain";

export function updateInstructionSettings(
  current: AppSettings,
  instruction: InstructionSettings,
  updatedAt = new Date().toISOString()
): AppSettings {
  return Object.freeze({ ...current, instruction: Object.freeze(instruction), updatedAt });
}
