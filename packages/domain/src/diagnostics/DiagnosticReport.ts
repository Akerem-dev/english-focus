export type DiagnosticCheckStatus = "passed" | "warning" | "failed";
export type DiagnosticOverallStatus = "healthy" | "attention" | "critical";

export interface DiagnosticCheck {
  readonly id: string;
  readonly title: string;
  readonly status: DiagnosticCheckStatus;
  readonly summary: string;
  readonly details: readonly string[];
  readonly repairable: boolean;
}

export interface DiagnosticCounts {
  readonly vocabularyEntries: number;
  readonly vocabularyMetadata: number;
  readonly settingsRecords: number;
  readonly retainedBackups: number;
  readonly invalidVocabularyJson: number;
  readonly invalidMetadataJson: number;
  readonly invalidSettingsJson: number;
  readonly normalizedWordMismatches: number;
}

export interface DiagnosticReport {
  readonly generatedAt: string;
  readonly appVersion: string;
  readonly databaseSchemaVersion: string;
  readonly overallStatus: DiagnosticOverallStatus;
  readonly checks: readonly DiagnosticCheck[];
  readonly counts: DiagnosticCounts;
  readonly recommendations: readonly string[];
}

export interface SafeMaintenanceResult {
  readonly completedAt: string;
  readonly actions: readonly string[];
  readonly report: DiagnosticReport;
}
