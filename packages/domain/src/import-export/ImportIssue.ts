export type ImportIssueSeverity = "error" | "warning";
export type ImportIssueSource = "schema" | "semantic" | "quality";

/** A stable, UI-ready issue emitted by the local import pipeline. */
export interface ImportIssue {
  readonly source: ImportIssueSource;
  readonly severity: ImportIssueSeverity;
  readonly code: string;
  readonly path: readonly (string | number)[];
  readonly pathText: string;
  readonly message: string;
}
