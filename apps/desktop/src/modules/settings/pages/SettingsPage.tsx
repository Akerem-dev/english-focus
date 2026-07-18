import { useRef, useState, type ReactNode } from "react";
import type { BackupFrequency, InterfaceSize, ThemePreference } from "@platform/domain";

import { SelectField, SwitchField } from "../../../components";
import { useActivity, useSettings } from "../../../app/providers";
import { AppIcon, type AppIconName } from "../../../design-system";
import {
  updateAppearanceSettings,
  updateContentSettings,
  updateDataSettings,
  type SettingsCategoryId
} from "../application";
import {
  BackupSettingsSection,
  CoreContentSection,
  InstructionSettingsSection,
  SettingsCategoryNavigation,
  SettingsMaintenanceOverview,
  SettingsManagementDetail,
  settingsCategoryLabel,
  type SettingsManagementView
} from "../components";

interface SettingsPanelProps {
  readonly className?: string | undefined;
  readonly icon?: AppIconName | undefined;
  readonly title?: string | undefined;
  readonly description?: string | undefined;
  readonly children: ReactNode;
}

function SettingsPanel({ children, className, description, icon, title }: SettingsPanelProps) {
  const hasHeader = icon !== undefined && title !== undefined && description !== undefined;

  return (
    <section className={["settings-panel", className].filter(Boolean).join(" ")}>
      {hasHeader ? (
        <header className="settings-panel__header">
          <span aria-hidden="true" className="settings-panel__icon">
            <AppIcon name={icon} size={20} />
          </span>
          <div>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        </header>
      ) : null}
      <div className="settings-panel__body">{children}</div>
    </section>
  );
}

interface StaticPreferenceRowProps {
  readonly description: string;
  readonly label: string;
  readonly value: string;
}

function StaticPreferenceRow({ description, label, value }: StaticPreferenceRowProps) {
  return (
    <div className="settings-preference-row settings-preference-row--static">
      <span className="settings-preference-row__copy">
        <span className="settings-preference-row__label">{label}</span>
        <span className="settings-preference-row__description">{description}</span>
      </span>
      <strong className="settings-preference-row__value">{value}</strong>
    </div>
  );
}

function SettingsSaveNote({ status }: { readonly status: string }) {
  let message = "Changes save automatically.";

  if (status === "loading") {
    message = "Loading local settings…";
  } else if (status === "saving") {
    message = "Saving changes locally…";
  } else if (status === "error") {
    message = "Some changes need attention.";
  }

  return (
    <p aria-live="polite" className="settings-save-note" data-status={status}>
      <AppIcon name={status === "error" ? "warning" : "check"} size={15} />
      <span>{message}</span>
    </p>
  );
}

