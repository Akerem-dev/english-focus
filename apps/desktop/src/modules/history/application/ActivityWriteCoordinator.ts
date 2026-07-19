import type { ActivityRecord, RecordActivityInput } from "@platform/domain";

type ActivityInput = Omit<RecordActivityInput, "id" | "occurredAt">;
type SaveActivity = (record: RecordActivityInput) => Promise<ActivityRecord>;

interface RecentActivityWrite {
  readonly signature: string;
  readonly startedAt: number;
  readonly record: ActivityRecord;
}

function activitySignature(input: ActivityInput): string {
  return `${input.kind}:${input.scope}:${input.label}:${input.target ?? ""}`;
}

export class ActivityWriteCoordinator {
  private readonly pendingBySignature = new Map<string, Promise<ActivityRecord>>();
  private recent: RecentActivityWrite | undefined;

  constructor(
    private readonly createId: () => string,
    private readonly dedupeWindowMs = 800
  ) {}

  record(input: ActivityInput, save: SaveActivity, now = Date.now()): Promise<ActivityRecord> {
    const signature = activitySignature(input);
    const pending = this.pendingBySignature.get(signature);

    if (pending !== undefined) {
      return pending;
    }

    if (
      this.recent?.signature === signature &&
      now >= this.recent.startedAt &&
      now - this.recent.startedAt < this.dedupeWindowMs
    ) {
      return Promise.resolve(this.recent.record);
    }

    const candidate: RecordActivityInput = {
      ...input,
      id: this.createId(),
      occurredAt: new Date(now).toISOString()
    };

    const operation = Promise.resolve()
      .then(() => save(candidate))
      .then((saved) => {
        if (this.recent === undefined || now >= this.recent.startedAt) {
          this.recent = Object.freeze({ signature, startedAt: now, record: saved });
        }

        return saved;
      });

    this.pendingBySignature.set(signature, operation);

    const clearPending = () => {
      if (this.pendingBySignature.get(signature) === operation) {
        this.pendingBySignature.delete(signature);
      }
    };
    void operation.then(clearPending, clearPending);

    return operation;
  }

  async whenIdle(): Promise<void> {
    while (this.pendingBySignature.size > 0) {
      await Promise.allSettled([...this.pendingBySignature.values()]);
    }
  }

  clear(): void {
    this.recent = undefined;
  }
}
