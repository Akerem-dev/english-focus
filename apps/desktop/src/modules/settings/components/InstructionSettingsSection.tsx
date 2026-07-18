import { Button, SelectField, SwitchField } from "../../../components";
import { useInstructionPreferences } from "../../../app/providers";
import { AppIcon } from "../../../design-system";
import { createInstructionSettingsHandlers } from "./instructionSettingsHandlers";

interface InstructionSettingsSectionProps {
  readonly disabled?: boolean | undefined;
}

export function InstructionSettingsSection({ disabled = false }: InstructionSettingsSectionProps) {
  const { preferences, resetPreferences, setPreferences } = useInstructionPreferences();
  const handlers = createInstructionSettingsHandlers(setPreferences);

  return (
    <div className="instruction-settings instruction-settings--compact">
      <SelectField
        disabled={disabled}
        fieldClassName="settings-inline-select"
        helperText="Choose the proficiency level used to shape explanations."
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

      <div className="settings-preference-row settings-preference-row--static">
        <span className="settings-preference-row__copy">
          <span className="settings-preference-row__label">Explanation language</span>
          <span className="settings-preference-row__description">
            Definitions and guidance are prepared in this language.
          </span>
        </span>
        <strong className="settings-preference-row__value">Turkish</strong>
      </div>

      <SelectField
        disabled={disabled}
        fieldClassName="settings-inline-select"
        helperText="Control how much guidance is requested without managing every option."
        label="Explanation detail"
        onChange={handlers.onDetailLevelChange}
        value={preferences.detailLevel}
      >
        <option value="balanced">Concise</option>
        <option value="detailed">Balanced</option>
        <option value="maximum">Detailed</option>
      </SelectField>

      <details className="settings-advanced-disclosure">
        <summary>
          <AppIcon name="settings" size={17} />
          <span>Advanced customization</span>
          <AppIcon
            className="settings-advanced-disclosure__chevron"
            name="chevron-down"
            size={16}
          />
        </summary>
        <div className="settings-advanced-disclosure__content">
          <SwitchField
            checked={preferences.includeGrammarNotes}
            containerClassName="settings-preference-row settings-preference-row--advanced"
            description="Request one short, practical grammar or usage explanation."
            disabled={disabled}
            label="Include grammar notes"
            onChange={handlers.onGrammarNotesChange}
          />
          <SwitchField
            checked={preferences.includeEtymology}
            containerClassName="settings-preference-row settings-preference-row--advanced"
            description="Request etymology only when its origin can be stated reliably."
            disabled={disabled}
            label="Include etymology"
            onChange={handlers.onEtymologyChange}
          />
          <SwitchField
            checked={preferences.includeUsageTips}
            containerClassName="settings-preference-row settings-preference-row--advanced"
            description="Ask for practical notes that distinguish real usage."
            disabled={disabled}
            label="Include usage tips"
            onChange={handlers.onUsageTipsChange}
          />
          <div className="settings-advanced-disclosure__footer">
            <Button disabled={disabled} onClick={resetPreferences} size="small" variant="ghost">
              Reset explanation defaults
            </Button>
            <small>
              These provider-independent preferences stay on this device and are restored when
              English Focus restarts.
            </small>
          </div>
        </div>
      </details>
    </div>
  );
}
