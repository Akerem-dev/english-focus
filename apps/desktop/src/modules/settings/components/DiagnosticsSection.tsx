import { useMemo, useState } from "react";
import type {
  DiagnosticCheckStatus,
  DiagnosticOverallStatus,
  DiagnosticReport,
  DiagnosticsRepository
} from "@platform/domain";

import { Button, StatusBadge } from "../../../components";
import { AppIcon } from "../../../design-system";
import { TauriDiagnosticsRepository } from "../../../infrastructure/persistence";
import { publishActivity } from "../../history";
import {
  createDiagnosticSummary,
  runDiagnostics,
  runSafeMaintenance
} from "../application";

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
  const repository = useMemo(
    () => providedRepository ?? new TauriDiagnosticsRepository(),
    [providedRepository]
  );
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
        label: "Local diagnostics completed"
      });
      setReport(nextReport);
      setStatus("ready");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Diagnostics could not be completed.");
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
      setError(cause instanceof Error ? cause.message : "Safe maintenance could not be completed.");
      setStatus("error");
    }
  }

  async function handleCopySummary() {
    if (report === undefined) {
      return;
    }

    try {
      await navigator.clipboard.writeText(createDiagnosticSummary(report));
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  return (
    <div className="diagnostics-section">
      <div className="diagnostics-intro">
        <div>
          <strong>Local database health</strong>
          <p>
            Scan SQLite integrity, schema objects, stored JSON, recovery readiness, and local data
            consistency. No vocabulary content is uploaded.
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
          {report === undefined ? "Run diagnostics" : "Run diagnostics again"}
        </Button>
      </div>

      {error === undefined ? null : (
        <div className="diagnostics-error" role="alert">
          <AppIcon name="warning" size={20} />
          <div>
            <strong>Diagnostics needs attention</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {report === undefined ? (
        <div className="diagnostics-empty">
          <AppIcon name="settings" size={26} />
          <div>
            <strong>No diagnostic scan has been run in this session.</strong>
            <p>The scan is read-only until you explicitly approve safe maintenance.</p>
          </div>
        </div>
      ) : (
        <>
          <section className="diagnostics-overview" data-status={report.overallStatus}>
            <div className="diagnostics-overview__icon" aria-hidden="true">
              <AppIcon
                name={report.overallStatus === "healthy" ? "check" : "warning"}
                size={22}
              />
            </div>
            <div>
              <div className="diagnostics-overview__heading">
                <h3>
                  {report.overallStatus === "healthy"
                    ? "Local storage is healthy"
                    : report.overallStatus === "attention"
                      ? "Local storage needs minor attention"
                      : "Local storage needs recovery attention"}
                </h3>
                <StatusBadge tone={overallTone(report.overallStatus)}>
                  {report.overallStatus}
                </StatusBadge>
              </div>
              <p>
                Generated {formatGeneratedAt(report.generatedAt)} · app {report.appVersion} · database
                schema {report.databaseSchemaVersion}
              </p>
            </div>
          </section>

          <div className="diagnostics-counts" aria-label="Diagnostic record counts">
            <article>
              <span>Vocabulary</span>
              <strong>{report.counts.vocabularyEntries}</strong>
              <small>user and override records</small>
            </article>
            <article>
              <span>Study metadata</span>
              <strong>{report.counts.vocabularyMetadata}</strong>
              <small>favorite, tags, notes, and progress</small>
            </article>
            <article>
              <span>Backups</span>
              <strong>{report.counts.retainedBackups}</strong>
              <small>retained recovery files</small>
            </article>
            <article>
              <span>Consistency issues</span>
              <strong>
                {report.counts.invalidVocabularyJson +
                  report.counts.invalidMetadataJson +
                  report.counts.invalidSettingsJson +
                  report.counts.normalizedWordMismatches}
              </strong>
              <small>invalid JSON or identity mismatches</small>
            </article>
          </div>

          <section className="diagnostics-checks" aria-labelledby="diagnostic-checks-heading">
            <header>
              <div>
                <h3 id="diagnostic-checks-heading">Health checks</h3>
                <p>Every result comes from the local Tauri and SQLite runtime.</p>
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
                  ? "Summary copied"
                  : copyStatus === "failed"
                    ? "Copy blocked"
                    : "Copy summary"}
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
                      <strong>{check.title}</strong>
                      <StatusBadge tone={badgeTone(check.status)}>{check.status}</StatusBadge>
                    </div>
                    <p>{check.summary}</p>
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
            <h3>Recommended next actions</h3>
            <ol>
              {report.recommendations.map((recommendation) => (
                <li key={recommendation}>{recommendation}</li>
              ))}
            </ol>
          </section>

          <section className="diagnostics-maintenance">
            <div>
              <p className="route-page__eyebrow">Non-destructive maintenance</p>
              <h3>Reapply safe database maintenance</h3>
              <p>
                This can recreate missing schema objects, restore SQLite safety settings, and run
                query-planner optimization. It never deletes vocabulary, metadata, settings, or
                backups.
              </p>
            </div>

            {nonRepairableFailures.length === 0 ? null : (
              <div className="diagnostics-maintenance__boundary">
                <AppIcon name="warning" size={18} />
                <p>
                  {nonRepairableFailures.length} critical consistency result(s) cannot be repaired
                  automatically. Validate and restore a retained backup instead.
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
                <strong>I understand this maintenance is non-destructive.</strong>
                <small>
                  It repairs schema and SQLite configuration only; it does not rewrite corrupt
                  vocabulary content.
                </small>
              </span>
            </label>

            <div className="diagnostics-maintenance__footer">
              <span>
                {repairableIssues.length === 0
                  ? "No repairable schema or SQLite configuration issue was found."
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
                Run safe maintenance
              </Button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
