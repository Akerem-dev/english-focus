import { Button } from "../../../components";

export interface SearchSuggestionsProps {
  readonly suggestions: readonly string[];
  readonly onSelect: (word: string) => void;
}

export function SearchSuggestions({ onSelect, suggestions }: SearchSuggestionsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="search-suggestions" aria-label="Suggested vocabulary words">
      <span>Did you mean</span>
      <div>
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion}
            onClick={() => {
              onSelect(suggestion);
            }}
            size="small"
            variant="secondary"
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
}
