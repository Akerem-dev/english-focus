import type { DiagnosticCheck, DiagnosticCheckStatus, DiagnosticReport } from "@platform/domain";

import { Button } from "../../../components";
import { AppIcon } from "../../../design-system";

const FRIENDLY_CHECK_TITLES: Readonly<Record<string, string>> = Object.freeze({
  "sqlite-integrity": "App data files",
  "schema-objects": "Required app storage",
  "schema-version": "App data compatibility",
  "database-pragmas": "Data protection settings",
  "data-consistency": "Saved data",
  "backup-availability": "Backup availability"
});

function checkStatusLabel(status: DiagnosticCheckStatus): string {
  return status === "passed" ? "Good" : status === "warning" ? "Check" : "Problem";
}

function checkTone(status: DiagnosticCheckStatus): "good" | "check" | "problem" {
  return status === "passed" ? "good" : status === "warning" ? "check" : "problem";
}

function friendlyCheckTitle(check: DiagnosticCheck): string {
  return FRIENDLY_CHECK_TITLES[check.id] ?? "App check";
}

function formatGeneratedAt(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

interface DiagnosticTechnicalDetailsProps {
  readonly copyStatus: "idle" | "copied" | "failed";
  readonly onCopy: () => void;
  readonly report: DiagnosticReport;
}

export function DiagnosticTechnicalDetails({
  copyStatus,
  onCopy,
  report
}: DiagnosticTechnicalDetailsProps) {
  return (
    <details className="diagnostics-technical-details">
      <summary>
        <span className="diagnostics-technical-details__trigger">
          <span>View check details</span>
          <AppIcon name="chevron-down" size={16} />
        </span>
        <small>Checked {formatGeneratedAt(report.generatedAt)}</small>
      </summary>
      <div className="diagnostics-technical-details__body">
        <div className="diagnostics-technical-details__actions">
          <p>
            These details are mainly useful for troubleshooting or support. No action is required
            when the summary above says everything looks good.
          </p>
          <Button
            leadingIcon={<AppIcon name="copy" size={16} />}
            onClick={onCopy}
            size="small"
            variant="secondary"
          >
            {copyStatus === "copied"
              ? "Report copied"
              : copyStatus === "failed"
                ? "Could not copy"
                : "Copy report"}
          </Button>
        </div>

        <dl className="diagnostics-technical-counts">
          <div>
            <dt>Saved words</dt>
            <dd>{report.counts.vocabularyEntries}</dd>
          </div>
          <div>
            <dt>Favorites, tags & notes</dt>
            <dd>{report.counts.vocabularyMetadata}</dd>
          </div>
          <div>
            <dt>Saved backups</dt>
            <dd>{report.counts.retainedBackups}</dd>
          </div>
          <div>
            <dt>App version</dt>
            <dd>{report.appVersion}</dd>
          </div>
        </dl>

        <div className="diagnostics-technical-checks">
          {report.checks.map((check) => (
            <details key={check.id}>
              <summary>
                <span>{friendlyCheckTitle(check)}</span>
                <strong data-tone={checkTone(check.status)}>
                  {checkStatusLabel(check.status)}
                </strong>
              </summary>
              <div>
                <p>{check.summary}</p>
                {check.details.length === 0 ? null : (
                  <ul>
                    {check.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>
    </details>
  );
}
