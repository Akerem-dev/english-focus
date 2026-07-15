import type { ImportIssue } from "@platform/domain";
import { useId } from "react";

import { AppIcon } from "../../design-system";

export interface ValidationIssueListProps {
  readonly issues: readonly ImportIssue[];
  readonly heading?: string;
}

export function ValidationIssueList({
  heading = "Validation issues",
  issues
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
              <code>{issue.pathText}</code>
              <p>{issue.message}</p>
              <small>
                {issue.source} · {issue.severity} · {issue.code}
              </small>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
