import type { AppSettings } from "@platform/domain";

export type SettingsSaveOutcome =
  | {
      readonly status: "saved";
      readonly saved: AppSettings;
      readonly latest: boolean;
    }
  | {
      readonly status: "failed";
      readonly cause: unknown;
      readonly rollback: AppSettings;
      readonly latest: boolean;
    };

export interface SettingsSaveAttempt {
  readonly optimistic: AppSettings;
  readonly completion: Promise<SettingsSaveOutcome>;
}

export class SettingsSaveCoordinator {
  private confirmed: AppSettings;
  private currentValue: AppSettings;
  private queue: Promise<void> = Promise.resolve();
  private latestSequence = 0;

  constructor(initial: AppSettings) {
    this.confirmed = initial;
    this.currentValue = initial;
  }

  get current(): AppSettings {
    return this.currentValue;
  }

  replace(settings: AppSettings): void {
    this.confirmed = settings;
    this.currentValue = settings;
  }

  async whenIdle(): Promise<void> {
    let observedQueue: Promise<void>;

    do {
      observedQueue = this.queue;
      await observedQueue;
    } while (observedQueue !== this.queue);
  }

  schedule(
    update: (current: AppSettings) => AppSettings,
    save: (settings: AppSettings) => Promise<AppSettings>
  ): SettingsSaveAttempt {
    const optimistic = update(this.currentValue);
    const sequence = this.latestSequence + 1;
    this.latestSequence = sequence;
    this.currentValue = optimistic;

    const saveOperation = this.queue.then(() => save(optimistic));
    this.queue = saveOperation.then(
      () => undefined,
      () => undefined
    );

    const completion = saveOperation.then(
      (saved): SettingsSaveOutcome => {
        this.confirmed = saved;
        const latest = this.latestSequence === sequence;

        if (latest) {
          this.currentValue = saved;
        }

        return Object.freeze({ status: "saved", saved, latest });
      },
      (cause: unknown): SettingsSaveOutcome => {
        const latest = this.latestSequence === sequence;
        const rollback = this.confirmed;

        if (latest) {
          this.currentValue = rollback;
        }

        return Object.freeze({ status: "failed", cause, rollback, latest });
      }
    );

    return Object.freeze({ optimistic, completion });
  }
}
