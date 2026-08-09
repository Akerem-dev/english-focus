import type { VocabularyEntry, VocabularyUserMetadata } from "@platform/domain";

import { SearchRebuildFoundView } from "../../search-rebuild";

interface VocabularyFoundStateProps {
  readonly entry: VocabularyEntry;
  readonly metadata?: VocabularyUserMetadata | undefined;
  readonly backLabel?: string | undefined;
  readonly onBack: () => void;
  readonly onEditEntry: () => void;
  readonly onEditMetadata: () => void;
  readonly onToggleFavorite?: (() => void) | undefined;
  readonly onImportReplacement: () => void;
  readonly onExport: () => void;
}

export function VocabularyFoundState(props: VocabularyFoundStateProps) {
  return <SearchRebuildFoundView {...props} />;
}
