import type { ReactNode } from "react";
import { useState } from "react";

import { SelectField, SwitchField } from "../../../components";
import { AppIcon } from "../../../design-system";
import { InstructionSettingsSection } from "../components";

interface SettingsPanelProps {
  readonly icon: "book-open" | "command" | "settings" | "upload";
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
}

function SettingsPanel({ children, description, icon, title }: SettingsPanelProps) {
  return (
    <section className="settings-panel">
      <header className="settings-panel__header">
        <span aria-hidden="true" className="settings-panel__icon">
          <AppIcon name={icon} size={20} />
        </span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </header>
      <div className="settings-panel__body">{children}</div>
    </section>
  );
}

export function SettingsPage() {
  const [showEtymology, setShowEtymology] = useState(true);
  const [showMistakes, setShowMistakes] = useState(true);
  const [automaticBackups, setAutomaticBackups] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  return (
    <div className="route-page route-page--settings">
      <header className="route-page__header">
        <div>
          <p className="route-page__eyebrow">Application preferences</p>
          <h1>Settings</h1>
          <p>Customize content presentation, local data behavior, and accessibility preferences.</p>
        </div>
      </header>

      <div className="settings-grid">
        <SettingsPanel
          description="Choose how vocabulary explanations and supporting details appear."
          icon="book-open"
          title="Content"
        >
          <SwitchField
            checked={showEtymology}
            description="Display reliable word origins when available."
            label="Show etymology"
            onChange={(event) => {
              setShowEtymology(event.currentTarget.checked);
            }}
          />
          <SwitchField
            checked={showMistakes}
            description="Highlight common learner errors and confusing usages."
            label="Show common mistakes"
            onChange={(event) => {
              setShowMistakes(event.currentTarget.checked);
            }}
          />
          <SelectField defaultValue="10" label="Example sentence count">
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="15">15</option>
          </SelectField>
        </SettingsPanel>

        <SettingsPanel
          description="Control local backup defaults and storage-oriented behavior."
          icon="upload"
          title="Data"
        >
          <SwitchField
            checked={automaticBackups}
            description="Create retained local backups automatically."
            label="Automatic backups"
            onChange={(event) => {
              setAutomaticBackups(event.currentTarget.checked);
            }}
          />
          <SelectField defaultValue="daily" label="Backup frequency">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="manual">Manual only</option>
          </SelectField>
          <div className="settings-value-row">
            <span>Storage mode</span>
            <strong>Local device</strong>
          </div>
        </SettingsPanel>

        <SettingsPanel
          description="Keep the interface comfortable across display scales and input methods."
          icon="settings"
          title="Appearance & accessibility"
        >
          <SelectField defaultValue="system" label="Theme">
            <option value="light">Light</option>
            <option value="system">System</option>
            <option value="dark">Dark</option>
          </SelectField>
          <SwitchField
            checked={reducedMotion}
            description="Minimize non-essential interface motion."
            label="Reduced motion"
            onChange={(event) => {
              setReducedMotion(event.currentTarget.checked);
            }}
          />
          <div className="settings-value-row">
            <span>Interface size</span>
            <strong>Medium</strong>
          </div>
        </SettingsPanel>

        <SettingsPanel
          description="Control the provider-independent prompt copied for words missing locally."
          icon="command"
          title="AI instruction"
        >
          <InstructionSettingsSection />
        </SettingsPanel>

        <SettingsPanel
          description="Current application and local database information."
          icon="settings"
          title="Diagnostics"
        >
          <div className="settings-value-row">
            <span>Application version</span>
            <strong>0.0.0</strong>
          </div>
          <div className="settings-value-row">
            <span>Schema version</span>
            <strong>Foundation</strong>
          </div>
          <div className="settings-value-row">
            <span>Database status</span>
            <strong>Not initialized</strong>
          </div>
        </SettingsPanel>
      </div>
    </div>
  );
}
