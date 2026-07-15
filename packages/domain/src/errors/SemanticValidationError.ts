import type { ImportIssue } from "../import-export/ImportIssue";

/** Raised by callers that prefer exception-based handling for blocking semantic import issues. */
export class SemanticValidationError extends Error {
  readonly issues: readonly ImportIssue[];

  constructor(issues: readonly ImportIssue[], message = "Vocabulary semantic validation failed.") {
    super(message);
    this.name = "SemanticValidationError";
    this.issues = Object.freeze([...issues]);
  }
}
