import type { FormEvent, RefObject } from "react";

import type { VocabularySearchState } from "../../search/state";
import {
  SearchRebuildView,
  type SearchRebuildActivityItem
} from "../../search-rebuild";

export type VocabularyActivityItem = SearchRebuildActivityItem;

interface VocabularyLookupViewProps {
  readonly query: string;
  readonly state: Exclude<VocabularySearchState, { kind: "found" }>;
  readonly searchInputRef: RefObject<HTMLInputElement | null>;
  readonly recentSearches: readonly VocabularyActivityItem[];
  readonly recentAdditions: readonly VocabularyActivityItem[];
  readonly popularSearches: readonly string[];
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly onQueryChange: (query: string) => void;
  readonly onClear: () => void;
  readonly onEditSearch: () => void;
  readonly onSearch: (query: string) => void;
}

export function VocabularyLookupView(props: VocabularyLookupViewProps) {
  return <SearchRebuildView {...props} />;
}
