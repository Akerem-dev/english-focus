export type BackupFrequency = "daily" | "weekly" | "manual";

export interface DataSettings {
  readonly automaticBackups: boolean;
  readonly backupFrequency: BackupFrequency;
}
