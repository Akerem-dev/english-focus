import { useState } from "react";
import type {
  DiagnosticCheck,
  DiagnosticOverallStatus,
  DiagnosticReport,
  DiagnosticsRepository
} from "@platform/domain";

import { Button } from "../../../components";
import { useClipboard, useMaintenance } from "../../../app/providers";
import { AppIcon } from "../../../design-system";
import { publishActivity } from "../../history";
import { createDiagnosticSummary, runDiagnostics, runSafeMaintenance } from "../application";

interface DiagnosticsSectionProps {
  readonly repository?: DiagnosticsRepository;
  readonly showHeading?: boolean;
}

type DiagnosticsStatus = "idle" | "running" | "ready" | "maintaining" | "error";

const FRIENDLY_CHECK_COPY: Readonly<
  Record<
    string,
    {
      readonly title: string;
      readonly passed: string;
      readonly warning: string;
      readonly failed: string;
    }
  >
> = Object.freeze({
  "sqlite-integrity": {
    title: "App data files",
    passed: "Your local data files can be read normally.",
    warning: "One local data file may need attention.",
    failed: "A local data file could not be read safely."
  },
  "schema-objects": {
    title: "Required app storage",
    passed: "Everything English Focus needs is available.",
    warning: "A required storage item may need to be restored.",
    failed: "A required storage item is missing."
  },
  "schema-version": {
    title: "App data compatibility",
    passed: "Your saved data matches this version of English Focus.",
    warning: "Your saved data needs a small compatibility update.",
    failed: "Your saved data is not compatible with this version."
  },
  "database-pragmas": {
    title: "Data protection",
    passed: "Recommended local protection is active.",
    warning: "A local protection setting should be reapplied.",
    failed: "A local protection setting is unavailable."
  },
  "data-consistency": {
    title: "Saved information",
    passed: "Your words, notes, and settings passed the local checks.",
    warning: "Some saved information should be reviewed.",
    failed: "Some saved information could not be verified."
  },
  "backup-availability": {
    title: "Backup availability",
    passed: "At least one backup is available on this device.",
    warning: "No backup is currently available.",
    failed: "Backups could not be checked."
  }
});

function friendlyDiagnosticCheck(check: DiagnosticCheck) {
  const copy = FRIENDLY_CHECK_COPY[check.id];

  if (copy === undefined) {
    return {
      title: "App check",
      summary: check.status === "passed" ? "This check passed." : "This check needs attention."
    };
  }

  return {
    title: copy.title,
    summary:
      check.status === "passed"
        ? copy.passed
        : check.status === "warning"
          ? copy.warning
          : copy.failed
  };
}

