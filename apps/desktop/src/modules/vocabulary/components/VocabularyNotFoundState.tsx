import { Button } from "../../../components";
import { AppIcon } from "../../../design-system";
import { SearchSuggestions } from "../../search";

export interface VocabularyNotFoundStateProps {
  readonly normalizedQuery: string;
  readonly canCreateEntry: boolean;
  readonly onEditSearch: () => void;
  readonly onOpenAssistant: () => void;
  readonly onSelectSuggestion: (word: string) => void;
  readonly suggestions: readonly string[];
}

export function VocabularyNotFoundState({
  canCreateEntry,
  normalizedQuery,
  onEditSearch,
  onOpenAssistant,
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
          This word is not in your local collection yet. You can edit the search, try a suggestion,
          or let the word helper prepare it for review.
        </p>

        <SearchSuggestions suggestions={suggestions} onSelect={onSelectSuggestion} />

        <div className="vocabulary-result-state__actions">
          <Button onClick={onEditSearch} variant="secondary">
            Edit search
          </Button>
          {canCreateEntry ? (
            <Button
              leadingIcon={<AppIcon name="book-open" size={17} />}
              onClick={onOpenAssistant}
              variant="primary"
            >
              Prepare this word
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
