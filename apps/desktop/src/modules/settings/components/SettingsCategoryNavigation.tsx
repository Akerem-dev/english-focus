import { useRef, type KeyboardEvent } from "react";

import { AppIcon, type AppIconName } from "../../../design-system";
import { resolveSettingsCategoryNavigation, type SettingsCategoryId } from "../application";

interface SettingsCategory {
  readonly id: SettingsCategoryId;
  readonly label: string;
  readonly description: string;
  readonly icon: AppIconName;
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

interface SettingsCategoryNavigationProps {
  readonly onSelect: (category: SettingsCategoryId) => void;
  readonly selectedCategory: SettingsCategoryId;
}

export function SettingsCategoryNavigation({
  onSelect,
  selectedCategory
}: SettingsCategoryNavigationProps) {
  const tabRefs = useRef(new Map<SettingsCategoryId, HTMLButtonElement>());

  function selectAndFocus(category: SettingsCategoryId) {
    onSelect(category);
    window.requestAnimationFrame(() => {
      tabRefs.current.get(category)?.focus();
    });
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    currentCategory: SettingsCategoryId
  ) {
    const nextCategory = resolveSettingsCategoryNavigation(currentCategory, event.key);

    if (nextCategory === undefined) {
      return;
    }

    event.preventDefault();
    selectAndFocus(nextCategory);
  }

  return (
    <nav
      aria-label="Settings categories"
      aria-orientation="vertical"
      className="settings-category-nav"
      role="tablist"
    >
      {SETTINGS_CATEGORIES.map((category) => {
        const active = category.id === selectedCategory;
        const descriptionId = `settings-category-description-${category.id}`;

        return (
          <button
            aria-controls="settings-category-panel"
            aria-describedby={descriptionId}
            aria-selected={active}
            className="settings-category-nav__item"
            data-active={active || undefined}
            id={`settings-category-tab-${category.id}`}
            key={category.id}
            onClick={() => {
              onSelect(category.id);
            }}
            onKeyDown={(event) => {
              handleKeyDown(event, category.id);
            }}
            ref={(element) => {
              if (element === null) {
                tabRefs.current.delete(category.id);
              } else {
                tabRefs.current.set(category.id, element);
              }
            }}
            role="tab"
            tabIndex={active ? 0 : -1}
            type="button"
          >
            <AppIcon name={category.icon} size={19} />
            <strong>{category.label}</strong>
            <span className="sr-only" id={descriptionId}>
              {category.description}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
