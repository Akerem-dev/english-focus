import { Button } from "../../../components";
import { AppIcon } from "../../../design-system";
import type { DiagnosticHealthPresentation } from "../application";

interface DiagnosticHealthResultProps {
  readonly onRepair: () => void;
  readonly presentation: DiagnosticHealthPresentation;
  readonly repairing: boolean;
}

function factIconName(tone: DiagnosticHealthPresentation["facts"][number]["tone"]) {
  if (tone === "good") {
    return "check";
  }

  if (tone === "neutral") {
    return "download";
  }

  return "warning";
}

export function DiagnosticHealthResult({
  onRepair,
  presentation,
  repairing
}: DiagnosticHealthResultProps) {
  return (
    <>
      <section
        aria-live="polite"
        className="diagnostics-health-summary"
        data-status={presentation.status}
      >
        <span aria-hidden="true" className="diagnostics-health-summary__icon">
          <AppIcon name={presentation.status === "healthy" ? "check" : "warning"} size={23} />
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
              <AppIcon name={factIconName(fact.tone)} size={16} />
            </span>
            <span>{fact.label}</span>
            <strong>{fact.value}</strong>
          </li>
        ))}
      </ul>

      {presentation.status === "healthy" && presentation.backupState === "missing" ? (
        <section className="diagnostics-backup-recommendation">
          <AppIcon name="download" size={19} />
          <div>
            <strong>Create your first backup</strong>
            <p>
              A backup is optional, but it gives you a recovery point before large imports or major
              edits. Open Data &amp; backups when you are ready.
            </p>
          </div>
        </section>
      ) : null}

      {presentation.repairableIssueCount === 0 ? null : (
        <section className="diagnostics-repair-prompt">
          <div>
            <strong>A safe fix is available</strong>
            <p>
              English Focus can reapply the local storage settings it needs. Your words, notes,
              settings, and backups will not be deleted.
            </p>
          </div>
          <Button
            disabled={repairing}
            isLoading={repairing}
            leadingIcon={<AppIcon name="settings" size={17} />}
            onClick={onRepair}
            variant="secondary"
          >
            Apply safe fix
          </Button>
        </section>
      )}

      {presentation.nonRepairableFailureCount === 0 ? null : presentation.backupState ===
        "available" ? (
        <section className="diagnostics-recovery-guidance">
          <AppIcon name="warning" size={19} />
          <div>
            <strong>Use a checked backup</strong>
            <p>
              This issue cannot be fixed automatically. Open Data &amp; backups and restore the
              newest backup that passes the check.
            </p>
          </div>
        </section>
      ) : (
        <section className="diagnostics-recovery-guidance">
          <AppIcon name="warning" size={19} />
          <div>
            <strong>Review the details before changing data</strong>
            <p>
              No checked backup is available. Avoid resetting the app and copy the check report
              before making further changes.
            </p>
          </div>
        </section>
      )}
    </>
  );
}
