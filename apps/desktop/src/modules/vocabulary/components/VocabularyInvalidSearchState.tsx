import { Button, InlineError } from "../../../components";
import { AppIcon } from "../../../design-system";

export interface VocabularyInvalidSearchStateProps {
  readonly message: string;
  readonly onEditSearch: () => void;
}

export function VocabularyInvalidSearchState({
  message,
  onEditSearch
}: VocabularyInvalidSearchStateProps) {
  return (
    <section className="vocabulary-result-state" aria-labelledby="invalid-search-title">
      <span className="vocabulary-result-state__icon" aria-hidden="true">
        <AppIcon name="warning" size={24} />
      </span>
      <div>
        <p className="route-page__eyebrow">Search needs attention</p>
        <h2 id="invalid-search-title">Refine your search</h2>
        <InlineError>{message}</InlineError>
        <p className="vocabulary-result-state__guidance">
          Search a word or a short phrase. Letters, numbers, spaces, apostrophes, and hyphens are
          supported.
        </p>
        <Button onClick={onEditSearch} variant="secondary">
          Edit search
        </Button>
      </div>
    </section>
  );
}
