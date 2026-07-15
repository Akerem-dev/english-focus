import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import type { CefrLevel, InstructionDetailLevel, InstructionPreferences } from "@platform/domain";

type SetInstructionPreferences = Dispatch<SetStateAction<InstructionPreferences>>;
type BooleanInstructionPreferenceKey =
  | "includeGrammarNotes"
  | "includeWordFamily"
  | "includeCommonMistakes"
  | "includeEtymology"
  | "includeUsageTips";

function updatePreference<K extends keyof InstructionPreferences>(
  current: InstructionPreferences,
  key: K,
  value: InstructionPreferences[K]
): InstructionPreferences {
  return {
    ...current,
    [key]: value
  };
}

function updateBooleanPreference(
  setPreferences: SetInstructionPreferences,
  key: BooleanInstructionPreferenceKey,
  checked: boolean
): void {
  setPreferences((current) => updatePreference(current, key, checked));
}

/**
 * Creates event handlers that snapshot DOM values synchronously.
 *
 * React's `currentTarget` is only guaranteed while the event handler is
 * executing. Never close over the event object inside a state updater.
 */
export function createInstructionSettingsHandlers(setPreferences: SetInstructionPreferences) {
  return {
    onDetailLevelChange(event: ChangeEvent<HTMLSelectElement>): void {
      const detailLevel = event.currentTarget.value as InstructionDetailLevel;
      setPreferences((current) => updatePreference(current, "detailLevel", detailLevel));
    },

    onTargetProficiencyChange(event: ChangeEvent<HTMLSelectElement>): void {
      const targetProficiency = event.currentTarget.value as CefrLevel;
      setPreferences((current) =>
        updatePreference(current, "targetProficiency", targetProficiency)
      );
    },

    onGrammarNotesChange(event: ChangeEvent<HTMLInputElement>): void {
      const checked = event.currentTarget.checked;
      updateBooleanPreference(setPreferences, "includeGrammarNotes", checked);
    },

    onWordFamilyChange(event: ChangeEvent<HTMLInputElement>): void {
      const checked = event.currentTarget.checked;
      updateBooleanPreference(setPreferences, "includeWordFamily", checked);
    },

    onCommonMistakesChange(event: ChangeEvent<HTMLInputElement>): void {
      const checked = event.currentTarget.checked;
      updateBooleanPreference(setPreferences, "includeCommonMistakes", checked);
    },

    onEtymologyChange(event: ChangeEvent<HTMLInputElement>): void {
      const checked = event.currentTarget.checked;
      updateBooleanPreference(setPreferences, "includeEtymology", checked);
    },

    onUsageTipsChange(event: ChangeEvent<HTMLInputElement>): void {
      const checked = event.currentTarget.checked;
      updateBooleanPreference(setPreferences, "includeUsageTips", checked);
    }
  } as const;
}
