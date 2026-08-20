import { useRef, useState, type ReactNode } from "react";
import type { BackupFrequency, InterfaceSize, ThemePreference } from "@platform/domain";

import { SelectField, SwitchField } from "../../../components";
import { useActivity, useSettings } from "../../../app/providers";
import { AppIcon } from "../../../design-system";
import {
  settingsCategoryLabel,
  updateAppearanceSettings,
  updateContentSettings,
  updateDataSettings,
  type SettingsCategoryId
} from "../application";
import {
  AssistantConnectionSettings,
  BackupSettingsSection,
  CoreContentSection,
  InstructionSettingsSection,
  SettingsCategoryNavigation,
  SettingsMaintenanceOverview,
  SettingsManagementDetail,
  type SettingsManagementView
} from "../components";

import "../../../styles/settings.css";
import "../../../styles/assistant-settings.css";
import "../../../styles/settings-management.css";
import "../../../styles/settings-polish.css";
import "../../../styles/settings-surface-simplification.css";
import "../../../styles/settings-task-simplification.css";
import "../../../styles/settings-task-flow-polish.css";

interface SettingsPreferenceListProps {
  readonly ariaLabel: string;
  readonly children: ReactNode;
}

function SettingsPreferenceList({ ariaLabel, children }: SettingsPreferenceListProps) {
  return (
    <div aria-label={ariaLabel} className="settings-preference-list" role="list">
      {children}
    </div>
  );
}

interface SettingsPreferenceRowProps {
  readonly label: string;
  readonly description: string;
  readonly control: ReactNode;
}

function SettingsPreferenceRow({ label, description, control }: SettingsPreferenceRowProps) {
  return (
    <div className="settings-preference-row" role="listitem">
      <div>
        <strong>{label}</strong>
        <p>{description}</p>
      </div>
      <div className="settings-preference-row__control">{control}</div>
    </div>
  );
}

export function SettingsPage() {
  const { recordEvent } = useActivity();
  const { error, settings, status, updateSettings } = useSettings();
  const [activeCategory, setActiveCategory] = useState<SettingsCategoryId>("general");
  const [managementView, setManagementView] = useState<SettingsManagementView>();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const categoryTitle = settingsCategoryLabel(activeCategory);

  function selectCategory(category: SettingsCategoryId) {
    setActiveCategory(category);
    setManagementView(undefined);
    window.requestAnimationFrame(() => {
      headingRef.current?.focus();
    });
  }

  async function updateTheme(theme: ThemePreference) {
    const next = updateAppearanceSettings(settings, { theme });
    await updateSettings(next);
    await recordEvent({ type: "settings.updated", detail: `Theme: ${theme}` });
  }

  async function updateInterfaceSize(interfaceSize: InterfaceSize) {
    const next = updateAppearanceSettings(settings, { interfaceSize });
    await updateSettings(next);
    await recordEvent({ type: "settings.updated", detail: `Interface size: ${interfaceSize}` });
  }

  async function updateShowTurkishSupport(showTurkishSupport: boolean) {
    const next = updateContentSettings(settings, { showTurkishSupport });
    await updateSettings(next);
    await recordEvent({
      type: "settings.updated",
      detail: `Turkish support: ${showTurkishSupport ? "on" : "off"}`
    });
  }

  async function updateAutoBackupEnabled(autoBackupEnabled: boolean) {
    const next = updateDataSettings(settings, { autoBackupEnabled });
    await updateSettings(next);
    await recordEvent({
      type: "settings.updated",
      detail: `Automatic backups: ${autoBackupEnabled ? "on" : "off"}`
    });
  }

  async function updateBackupFrequency(backupFrequency: BackupFrequency) {
    const next = updateDataSettings(settings, { backupFrequency });
    await updateSettings(next);
    await recordEvent({ type: "settings.updated", detail: `Backup frequency: ${backupFrequency}` });
  }

  const busy = status === "loading" || status === "saving";

  return (
    <main aria-busy={busy} className="settings-page" id="main-content" tabIndex={-1}>
      <header className="route-page-header settings-page__header">
        <p className="eyebrow">Preferences</p>
        <h1>Settings</h1>
        <p>Manage the interface, study preferences, assistant connection, and local data.</p>
      </header>

      {error ? (
        <div className="settings-page__error" role="alert">
          <strong>Settings could not be saved.</strong>
          <span>{error}</span>
        </div>
      ) : null}

      <div className="settings-page__layout">
        <SettingsCategoryNavigation
          activeCategory={activeCategory}
          onSelectCategory={selectCategory}
        />

        <section className="settings-page__content" aria-labelledby="settings-category-heading">
          <header className="settings-category-header">
            <p className="eyebrow">{activeCategory === "general" ? "Preferences" : "Management"}</p>
            <h2 id="settings-category-heading" ref={headingRef} tabIndex={-1}>
              {managementView === undefined ? categoryTitle : managementView.title}
            </h2>
          </header>

          {activeCategory === "general" && managementView === undefined ? (
            <>
              <SettingsPreferenceList ariaLabel="Appearance preferences">
                <SettingsPreferenceRow
                  label="Theme"
                  description="Choose how English Focus looks on this device."
                  control={
                    <SelectField
                      ariaLabel="Theme"
                      disabled={busy}
                      onChange={(value) => {
                        void updateTheme(value as ThemePreference);
                      }}
                      options={[
                        { label: "System", value: "system" },
                        { label: "Light", value: "light" },
                        { label: "Dark", value: "dark" }
                      ]}
                      value={settings.appearance.theme}
                    />
                  }
                />
                <SettingsPreferenceRow
                  label="Interface size"
                  description="Adjust spacing and control size without changing content."
                  control={
                    <SelectField
                      ariaLabel="Interface size"
                      disabled={busy}
                      onChange={(value) => {
                        void updateInterfaceSize(value as InterfaceSize);
                      }}
                      options={[
                        { label: "Comfortable", value: "comfortable" },
                        { label: "Compact", value: "compact" }
                      ]}
                      value={settings.appearance.interfaceSize}
                    />
                  }
                />
              </SettingsPreferenceList>

              <SettingsPreferenceList ariaLabel="Content preferences">
                <SettingsPreferenceRow
                  label="Turkish support"
                  description="Show Turkish translations and notes alongside English content."
                  control={
                    <SwitchField
                      checked={settings.content.showTurkishSupport}
                      disabled={busy}
                      label="Show Turkish support"
                      onChange={(checked) => {
                        void updateShowTurkishSupport(checked);
                      }}
                    />
                  }
                />
              </SettingsPreferenceList>

              <AssistantConnectionSettings />
              <InstructionSettingsSection />
            </>
          ) : null}

          {activeCategory === "data" && managementView === undefined ? (
            <SettingsMaintenanceOverview onOpenView={setManagementView} />
          ) : null}

          {activeCategory === "data" && managementView !== undefined ? (
            <SettingsManagementDetail
              onBack={() => {
                setManagementView(undefined);
              }}
              view={managementView}
            />
          ) : null}

          {activeCategory === "backup" && managementView === undefined ? (
            <BackupSettingsSection
              autoBackupEnabled={settings.data.autoBackupEnabled}
              backupFrequency={settings.data.backupFrequency}
              disabled={busy}
              onAutoBackupEnabledChange={(checked) => {
                void updateAutoBackupEnabled(checked);
              }}
              onBackupFrequencyChange={(value) => {
                void updateBackupFrequency(value as BackupFrequency);
              }}
            />
          ) : null}

          {activeCategory === "content" && managementView === undefined ? (
            <CoreContentSection />
          ) : null}
        </section>
      </div>
    </main>
  );
}