function diagnosticStatusLabel(status: DiagnosticCheck["status"]): string {
  return status === "passed" ? "Good" : status === "warning" ? "Check" : "Problem";
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

function outcomeCopy(status: DiagnosticOverallStatus) {
  if (status === "healthy") {
    return {
      title: "Everything looks good",
      description: "Your words, settings, and backups are available. No action is needed."
    };
  }

  if (status === "attention") {
    return {
      title: "A small issue was found",
      description: "Your data is still available. Review the suggested action below."
    };
  }

  return {
    title: "A problem needs attention",
    description: "Keep the app open and follow the recovery guidance before making more changes."
  };
}

function issueCount(report: DiagnosticReport): number {
  return (
    report.counts.invalidVocabularyJson +
    report.counts.invalidMetadataJson +
    report.counts.invalidSettingsJson +
    report.counts.normalizedWordMismatches
  );
}

function recommendedAction(
  report: DiagnosticReport,
  repairableIssues: readonly DiagnosticCheck[],
  nonRepairableFailures: readonly DiagnosticCheck[]
): string {
  if (nonRepairableFailures.length > 0) {
    return "Restore a checked backup";
  }

  if (repairableIssues.length > 0) {
    return "Safe repair available";
  }

  if (report.overallStatus === "healthy") {
    return "No action needed";
  }

  return "Review technical details";
}

export function DiagnosticsSection({
  repository: providedRepository,
  showHeading = true
}: DiagnosticsSectionProps) {
  const clipboard = useClipboard();
  const { diagnosticsRepository } = useMaintenance();
  const repository = providedRepository ?? diagnosticsRepository;
  const [status, setStatus] = useState<DiagnosticsStatus>("idle");
  const [report, setReport] = useState<DiagnosticReport | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [maintenanceConfirmed, setMaintenanceConfirmed] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  const repairableIssues = report?.checks.filter((check) => check.repairable) ?? [];
  const nonRepairableFailures =
    report?.checks.filter((check) => check.status === "failed" && !check.repairable) ?? [];

  async function handleRunDiagnostics() {
    setStatus("running");
    setError(undefined);
    setMaintenanceConfirmed(false);

    try {
      const nextReport = await runDiagnostics(repository);
      publishActivity({
        kind: "diagnostics-run",
        scope: "settings",
        label: "App health check completed"
      });
      setReport(nextReport);
      setStatus("ready");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "The app health check could not be completed."
      );
      setStatus("error");
    }
  }

  async function handleSafeMaintenance() {
    setStatus("maintaining");
    setError(undefined);

    try {
      const result = await runSafeMaintenance(repository);
      setReport(result.report);
      setMaintenanceConfirmed(false);
      setStatus("ready");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The safe repair could not be completed.");
      setStatus("error");
    }
  }

  async function handleCopySummary() {
    if (report === undefined) {
      return;
    }

    try {
      await clipboard.writeText(createDiagnosticSummary(report));
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  return (
    <div className="diagnostics-section">
      <div className="diagnostics-toolbar">
        <div>
          {showHeading ? <strong>App health</strong> : null}
          <p>This check reads local information only. It does not change or upload anything.</p>
        </div>
        <Button
          isLoading={status === "running"}
          leadingIcon={<AppIcon name="search" size={17} />}
          onClick={() => {
            void handleRunDiagnostics();
          }}
          variant="primary"
        >
          {report === undefined ? "Check app health" : "Check again"}
        </Button>
      </div>

      {error === undefined ? null : (
        <div className="diagnostics-error" role="alert">
          <AppIcon name="warning" size={20} />
          <div>
            <strong>The check could not finish</strong>
            <p>Nothing was changed. Try again, or open the technical details for support.</p>
            <details className="diagnostics-technical-error">
              <summary>Technical details</summary>
              <pre>{error}</pre>
            </details>
          </div>
        </div>
      )}

      {report === undefined ? (
        <div className="diagnostics-empty">
          <AppIcon name="check" size={22} />
          <div>
            <strong>No check has been run yet</strong>
            <p>Run a quick local check whenever something does not look right.</p>
          </div>
        </div>
      ) : (
        <>
          <section className="diagnostics-summary" data-status={report.overallStatus}>
            <span className="diagnostics-summary__icon" aria-hidden="true">
              <AppIcon name={report.overallStatus === "healthy" ? "check" : "warning"} size={22} />
            </span>
            <div>
              <h3>{outcomeCopy(report.overallStatus).title}</h3>
              <p>{outcomeCopy(report.overallStatus).description}</p>
              <small>Checked {formatGeneratedAt(report.generatedAt)}</small>
            </div>
          </section>

          <dl className="diagnostics-summary-list">
            <div>
              <dt>Saved information</dt>
              <dd>
                {issueCount(report) === 0 ? "Ready" : `${issueCount(report)} item(s) to review`}
              </dd>
            </div>
            <div>
              <dt>Backups</dt>
              <dd>{report.counts.retainedBackups > 0 ? "Available" : "Not available"}</dd>
            </div>
            <div>
              <dt>Recommended action</dt>
              <dd>{recommendedAction(report, repairableIssues, nonRepairableFailures)}</dd>
            </div>
          </dl>

          {nonRepairableFailures.length === 0 ? null : (
            <div className="diagnostics-guidance" role="alert">
              <AppIcon name="warning" size={18} />
              <div>
                <strong>Use a checked backup</strong>
                <p>
                  This issue cannot be fixed automatically. Open Data & backups and restore the
                  newest backup that passes its check.
                </p>
              </div>
            </div>
          )}

          {repairableIssues.length === 0 ? null : (
            <section className="diagnostics-repair">
              <div>
                <h3>Fix this safely</h3>
                <p>
                  English Focus can restore the app storage it needs. Your words, notes, settings,
                  and backups are not deleted.
                </p>
              </div>
              <label>
                <input
                  checked={maintenanceConfirmed}
                  disabled={status === "maintaining"}
                  onChange={(event) => {
                    setMaintenanceConfirmed(event.currentTarget.checked);
                  }}
                  type="checkbox"
                />
                <span>I understand this repair does not remove my data.</span>
              </label>
              <Button
                disabled={!maintenanceConfirmed}
                isLoading={status === "maintaining"}
                leadingIcon={<AppIcon name="settings" size={17} />}
                onClick={() => {
                  void handleSafeMaintenance();
                }}
                variant="secondary"
              >
                Fix issue
              </Button>
            </section>
          )}

          <details className="diagnostics-technical">
            <summary>Technical details</summary>
            <div className="diagnostics-technical__body">
              <header>
                <div>
                  <strong>Local check report</strong>
                  <p>
                    English Focus {report.appVersion} · {report.checks.length} checks
                  </p>
                </div>
                <Button
                  leadingIcon={<AppIcon name="copy" size={16} />}
                  onClick={() => {
                    void handleCopySummary();
                  }}
                  size="small"
                  variant="secondary"
                >
                  {copyStatus === "copied"
                    ? "Report copied"
                    : copyStatus === "failed"
                      ? "Could not copy"
                      : "Copy report"}
                </Button>
              </header>

              <div className="diagnostics-technical__checks">
                {report.checks.map((check) => {
                  const friendlyCheck = friendlyDiagnosticCheck(check);

                  return (
                    <article key={check.id}>
                      <span aria-hidden="true">
                        <AppIcon name={check.status === "passed" ? "check" : "warning"} size={16} />
                      </span>
                      <div>
                        <strong>{friendlyCheck.title}</strong>
                        <p>{friendlyCheck.summary}</p>
                        {check.details.length === 0 ? null : (
                          <details className="diagnostics-technical__notes">
                            <summary>Show check notes</summary>
                            <ul>
                              {check.details.map((detail) => (
                                <li key={detail}>{detail}</li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </div>
                      <small data-status={check.status}>
                        {diagnosticStatusLabel(check.status)}
                      </small>
                    </article>
                  );
                })}
              </div>
            </div>
          </details>
        </>
      )}
    </div>
  );
}
