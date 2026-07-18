import type {
  DiagnosticCheck,
  DiagnosticCheckStatus,
  DiagnosticOverallStatus,
  DiagnosticReport
} from "@platform/domain";

type DiagnosticHealthTone = "good" | "check" | "problem";

interface DiagnosticHealthFact {
  readonly id: "data" | "backups" | "next-step";
  readonly label: string;
  readonly value: string;
  readonly tone: DiagnosticHealthTone;
}

export interface DiagnosticHealthPresentation {
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

function toneForStatus(status: DiagnosticCheckStatus): DiagnosticHealthTone {
  return status === "passed" ? "good" : status === "warning" ? "check" : "problem";
}

function reportCopy(
  status: DiagnosticOverallStatus
): Pick<DiagnosticHealthPresentation, "title" | "description"> {
  if (status === "healthy") {
    return {
      title: "Everything looks good",
      description: "Your words, settings, and backups are available. Nothing needs your attention."
    };
  }

  if (status === "attention") {
    return {
      title: "A small issue was found",
      description:
        "English Focus found something that should be checked before it becomes a problem."
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
    ? "Available"
    : status === "warning"
      ? "Needs a check"
      : "Problem found";
}

function backupStatusValue(status: DiagnosticCheckStatus): string {
  return status === "passed"
    ? "Available"
    : status === "warning"
      ? "Not available yet"
      : "Could not be checked";
}

export function presentDiagnosticHealth(report: DiagnosticReport): DiagnosticHealthPresentation {
  const repairableIssueCount = report.checks.filter(
    (check) => check.repairable && check.status !== "passed"
  ).length;
  const nonRepairableFailureCount = report.checks.filter(
    (check) => check.status === "failed" && !check.repairable
  ).length;
  const backupCheck = report.checks.find((check) => check.id === "backup-availability");
  const dataChecks = report.checks.filter((check) => check.id !== "backup-availability");
  const dataStatus = worstStatus(dataChecks);
  const backupStatus = backupCheck?.status ?? "warning";
  const nextStep: DiagnosticHealthFact =
    nonRepairableFailureCount > 0
      ? {
          id: "next-step",
          label: "Next step",
          value: "Restore a checked backup",
          tone: "problem"
        }
      : repairableIssueCount > 0
        ? {
            id: "next-step",
            label: "Next step",
            value: "Safe fix available",
            tone: "check"
          }
        : report.overallStatus === "healthy"
          ? {
              id: "next-step",
              label: "Next step",
              value: "Nothing to do",
              tone: "good"
            }
          : {
              id: "next-step",
              label: "Next step",
              value: "Review the details",
              tone: "check"
            };

  return {
    ...reportCopy(report.overallStatus),
    facts: Object.freeze([
      {
        id: "data",
        label: "Your data",
        value: dataStatusValue(dataStatus),
        tone: toneForStatus(dataStatus)
      },
      {
        id: "backups",
        label: "Backups",
        value: backupStatusValue(backupStatus),
        tone: toneForStatus(backupStatus)
      },
      nextStep
    ]),
    repairableIssueCount,
    nonRepairableFailureCount
  };
}
