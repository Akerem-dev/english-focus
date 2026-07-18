import { useState, type ReactNode } from "react";
import type { BackupFrequency, InterfaceSize, ThemePreference } from "@platform/domain";

import { SelectField, SwitchField } from "../../../components";
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

type SettingsCategoryId = "general" | "content" | "data" | "privacy";
type SettingsIcon = "book-open" | "command" | "settings" | "upload" | "warning";

interface SettingsCategory {
  readonly id: SettingsCategoryId;
  readonly label: string;
  readonly description: string;
  readonly icon: SettingsIcon;
}

const SETTINGS_CATEGORIES = [
  {
    id: "general",
    label: "General",
    description: "Appearance and accessibility preferences.",
    icon: "settings"
  },
  {
    id: "content",
    label: "Vocabulary content",
    description: "Vocabulary display and explanation preferences.",
    icon: "book-open"
  },
  {
    id: "data",
    label: "Data & backups",
    description: "Local backup and retention preferences.",
    icon: "upload"
  },
  {
    id: "privacy",
    label: "Privacy & maintenance",
    description: "Activity, diagnostics, and protected data controls.",
    icon: "warning"
  }
] as const satisfies readonly SettingsCategory[];

interface SettingsPanelProps {
  readonly className?: string | undefined;
  readonly icon?: SettingsIcon | undefined;
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
  const { error, settings, status, updateSettings } = useSettings();
  const [selectedCategory, setSelectedCategory] = useState<SettingsCategoryId>("content");
  const isBusy = status === "loading" || status === "saving";
  const selectedCategoryDetails =
    SETTINGS_CATEGORIES.find((category) => category.id === selectedCategory) ??
    SETTINGS_CATEGORIES[0];

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
          <nav aria-label="Settings categories" className="settings-category-nav" role="tablist">
            {SETTINGS_CATEGORIES.map((category) => {
              const active = category.id === selectedCategory;

              return (
                <button
                  aria-controls={`settings-category-panel-${category.id}`}
                  aria-selected={active}
                  className="settings-category-nav__item"
                  data-active={active || undefined}
                  id={`settings-category-tab-${category.id}`}
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                  }}
                  role="tab"
                  title={category.description}
                  type="button"
                >
                  <AppIcon name={category.icon} size={19} />
                  <strong>{category.label}</strong>
                </button>
              );
            })}
          </nav>

          <aside aria-label="Application information" className="settings-about-card">
            <CoreContentSection />
          </aside>
        </div>

        <section
          aria-busy={isBusy}
          aria-labelledby={`settings-category-tab-${selectedCategory}`}
          className="settings-category-view"
          id={`settings-category-panel-${selectedCategory}`}
          role="tabpanel"
        >
          <h2 className="sr-only">{selectedCategoryDetails.label}</h2>

          {selectedCategory === "general" ? (
            <div className="settings-category-view__content">
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
            <div className="settings-category-view__content">
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
            <div className="settings-category-view__content settings-category-view__content--stacked">
              <SettingsPanel
                description="Create, retain, validate, and restore local backups without uploading data."
                icon="upload"
                title="Data & backups"
              >
                <SwitchField
                  checked={settings.data.automaticBackups}
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
            <div className="settings-category-view__content settings-category-view__content--stacked">
              <SettingsPanel
                description="Run local database health checks and receive safe recovery guidance."
                icon="settings"
                title="Diagnostics"
              >
                <DiagnosticsSection />
              </SettingsPanel>

              <SettingsPanel
                description="Review privacy-safe local actions and clear the timeline independently."
                icon="book-open"
                title="Privacy & activity"
              >
                <ActivitySection />
              </SettingsPanel>

              <SettingsPanel
                className="settings-panel--danger"
                description="Remove selected local records or perform a guarded reset while keeping bundled vocabulary."
                icon="warning"
                title="Local data reset"
              >
                <LocalDataControlsSection />
              </SettingsPanel>
            </div>
          ) : null}

          <SettingsSaveNote status={status} />
        </section>
      </div>
    </div>
  );
}
