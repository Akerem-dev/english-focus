export type ThemePreference = "light" | "dark" | "system";
export type InterfaceSize = "compact" | "medium" | "large";

export interface AppearanceSettings {
  readonly theme: ThemePreference;
  readonly reducedMotion: boolean;
  readonly interfaceSize: InterfaceSize;
}
