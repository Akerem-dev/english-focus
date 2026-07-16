import type { ReactNode } from "react";
import type {
  BackupFrequency,
  ExampleSentenceDisplayCount,
  InterfaceSize,
  ThemePreference
} from "@platform/domain";

import { SelectField, StatusBadge, SwitchField } from "../../../components";
import { useSettings } from "../../../app/providers";
import { AppIcon } from "../../../design-system";
import {
  updateAppearanceSettings,
  updateContentSettings,
  updateDataSettings
} from "../application";
import {
  ActivitySection,
  BackupSettingsSection,
  CoreContentSection,
  DiagnosticsSection,
  InstructionSettingsSection,
  LocalDataControlsSection
} from "../components";

interface SettingsPanelProps {
  readonly className?: string | undefined;
  readonly icon: "book-open" | "command" | "settings" | "upload" | "warning";
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
}

function SettingsPanel({ children, className, description, icon, title }: SettingsPanelProps) {
  return (
    <section className={["settings-panel", className].filter(Boolean).join(" ")}>
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
  const { error, settings, status, updateSettings } = useSettings();
  const isBusy = status === "loading" || status === "saving";

  return (
    <div className="route-page route-page--settings">
      <header className="route-page__header settings-page-header">
        <div>
          <p className="route-page__eyebrow">Application preferences</p>
          <h1>Settings</h1>
          <p>Customize content presentation, local data behavior, and accessibility preferences.</p>
        </div>
        <div className="settings-page-header__actions" aria-live="polite">
          {status === "loading" ? <StatusBadge>Loading settings</StatusBadge> : null}
          {status === "saving" ? <StatusBadge tone="warning">Saving locally</StatusBadge> : null}
          {status === "saved" ? <StatusBadge tone="success">Saved locally</StatusBadge> : null}
          {status === "ready" ? (
            <StatusBadge tone="success">SQLite settings ready</StatusBadge>
          ) : null}
          {status === "error" ? (
            <StatusBadge tone="danger">Save needs attention</StatusBadge>
          ) : null}
        </div>
      </header>

      {error === undefined ? null : (
        <section className="settings-error" role="alert">
          <strong>Application settings could not be saved.</strong>
          <p>{error}</p>
        </section>
      )}

      <div className="settings-grid">
        <SettingsPanel
          description="Choose how vocabulary explanations and supporting details appear."
          icon="book-open"
          title="Content"
        >
          <SwitchField
            checked={settings.content.showEtymology}
            description="Display reliable word origins when available."
            disabled={isBusy}
            label="Show etymology"
            onChange={(event) => {
              const showEtymology = event.currentTarget.checked;
              void updateSettings((current) =>
                updateContentSettings(current, { ...current.content, showEtymology })
              );
            }}
          />
          <SwitchField
            checked={settings.content.showCommonMistakes}
            description="Highlight common learner errors and confusing usages."
            disabled={isBusy}
            label="Show common mistakes"
            onChange={(event) => {
              const showCommonMistakes = event.currentTarget.checked;
              void updateSettings((current) =>
                updateContentSettings(current, { ...current.content, showCommonMistakes })
              );
            }}
          />
          <SelectField
            disabled={isBusy}
            label="Example sentences shown"
            onChange={(event) => {
              const exampleSentenceCount = Number(
                event.currentTarget.value
              ) as ExampleSentenceDisplayCount;
              void updateSettings((current) =>
                updateContentSettings(current, { ...current.content, exampleSentenceCount })
              );
            }}
            value={String(settings.content.exampleSentenceCount)}
          >
            <option value="5">First 5</option>
            <option value="10">All 10</option>
          </SelectField>
        </SettingsPanel>

        <SettingsPanel
          description="Inspect the versioned read-only vocabulary collection bundled with this build."
          icon="book-open"
          title="Core vocabulary"
        >
          <CoreContentSection />
        </SettingsPanel>

        <SettingsPanel
          description="Create, retain, validate, and restore local backups without uploading data."
          icon="upload"
          title="Data"
        >
          <SwitchField
            checked={settings.data.automaticBackups}
            description="Create a retained local backup when the selected interval is due."
            disabled={isBusy}
            label="Automatic backups"
            onChange={(event) => {
              const automaticBackups = event.currentTarget.checked;
              void updateSettings((current) =>
                updateDataSettings(current, { ...current.data, automaticBackups })
              );
            }}
          />
          <SelectField
            disabled={isBusy || !settings.data.automaticBackups}
            label="Backup frequency"
            onChange={(event) => {
              const backupFrequency = event.currentTarget.value as BackupFrequency;
              void updateSettings((current) =>
                updateDataSettings(current, { ...current.data, backupFrequency })
              );
            }}
            value={settings.data.backupFrequency}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="manual">Manual only</option>
          </SelectField>
          <div className="settings-value-row">
            <span>Storage mode</span>
            <strong>Local SQLite database</strong>
          </div>
          <BackupSettingsSection />
        </SettingsPanel>

        <SettingsPanel
          description="Keep the interface comfortable across display scales and input methods."
          icon="settings"
          title="Appearance & accessibility"
        >
          <SelectField
            disabled={isBusy}
            label="Theme"
            onChange={(event) => {
              const theme = event.currentTarget.value as ThemePreference;
              void updateSettings((current) =>
                updateAppearanceSettings(current, { ...current.appearance, theme })
              );
            }}
            value={settings.appearance.theme}
          >
            <option value="light">Light</option>
            <option value="system">System</option>
            <option value="dark">Dark</option>
          </SelectField>
          <SwitchField
            checked={settings.appearance.reducedMotion}
            description="Minimize non-essential interface motion and smooth scrolling."
            disabled={isBusy}
            label="Reduced motion"
            onChange={(event) => {
              const reducedMotion = event.currentTarget.checked;
              void updateSettings((current) =>
                updateAppearanceSettings(current, { ...current.appearance, reducedMotion })
              );
            }}
          />
          <SelectField
            disabled={isBusy}
            label="Interface size"
            onChange={(event) => {
              const interfaceSize = event.currentTarget.value as InterfaceSize;
              void updateSettings((current) =>
                updateAppearanceSettings(current, { ...current.appearance, interfaceSize })
              );
            }}
            value={settings.appearance.interfaceSize}
          >
            <option value="compact">Compact</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </SelectField>
        </SettingsPanel>

        <SettingsPanel
          description="Control the provider-independent prompt copied for words missing locally."
          icon="command"
          title="AI instruction"
        >
          <InstructionSettingsSection />
        </SettingsPanel>

        <SettingsPanel
          className="settings-panel--wide"
          description="Run local database health checks and receive safe recovery guidance."
          icon="settings"
          title="Diagnostics"
        >
          <DiagnosticsSection />
        </SettingsPanel>

        <SettingsPanel
          className="settings-panel--wide"
          description="Review privacy-safe local actions and clear the timeline independently."
          icon="book-open"
          title="Privacy & activity"
        >
          <ActivitySection />
        </SettingsPanel>

        <SettingsPanel
          className="settings-panel--wide"
          description="Remove only selected local records or perform a guarded full reset while keeping bundled core vocabulary."
          icon="warning"
          title="Local data reset"
        >
          <LocalDataControlsSection />
        </SettingsPanel>
      </div>
    </div>
  );
}