export function SettingsPage() {
  const { activity, error: activityError, status: activityStatus } = useActivity();
  const { error, settings, status, updateSettings } = useSettings();
  const [selectedCategory, setSelectedCategory] = useState<SettingsCategoryId>("content");
  const [managementView, setManagementView] = useState<SettingsManagementView | undefined>();
  const privacyContentRef = useRef<HTMLDivElement>(null);
  const isBusy = status === "loading" || status === "saving";
  const activitySummary =
    activityError !== undefined
      ? "Activity needs attention"
      : activityStatus === "loading"
        ? "Loading local activity"
        : `${activity.length} recent ${activity.length === 1 ? "event" : "events"}`;

  function selectCategory(category: SettingsCategoryId) {
    setManagementView(undefined);
    setSelectedCategory(category);
  }

  function closeManagementView() {
    setManagementView(undefined);
    window.requestAnimationFrame(() => {
      privacyContentRef.current
        ?.querySelector<HTMLButtonElement>("[data-settings-management-trigger]")
        ?.focus();
    });
  }

  return (
    <div className="route-page route-page--settings">
      <header className="route-page__header settings-page-header">
        <div>
          <p className="route-page__eyebrow">Application preferences</p>
          <h1>Settings</h1>
          <p>Customize the English Focus experience around the way you learn.</p>
        </div>
      </header>

      {error === undefined ? null : (
        <section className="settings-error" role="alert">
          <strong>Application settings could not be saved.</strong>
          <p>{error}</p>
        </section>
      )}

      <div className="settings-workspace">
        <div className="settings-workspace__rail">
          <SettingsCategoryNavigation
            onSelect={selectCategory}
            selectedCategory={selectedCategory}
          />

          <aside aria-label="Application information" className="settings-about-card">
            <CoreContentSection />
          </aside>
        </div>

        <section
          aria-busy={isBusy}
          aria-labelledby={`settings-category-tab-${selectedCategory}`}
          className="settings-category-view"
          id="settings-category-panel"
          role="tabpanel"
        >
          <h2 className="sr-only">{settingsCategoryLabel(selectedCategory)}</h2>

          {selectedCategory === "general" ? (
            <div className="settings-category-view__content settings-category-view__content--preferences">
              <SettingsPanel className="settings-panel--preference-list">
                <SelectField
                  disabled={isBusy}
                  fieldClassName="settings-inline-select"
                  helperText="Choose how English Focus follows your system appearance."
                  label="Theme"
                  onChange={(event) => {
                    const theme = event.currentTarget.value as ThemePreference;
                    void updateSettings((current) =>
                      updateAppearanceSettings(current, {
                        ...current.appearance,
                        theme
                      })
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
                  containerClassName="settings-preference-row"
                  description="Minimize non-essential motion and smooth scrolling."
                  disabled={isBusy}
                  label="Reduced motion"
                  onChange={(event) => {
                    const reducedMotion = event.currentTarget.checked;
                    void updateSettings((current) =>
                      updateAppearanceSettings(current, {
                        ...current.appearance,
                        reducedMotion
                      })
                    );
                  }}
                />
                <SelectField
                  disabled={isBusy}
                  fieldClassName="settings-inline-select"
                  helperText="Adjust the overall density of controls and content."
                  label="Interface size"
                  onChange={(event) => {
                    const interfaceSize = event.currentTarget.value as InterfaceSize;
                    void updateSettings((current) =>
                      updateAppearanceSettings(current, {
                        ...current.appearance,
                        interfaceSize
                      })
                    );
                  }}
                  value={settings.appearance.interfaceSize}
                >
                  <option value="compact">Compact</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </SelectField>
              </SettingsPanel>
            </div>
          ) : null}

          {selectedCategory === "content" ? (
            <div className="settings-category-view__content settings-category-view__content--preferences">
              <SettingsPanel className="settings-panel--preference-list">
                <SwitchField
                  checked={settings.content.showEtymology}
                  containerClassName="settings-preference-row"
                  description="Display reliable word origins when they are available."
                  disabled={isBusy}
                  label="Show etymology"
                  onChange={(event) => {
                    const showEtymology = event.currentTarget.checked;
                    void updateSettings((current) =>
                      updateContentSettings(current, {
                        ...current.content,
                        showEtymology
                      })
                    );
                  }}
                />
                <StaticPreferenceRow
                  description="Every vocabulary entry shows its first three translated examples."
                  label="Example sentences shown"
                  value="First 3"
                />
                <InstructionSettingsSection disabled={isBusy} />
              </SettingsPanel>
            </div>
          ) : null}

          {selectedCategory === "data" ? (
            <div className="settings-category-view__content settings-category-view__content--preferences">
              <SettingsPanel className="settings-panel--preference-list">
                <SwitchField
                  checked={settings.data.automaticBackups}
                  containerClassName="settings-preference-row"
                  description="Create a retained local backup when the selected interval is due."
                  disabled={isBusy}
                  label="Automatic backups"
                  onChange={(event) => {
                    const automaticBackups = event.currentTarget.checked;
                    void updateSettings((current) =>
                      updateDataSettings(current, {
                        ...current.data,
                        automaticBackups
                      })
                    );
                  }}
                />
                <SelectField
                  disabled={isBusy || !settings.data.automaticBackups}
                  fieldClassName="settings-inline-select"
                  helperText="Choose how often an automatic local backup is retained."
                  label="Backup frequency"
                  onChange={(event) => {
                    const backupFrequency = event.currentTarget.value as BackupFrequency;
                    void updateSettings((current) =>
                      updateDataSettings(current, {
                        ...current.data,
                        backupFrequency
                      })
                    );
                  }}
                  value={settings.data.backupFrequency}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="manual">Manual only</option>
                </SelectField>
                <BackupSettingsSection />
              </SettingsPanel>
            </div>
          ) : null}

          {selectedCategory === "privacy" ? (
            <div className="settings-category-view__content" ref={privacyContentRef}>
              {managementView === undefined ? (
                <SettingsMaintenanceOverview
                  activitySummary={activitySummary}
                  onOpen={setManagementView}
                />
              ) : (
                <SettingsManagementDetail onBack={closeManagementView} view={managementView} />
              )}
            </div>
          ) : null}

          {selectedCategory === "privacy" ? null : <SettingsSaveNote status={status} />}
        </section>
      </div>
    </div>
  );
}
