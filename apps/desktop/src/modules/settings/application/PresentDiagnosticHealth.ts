import type {
  DiagnosticCheck,
  DiagnosticCheckStatus,
  DiagnosticOverallStatus,
  DiagnosticReport
} from "@platform/domain";

type DiagnosticHealthTone = "good" | "neutral" | "check" | "problem";
type DiagnosticBackupState = "available" | "missing" | "unavailable";

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
      description: "Your words, settings, and backups are available. Nothing needs your attention."
    };
  }

  if (status === "healthy") {
    return {
      title: "Your app data looks good",
      description:
        "Your words and settings are working normally. Creating a backup is recommended, but the app is not damaged."
    };
  }

  if (status === "attention") {
    return {
      title: "A quick check is recommended",
      description:
        backupState === "unavailable"
          ? "Your app data is available, but backup storage could not be checked right now."
          : "English Focus found a local setting that can be safely checked or repaired."
    };
  }

  return {
    title: "Your data needs attention",
    description:
      "Some saved information could not be verified. Avoid major changes until you review the guidance below."
  };
}

function dataStatusValue(status: DiagnosticCheckStatus): string {
  return status === "passed"
    ? "Working normally"
    : status === "warning"
      ? "Safe check recommended"
      : "Problem found";
}

function backupFact(state: DiagnosticBackupState): DiagnosticHealthFact {
  if (state === "available") {
    return {
      id: "backups",
      label: "Backups",
      value: "Ready",
      tone: "good"
    };
  }

  if (state === "unavailable") {
    return {
      id: "backups",
      label: "Backups",
      value: "Could not be checked",
      tone: "check"
    };
  }

  return {
    id: "backups",
    label: "Backups",
    value: "Not created yet",
    tone: "neutral"
  };
}

function nextStepFact(
  status: DiagnosticOverallStatus,
  backupState: DiagnosticBackupState,
  repairableIssueCount: number,
  nonRepairableFailureCount: number
): DiagnosticHealthFact {
  if (nonRepairableFailureCount > 0) {
    return backupState === "available"
      ? {
          id: "next-step",
          label: "Next step",
          value: "Review a checked backup",
          tone: "problem"
        }
      : {
          id: "next-step",
          label: "Next step",
          value: "Review details before changes",
          tone: "problem"
        };
  }

  if (repairableIssueCount > 0) {
    return {
      id: "next-step",
      label: "Next step",
      value: "Safe fix available",
      tone: "check"
    };
  }

  if (backupState === "missing") {
    return {
      id: "next-step",
      label: "Next step",
      value: "Create your first backup",
      tone: "neutral"
    };
  }

  if (backupState === "unavailable") {
    return {
      id: "next-step",
      label: "Next step",
      value: "Try the check again later",
      tone: "check"
    };
  }

  return {
    id: "next-step",
    label: "Next step",
    value: status === "healthy" ? "Nothing to do" : "Review the details",
    tone: status === "healthy" ? "good" : "check"
  };
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
  const backupState = backupStateFor(backupCheck, report.counts.retainedBackups);
  const status = healthStatusFor(dataStatus, backupState);
  const nextStep = nextStepFact(
    status,
    backupState,
    repairableIssueCount,
    nonRepairableFailureCount
  );

  return {
    status,
    backupState,
    ...reportCopy(status, backupState),
    facts: Object.freeze([
      {
        id: "data",
        label: "Your data",
        value: dataStatusValue(dataStatus),
        tone: dataStatus === "passed" ? "good" : dataStatus === "warning" ? "check" : "problem"
      },
      backupFact(backupState),
      nextStep
    ]),
    repairableIssueCount,
    nonRepairableFailureCount
  };
}
