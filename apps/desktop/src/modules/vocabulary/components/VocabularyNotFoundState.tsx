import { Button } from "../../../components";
import { AppIcon } from "../../../design-system";
import { SearchSuggestions } from "../../search";

export interface VocabularyNotFoundStateProps {
  readonly normalizedQuery: string;
  readonly canCreateEntry: boolean;
  readonly onEditSearch: () => void;
  readonly onOpenInstruction: () => void;
  readonly onOpenPasteGeneratedJson: () => void;
  readonly onSelectSuggestion: (word: string) => void;
  readonly suggestions: readonly string[];
}

export function VocabularyNotFoundState({
  canCreateEntry,
  normalizedQuery,
  onEditSearch,
  onOpenInstruction,
  onOpenPasteGeneratedJson,
  onSelectSuggestion,
  suggestions
}: VocabularyNotFoundStateProps) {
  return (
    <section className="vocabulary-result-state" aria-labelledby="not-found-title">
      <span className="vocabulary-result-state__icon" aria-hidden="true">
        <AppIcon name="search" size={24} />
      </span>
      <div>
        <p className="route-page__eyebrow">No local match</p>
        <h2 id="not-found-title">“{normalizedQuery}” was not found</h2>
        <p>
          No exact word, form, prefix, translation, definition, personal tag, or note matched this
          search.
        </p>

        <SearchSuggestions suggestions={suggestions} onSelect={onSelectSuggestion} />

        <div className="vocabulary-result-state__actions">
          <Button onClick={onEditSearch} variant="secondary">
            Edit search
          </Button>
          {canCreateEntry ? (
            <>
              <Button
                leadingIcon={<AppIcon name="copy" size={17} />}
                onClick={onOpenInstruction}
                variant="primary"
              >
                Copy AI instruction
              </Button>
              <Button onClick={onOpenPasteGeneratedJson} variant="secondary">
                Paste generated JSON
              </Button>
            </>
          ) : null}
        </div>
        {canCreateEntry ? (
          <small>
            The instruction and pasted JSON remain local. Syntax, schema, semantic, quality, and
            explicit preview gates run before any later save.
          </small>
        ) : null}
      </div>
    </section>
  );
}
