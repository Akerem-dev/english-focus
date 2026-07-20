import type {
  DiagnosticCheck,
  DiagnosticCheckStatus,
  DiagnosticOverallStatus,
  DiagnosticReport
} from "@platform/domain";

type DiagnosticHealthTone = "good" | "neutral" | "check" | "problem";
export type DiagnosticBackupState = "available" | "missing" | "unavailable";

interface DiagnosticHealthFact {
  readonly id: "data" | "backups" | "next-step";
  readonly label: string;
  readonly value: string;
  readonly tone: DiagnosticHealthTone;
}

export interface DiagnosticHealthPresentation {
  readonly status: DiagnosticOverallStatus;
  readonly backupState: DiagnosticBackupState;
  readonly title: string;
  readonly description: string;
  readonly facts: readonly DiagnosticHealthFact[];
  readonly repairableIssueCount: number;
  readonly nonRepairableFailureCount: number;
}

const STATUS_WEIGHT: Readonly<Record<DiagnosticCheckStatus, number>> = Object.freeze({
  passed: 0,
  warning: 1,
  failed: 2
});

function worstStatus(checks: readonly DiagnosticCheck[]): DiagnosticCheckStatus {
  return checks.reduce<DiagnosticCheckStatus>(
    (current, check) =>
      STATUS_WEIGHT[check.status] > STATUS_WEIGHT[current] ? check.status : current,
    "passed"
  );
}

function healthStatusFor(
  dataStatus: DiagnosticCheckStatus,
  backupState: DiagnosticBackupState
): DiagnosticOverallStatus {
  if (dataStatus === "failed") {
    return "critical";
  }

  if (dataStatus === "warning" || backupState === "unavailable") {
    return "attention";
  }

  return "healthy";
}

function backupStateFor(
  backupCheck: DiagnosticCheck | undefined,
  retainedBackups: number
): DiagnosticBackupState {
  if (retainedBackups > 0 || backupCheck?.status === "passed") {
    return "available";
  }

  if (
    backupCheck?.status === "failed" ||
    (backupCheck?.status === "warning" && backupCheck.details.length > 0)
  ) {
    return "unavailable";
  }

  return "missing";
}

function reportCopy(
  status: DiagnosticOverallStatus,
  backupState: DiagnosticBackupState
): Pick<DiagnosticHealthPresentation, "title" | "description"> {
  if (status === "healthy" && backupState === "available") {
    return {
      title: "Everything looks good",
      description: "Your words, settings, and local backups are working normally."
    };
  }

  if (status === "healthy") {
    return {
      title: "Your app data looks good",
      description:
        "Your words and settings are working normally. A backup is optional, but recommended."
    };
  }

  if (status === "attention") {
    return {
      title: "A quick check is recommended",
      description:
        "English Focus found something that needs attention. Your existing data has not been changed."
    };
  }

  return {
    title: "Your data needs attention",
    description:
      "Some saved information could not be verified. Review the next step before making changes."
  };
}

function dataStatusValue(status: DiagnosticCheckStatus): string {
  return status === "passed"
    ? "Working normally"
    : status === "warning"
      ? "Needs a check"
      : "Problem found";
}

function backupFact(state: DiagnosticBackupState): DiagnosticHealthFact {
  if (state === "available") {
    return { id: "backups", label: "Backups", value: "Ready", tone: "good" };
  }

  if (state === "missing") {
    return {
      id: "backups",
      label: "Backups",
      value: "Not created yet",
      tone: "neutral"
    };
  }

  return {
    id: "backups",
    label: "Backups",
    value: "Could not be checked",
    tone: "check"
  };
}

export function presentDiagnosticHealth(report: DiagnosticReport): DiagnosticHealthPresentation {
  const backupCheck = report.checks.find((check) => check.id === "backup-availability");
  const dataChecks = report.checks.filter((check) => check.id !== "backup-availability");
  const dataStatus = worstStatus(dataChecks);
  const backupState = backupStateFor(backupCheck, report.counts.retainedBackups);
  const status = healthStatusFor(dataStatus, backupState);
  const repairableIssueCount = dataChecks.filter(
    (check) => check.repairable && check.status !== "passed"
  ).length;
  const nonRepairableFailureCount = dataChecks.filter(
    (check) => check.status === "failed" && !check.repairable
  ).length;
  const nextStep: DiagnosticHealthFact =
    nonRepairableFailureCount > 0
      ? {
          id: "next-step",
          label: "Next step",
          value:
            backupState === "available"
              ? "Restore a checked backup"
              : "Review details before changes",
          tone: "problem"
        }
      : repairableIssueCount > 0
        ? {
            id: "next-step",
            label: "Next step",
            value: "Safe fix available",
            tone: "check"
          }
        : status === "healthy" && backupState === "missing"
          ? {
              id: "next-step",
              label: "Next step",
              value: "Create your first backup",
              tone: "neutral"
            }
          : status === "healthy"
            ? {
                id: "next-step",
                label: "Next step",
                value: "Nothing to do",
                tone: "good"
              }
            : backupState === "unavailable"
              ? {
                  id: "next-step",
                  label: "Next step",
                  value: "Review backup access",
                  tone: "check"
                }
              : {
                  id: "next-step",
                  label: "Next step",
                  value: "Review the details",
                  tone: "check"
                };

  return {
    status,
    backupState,
    ...reportCopy(status, backupState),
    facts: Object.freeze([
      {
        id: "data",
        label: "Your data",
        value: dataStatusValue(dataStatus),
        tone:
          dataStatus === "passed" ? "good" : dataStatus === "warning" ? "check" : "problem"
      },
      backupFact(backupState),
      nextStep
    ]),
    repairableIssueCount,
    nonRepairableFailureCount
  };
}
