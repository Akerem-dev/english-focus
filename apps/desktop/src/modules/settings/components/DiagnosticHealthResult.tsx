import type { DiagnosticReport } from "@platform/domain";

import { Button } from "../../../components";
import { AppIcon } from "../../../design-system";
import type { DiagnosticHealthPresentation } from "../application";

interface DiagnosticHealthResultProps {
  readonly onRepair: () => void;
  readonly presentation: DiagnosticHealthPresentation;
  readonly report: DiagnosticReport;
  readonly repairing: boolean;
}

export function DiagnosticHealthResult({
  onRepair,
  presentation,
  report,
  repairing
}: DiagnosticHealthResultProps) {
  return (
    <>
      <section
        aria-live="polite"
        className="diagnostics-health-summary"
        data-status={report.overallStatus}
      >
        <span aria-hidden="true" className="diagnostics-health-summary__icon">
          <AppIcon name={report.overallStatus === "healthy" ? "check" : "warning"} size={23} />
        </span>
        <div>
          <h3>{presentation.title}</h3>
          <p>{presentation.description}</p>
        </div>
      </section>

      <ul className="diagnostics-health-facts" aria-label="App health summary">
        {presentation.facts.map((fact) => (
          <li data-tone={fact.tone} key={fact.id}>
            <span aria-hidden="true" className="diagnostics-health-facts__icon">
              <AppIcon name={fact.tone === "good" ? "check" : "warning"} size={16} />
            </span>
            <span>{fact.label}</span>
            <strong>{fact.value}</strong>
          </li>
        ))}
      </ul>

      {presentation.repairableIssueCount === 0 ? null : (
        <section className="diagnostics-repair-prompt">
          <div>
            <strong>A safe fix is available</strong>
            <p>
              English Focus can restore the app storage it needs. Your words, notes, settings, and
              backups will not be deleted.
            </p>
          </div>
          <Button
            disabled={repairing}
            isLoading={repairing}
            leadingIcon={<AppIcon name="settings" size={17} />}
            onClick={onRepair}
            variant="secondary"
          >
            Fix issue
          </Button>
        </section>
      )}

      {presentation.nonRepairableFailureCount === 0 ? null : (
        <section className="diagnostics-recovery-guidance">
          <AppIcon name="warning" size={19} />
          <div>
            <strong>Use a checked backup</strong>
            <p>
              This issue cannot be fixed automatically. Open Data & backups and restore the newest
              backup that passes the check.
            </p>
          </div>
        </section>
      )}
    </>
  );
}
