export type SettingsCategoryId = "general" | "content" | "data" | "privacy";

export const SETTINGS_CATEGORY_IDS = [
  "general",
  "content",
  "data",
  "privacy"
] as const satisfies readonly SettingsCategoryId[];

export function resolveSettingsCategoryNavigation(
  current: SettingsCategoryId,
  key: string
): SettingsCategoryId | undefined {
  const currentIndex = SETTINGS_CATEGORY_IDS.indexOf(current);

  if (key === "Home") {
    return SETTINGS_CATEGORY_IDS[0];
  }

  if (key === "End") {
    return SETTINGS_CATEGORY_IDS[SETTINGS_CATEGORY_IDS.length - 1];
  }

  const direction =
    key === "ArrowDown" || key === "ArrowRight"
      ? 1
      : key === "ArrowUp" || key === "ArrowLeft"
        ? -1
        : 0;

  if (direction === 0) {
    return undefined;
  }

  const nextIndex =
    (currentIndex + direction + SETTINGS_CATEGORY_IDS.length) % SETTINGS_CATEGORY_IDS.length;

  return SETTINGS_CATEGORY_IDS[nextIndex];
}
