export interface PracticeSessionResult {
  readonly mode: string;
  readonly attempted: number;
  readonly correct: number;
  readonly durationSeconds: number;
  readonly completedAt: string;
}
