import { useState } from "react";
import type {
  DiagnosticCheck,
  DiagnosticCheckStatus,
  DiagnosticOverallStatus,
  DiagnosticReport,
  DiagnosticsRepository
} from "@platform/domain";

import { Button, StatusBadge } from "../../../components";
import { useClipboard, useMaintenance } from "../../../app/providers";
import { AppIcon } from "../../../design-system";
import { publishActivity } from "../../history";
import { createDiagnosticSummary, runDiagnostics, runSafeMaintenance } from "../application";

interface DiagnosticsSectionProps {
  readonly repository?: DiagnosticsRepository;
}

type DiagnosticsStatus = "idle" | "running" | "ready" | "maintaining" | "error";

function badgeTone(status: DiagnosticCheckStatus) {
  if (status === "passed") {
    return "success" as const;
  }
  if (status === "warning") {
    return "warning" as const;
  }
  return "danger" as const;
}

function overallTone(status: DiagnosticOverallStatus) {
  if (status === "healthy") {
    return "success" as const;
  }
  if (status === "attention") {
    return "warning" as const;
  }
  return "danger" as const;
}

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
    title: "Data protection settings",
    passed: "Recommended local protection settings are active.",
    warning: "A local protection setting should be reapplied.",
    failed: "A local protection setting is unavailable."
  },
  "data-consistency": {
    title: "Saved data",
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

function diagnosticStatusLabel(status: DiagnosticCheckStatus): string {
  return status === "passed" ? "Good" : status === "warning" ? "Check" : "Problem";
}

function friendlyRecommendation(recommendation: string): string {
  if (recommendation.includes("No action")) {
    return "No action is needed.";
  }
  if (recommendation.toLowerCase().includes("maintenance")) {
    return "Use the safe repair option below.";
  }
  if (recommendation.toLowerCase().includes("backup")) {
    return "Open Data & backups and restore the newest backup that passes the check.";
  }
  return "Follow the suggested recovery step or keep a copy of this report for support.";
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

export function DiagnosticsSection({ repository: providedRepository }: DiagnosticsSectionProps) {
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
      <div className="diagnostics-intro">
        <div>
          <strong>App health</strong>
          <p>
            Check whether your local words, settings, and backups are working normally. Nothing is
            uploaded.
          </p>
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
            <strong>The app health check could not finish</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {report === undefined ? (
        <div className="diagnostics-empty">
          <AppIcon name="settings" size={26} />
          <div>
            <strong>No app health check has been run yet.</strong>
            <p>This check only reads local data and does not change anything.</p>
          </div>
        </div>
      ) : (
        <>
          <section className="diagnostics-overview" data-status={report.overallStatus}>
            <div className="diagnostics-overview__icon" aria-hidden="true">
              <AppIcon name={report.overallStatus === "healthy" ? "check" : "warning"} size={22} />
            </div>
            <div>
              <div className="diagnostics-overview__heading">
                <h3>
                  {report.overallStatus === "healthy"
                    ? "Everything looks good"
                    : report.overallStatus === "attention"
                      ? "A small issue was found"
                      : "Action is needed"}
                </h3>
                <StatusBadge tone={overallTone(report.overallStatus)}>
                  {report.overallStatus}
                </StatusBadge>
              </div>
              <p>
                Checked {formatGeneratedAt(report.generatedAt)} · English Focus {report.appVersion}
              </p>
            </div>
          </section>

          <div className="diagnostics-counts" aria-label="Diagnostic record counts">
            <article>
              <span>Saved words</span>
              <strong>{report.counts.vocabularyEntries}</strong>
              <small>words you added or edited</small>
            </article>
            <article>
              <span>Personal learning details</span>
              <strong>{report.counts.vocabularyMetadata}</strong>
              <small>favorites, tags, notes, and progress</small>
            </article>
            <article>
              <span>Backups</span>
              <strong>{report.counts.retainedBackups}</strong>
              <small>saved recovery copies</small>
            </article>
            <article>
              <span>Issues found</span>
              <strong>
                {report.counts.invalidVocabularyJson +
                  report.counts.invalidMetadataJson +
                  report.counts.invalidSettingsJson +
                  report.counts.normalizedWordMismatches}
              </strong>
              <small>saved items that need attention</small>
            </article>
          </div>

          <section className="diagnostics-checks" aria-labelledby="diagnostic-checks-heading">
            <header>
              <div>
                <h3 id="diagnostic-checks-heading">What was checked</h3>
                <p>Detailed results from this device.</p>
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

            <div className="diagnostics-check-list">
              {report.checks.map((check) => (
                <article className="diagnostics-check" data-status={check.status} key={check.id}>
                  <span className="diagnostics-check__icon" aria-hidden="true">
                    <AppIcon name={check.status === "passed" ? "check" : "warning"} size={17} />
                  </span>
                  <div>
                    <div className="diagnostics-check__heading">
                      <strong>{friendlyDiagnosticCheck(check).title}</strong>
                      <StatusBadge tone={badgeTone(check.status)}>
                        {diagnosticStatusLabel(check.status)}
                      </StatusBadge>
                    </div>
                    <p>{friendlyDiagnosticCheck(check).summary}</p>
                    {check.details.length === 0 ? null : (
                      <ul>
                        {check.details.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="diagnostics-recommendations">
            <h3>What to do next</h3>
            <ol>
              {report.recommendations.map((recommendation) => (
                <li key={recommendation}>{friendlyRecommendation(recommendation)}</li>
              ))}
            </ol>
          </section>

          <section className="diagnostics-maintenance">
            <div>
              <p className="route-page__eyebrow">Safe repair</p>
              <h3>Fix app storage</h3>
              <p>
                English Focus can restore missing app storage and recommended protection settings.
                It does not delete your words, notes, settings, or backups.
              </p>
            </div>

            {nonRepairableFailures.length === 0 ? null : (
              <div className="diagnostics-maintenance__boundary">
                <AppIcon name="warning" size={18} />
                <p>
                  {nonRepairableFailures.length} serious issue(s) cannot be fixed automatically.
                  Restore a checked backup instead.
                </p>
              </div>
            )}

            <label className="diagnostics-maintenance__confirmation">
              <input
                checked={maintenanceConfirmed}
                disabled={repairableIssues.length === 0 || status === "maintaining"}
                onChange={(event) => {
                  setMaintenanceConfirmed(event.currentTarget.checked);
                }}
                type="checkbox"
              />
              <span>
                <strong>I understand this repair will not delete my data.</strong>
                <small>It only restores app storage and protection settings.</small>
              </span>
            </label>

            <div className="diagnostics-maintenance__footer">
              <span>
                {repairableIssues.length === 0
                  ? "No issue that can be fixed here was found."
                  : `${repairableIssues.length} repairable issue${repairableIssues.length === 1 ? "" : "s"} detected.`}
              </span>
              <Button
                disabled={!maintenanceConfirmed || repairableIssues.length === 0}
                isLoading={status === "maintaining"}
                leadingIcon={<AppIcon name="settings" size={17} />}
                onClick={() => {
                  void handleSafeMaintenance();
                }}
                variant="secondary"
              >
                Fix issue
              </Button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
