import { Button, SelectField, SwitchField } from "../../../components";
import { useInstructionPreferences } from "../../../app/providers";
import { createInstructionSettingsHandlers } from "./instructionSettingsHandlers";

export function InstructionSettingsSection() {
  const { preferences, resetPreferences, setPreferences } = useInstructionPreferences();
  const handlers = createInstructionSettingsHandlers(setPreferences);

  return (
    <div className="instruction-settings">
      <div className="settings-value-row">
        <span>Explanation language</span>
        <strong>Turkish</strong>
      </div>
      <div className="settings-value-row">
        <span>Primary examples</span>
        <strong>Exactly {preferences.exampleCount}</strong>
      </div>
      <SelectField
        label="Instruction detail level"
        onChange={handlers.onDetailLevelChange}
        value={preferences.detailLevel}
      >
        <option value="balanced">Balanced</option>
        <option value="detailed">Detailed</option>
        <option value="maximum">Maximum</option>
      </SelectField>
      <SelectField
        label="Target proficiency"
        onChange={handlers.onTargetProficiencyChange}
        value={preferences.targetProficiency}
      >
        <option value="A1">A1</option>
        <option value="A2">A2</option>
        <option value="B1">B1</option>
        <option value="B2">B2</option>
        <option value="C1">C1</option>
        <option value="C2">C2</option>
      </SelectField>
      <SwitchField
        checked={preferences.includeGrammarNotes}
        description="Ask for only naturally applicable grammar structures."
        label="Include grammar notes"
        onChange={handlers.onGrammarNotesChange}
      />
      <SwitchField
        checked={preferences.includeWordFamily}
        description="Request authentic derived and related forms."
        label="Include word family"
        onChange={handlers.onWordFamilyChange}
      />
      <SwitchField
        checked={preferences.includeCommonMistakes}
        description="Request useful learner errors without inventing filler."
        label="Include common mistakes"
        onChange={handlers.onCommonMistakesChange}
      />
      <SwitchField
        checked={preferences.includeEtymology}
        description="Include etymology only when its origin can be stated reliably."
        label="Include etymology"
        onChange={handlers.onEtymologyChange}
      />
      <SwitchField
        checked={preferences.includeUsageTips}
        description="Ask for practical notes that distinguish real usage."
        label="Include usage tips"
        onChange={handlers.onUsageTipsChange}
      />
      <Button onClick={resetPreferences} size="small" variant="ghost">
        Reset instruction defaults
      </Button>
      <small className="instruction-settings__note">
        These provider-independent preferences are saved locally and restored when English Focus
        restarts.
      </small>
    </div>
  );
}
