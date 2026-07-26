import { useEffect, useId, useRef, useState } from "react";
import type { VocabularyEntry, VocabularyUserMetadata } from "@platform/domain";

import { Button, CefrBadge, StatusBadge, TagChip } from "../../../components";
import { AppIcon } from "../../../design-system";
import { presentVocabularyEntry } from "../presenters/VocabularyEntryPresenter";

interface VocabularyHeaderProps {
  readonly entry: VocabularyEntry;
  readonly metadata?: VocabularyUserMetadata | undefined;
  readonly backLabel?: string;
  readonly onBack: () => void;
  readonly onEditEntry: () => void;
  readonly onEditMetadata: () => void;
  readonly onImportReplacement: () => void;
  readonly onExport: () => void;
}

export function VocabularyHeader({
  backLabel = "Back to vocabulary",
  entry,
  metadata,
  onBack,
  onEditEntry,
  onEditMetadata,
  onExport,
  onImportReplacement
}: VocabularyHeaderProps) {
  const presentation = presentVocabularyEntry(entry);
  const advancedMenuId = useId();
  const advancedMenuRef = useRef<HTMLDivElement>(null);
  const advancedTriggerRef = useRef<HTMLButtonElement>(null);
  const [advancedMenuOpen, setAdvancedMenuOpen] = useState(false);

  useEffect(() => {
    if (!advancedMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !advancedMenuRef.current?.contains(event.target) &&
        !advancedTriggerRef.current?.contains(event.target)
      ) {
        setAdvancedMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setAdvancedMenuOpen(false);
      advancedTriggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [advancedMenuOpen]);

  function runAdvancedAction(action: () => void) {
    setAdvancedMenuOpen(false);
    action();
  }

  return (
    <header className="vocabulary-detail-header">
      <Button className="vocabulary-detail-header__back" onClick={onBack} variant="ghost">
        ← {backLabel}
      </Button>

      <div className="vocabulary-detail-header__title-row">
        <div>
          <p className="route-page__eyebrow">Local vocabulary entry</p>
          <h1 className="word-title">{entry.word}</h1>
          <p className="vocabulary-detail-header__translation">{presentation.primaryTranslation}</p>
        </div>
        <div className="vocabulary-detail-header__source">
          <span>{presentation.sourceLabel}</span>
          <div className="vocabulary-detail-header__actions">
            <Button
              leadingIcon={<AppIcon name="settings" size={16} />}
              onClick={onEditEntry}
              size="small"
              variant="primary"
            >
              Edit entry
            </Button>
            <Button
              leadingIcon={<AppIcon name="star" size={16} />}
              onClick={onEditMetadata}
              size="small"
              variant={metadata?.favorite === true ? "primary" : "secondary"}
            >
              {metadata?.favorite === true ? "Favorited" : "Personal details"}
            </Button>
            <div className="vocabulary-advanced-menu">
              <Button
                aria-controls={advancedMenuId}
                aria-expanded={advancedMenuOpen}
                aria-haspopup="menu"
                leadingIcon={<AppIcon name="chevron-down" size={16} />}
                onClick={() => setAdvancedMenuOpen((current) => !current)}
                ref={advancedTriggerRef}
                size="small"
                title="Advanced entry tools"
                variant="ghost"
              >
                Advanced
              </Button>
              <div
                className="vocabulary-advanced-menu__surface"
                data-open={advancedMenuOpen || undefined}
                id={advancedMenuId}
                ref={advancedMenuRef}
                role="menu"
              >
                <p className="vocabulary-advanced-menu__eyebrow">Advanced JSON tools</p>
                <button
                  onClick={() => runAdvancedAction(onExport)}
                  role="menuitem"
                  type="button"
                >
                  <AppIcon name="download" size={17} />
                  <span>
                    <strong>Export entry JSON</strong>
                    <small>Save this complete entry as a local file.</small>
                  </span>
                </button>
                <button
                  onClick={() => runAdvancedAction(onImportReplacement)}
                  role="menuitem"
                  type="button"
                >
                  <AppIcon name="upload" size={17} />
                  <span>
                    <strong>Replace from JSON</strong>
                    <small>Validate an externally prepared replacement before saving.</small>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="vocabulary-detail-header__metadata" aria-label="Vocabulary metadata">
        <CefrBadge level={entry.cefr} />
        <StatusBadge>{presentation.partOfSpeechLabel}</StatusBadge>
        {presentation.registerLabels.map((register) => (
          <TagChip key={register}>{register}</TagChip>
        ))}
        {metadata?.tags.slice(0, 4).map((tag) => (
          <TagChip key={tag.id}>{tag.name}</TagChip>
        ))}
      </div>
    </header>
  );
}
