import type { ImportIssue } from "../import-export/ImportIssue";
import type { VocabularySchemaVersion } from "../vocabulary/VocabularySchemaVersion";

/** Input used to build a provider-independent repair instruction locally. */
export interface CorrectionInstructionInput {
  readonly targetWord: string;
  readonly vocabularySchemaVersion: VocabularySchemaVersion;
  readonly originalJson: string;
  readonly issues: readonly ImportIssue[];
}
