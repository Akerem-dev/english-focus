import type { ImportIssue } from "@platform/domain";
import { useId } from "react";

import { AppIcon } from "../../design-system";

export interface ValidationIssueListProps {
  readonly issues: readonly ImportIssue[];
  readonly heading?: string;
  readonly showTechnicalDetails?: boolean;
  readonly formatMessage?: ((issue: ImportIssue) => string) | undefined;
}

export function ValidationIssueList({
  formatMessage,
  heading = "Validation issues",
  issues,
  showTechnicalDetails = true
}: ValidationIssueListProps) {
  const headingId = useId();
  const tone = issues.some((issue) => issue.severity === "error") ? "danger" : "warning";

  if (issues.length === 0) {
    return null;
  }

  return (
    <section className="validation-issue-list" aria-labelledby={headingId} data-tone={tone}>
      <header className="validation-issue-list__header">
        <h3 id={headingId}>{heading}</h3>
        <span>{issues.length}</span>
      </header>
      <ol>
        {issues.map((issue, index) => (
          <li data-severity={issue.severity} key={`${issue.pathText}-${issue.code}-${index}`}>
            <span aria-hidden="true" className="validation-issue-list__icon">
              <AppIcon name="warning" size={17} />
            </span>
            <div>
              {showTechnicalDetails ? <code>{issue.pathText}</code> : null}
              <p>{formatMessage?.(issue) ?? issue.message}</p>
              {showTechnicalDetails ? (
                <small>
                  {issue.source} · {issue.severity} · {issue.code}
                </small>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
