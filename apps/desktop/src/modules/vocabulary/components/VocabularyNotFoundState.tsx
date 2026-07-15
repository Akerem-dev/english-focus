import { Button } from "../../../components";
import { AppIcon } from "../../../design-system";
import { SearchSuggestions } from "../../search";

export interface VocabularyNotFoundStateProps {
  readonly normalizedQuery: string;
  readonly onEditSearch: () => void;
  readonly onOpenInstruction: () => void;
  readonly onSelectSuggestion: (word: string) => void;
  readonly suggestions: readonly string[];
}

export function VocabularyNotFoundState({
  normalizedQuery,
  onEditSearch,
  onOpenInstruction,
  onSelectSuggestion,
  suggestions
}: VocabularyNotFoundStateProps) {
  return (
    <section className="vocabulary-result-state" aria-labelledby="not-found-title">
      <span className="vocabulary-result-state__icon" aria-hidden="true">
        <AppIcon name="search" size={24} />
      </span>
      <div>
        <p className="route-page__eyebrow">Not in your local library</p>
        <h2 id="not-found-title">“{normalizedQuery}” was not found</h2>
        <p>
          The search was valid, but no exact entry, alias, or inflected form exists in the current
          local content source.
        </p>

        <SearchSuggestions suggestions={suggestions} onSelect={onSelectSuggestion} />

        <div className="vocabulary-result-state__actions">
          <Button onClick={onEditSearch} variant="secondary">
            Edit search
          </Button>
          <Button
            leadingIcon={<AppIcon name="copy" size={17} />}
            onClick={onOpenInstruction}
            variant="primary"
          >
            Copy AI instruction
          </Button>
          <Button disabled title="Available in the JSON ingestion checkpoint" variant="secondary">
            Paste generated JSON
          </Button>
        </div>
        <small>
          The instruction is generated locally and can be pasted into any external AI account. JSON
          ingestion arrives in the next approved roadmap phase.
        </small>
      </div>
    </section>
  );
}
