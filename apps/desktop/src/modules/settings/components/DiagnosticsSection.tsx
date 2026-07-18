import { useState } from "react";
import type { DiagnosticReport, DiagnosticsRepository } from "@platform/domain";

import { Button } from "../../../components";
import { useClipboard, useMaintenance } from "../../../app/providers";
import { AppIcon } from "../../../design-system";
import { publishActivity } from "../../history";
import {
  createDiagnosticSummary,
  presentDiagnosticHealth,
  runDiagnostics,
  runSafeMaintenance
} from "../application";
import { DiagnosticHealthResult } from "./DiagnosticHealthResult";
import { DiagnosticTechnicalDetails } from "./DiagnosticTechnicalDetails";

interface DiagnosticsSectionProps {
  readonly repository?: DiagnosticsRepository;
}

type DiagnosticsStatus = "idle" | "running" | "ready" | "maintaining" | "error";

export function DiagnosticsSection({ repository: providedRepository }: DiagnosticsSectionProps) {
  const clipboard = useClipboard();
  const { diagnosticsRepository } = useMaintenance();
  const repository = providedRepository ?? diagnosticsRepository;
  const [status, setStatus] = useState<DiagnosticsStatus>("idle");
  const [report, setReport] = useState<DiagnosticReport | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function handleRunDiagnostics() {
    setStatus("running");
    setError(undefined);
    setCopyStatus("idle");

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
      setStatus("ready");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The safe fix could not be completed.");
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
          <strong>Check your app</strong>
          <p>
            English Focus checks your words, settings, and backups on this device. It does not
            upload or change anything.
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
          {report === undefined ? "Check now" : "Check again"}
        </Button>
      </div>

      {error === undefined ? null : (
        <section className="diagnostics-error" role="alert">
          <AppIcon name="warning" size={20} />
          <div>
            <strong>The check could not finish</strong>
            <p>Try again. Your existing words and settings have not been changed.</p>
            <details>
              <summary>Technical details</summary>
              <pre>{error}</pre>
            </details>
          </div>
        </section>
      )}

      {report === undefined ? (
        <div className="diagnostics-empty">
          <AppIcon name="settings" size={24} />
          <div>
            <strong>No check has been run yet</strong>
            <p>The check is read-only and usually takes only a moment.</p>
          </div>
        </div>
      ) : (
        <>
          <DiagnosticHealthResult
            onRepair={() => {
              void handleSafeMaintenance();
            }}
            presentation={presentDiagnosticHealth(report)}
            repairing={status === "maintaining"}
            report={report}
          />
          <DiagnosticTechnicalDetails
            copyStatus={copyStatus}
            onCopy={() => {
              void handleCopySummary();
            }}
            report={report}
          />
        </>
      )}
    </div>
  );
}
