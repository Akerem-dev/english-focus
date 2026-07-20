import { describe, expect, it, vi } from "vitest";
import type { ActivityRecord, RecordActivityInput } from "@platform/domain";

import { ActivityWriteCoordinator } from "../../../src/modules/history";

interface Deferred<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
  readonly reject: (cause: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (cause: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

const input = {
  kind: "settings-updated" as const,
  scope: "settings" as const,
  label: "Application settings updated"
};

function savedRecord(record: RecordActivityInput): ActivityRecord {
  return Object.freeze({ ...record });
}

describe("ActivityWriteCoordinator", () => {
  it("shares one pending write for duplicate activity", async () => {
    const pending = deferred<ActivityRecord>();
    const save = vi.fn<(record: RecordActivityInput) => Promise<ActivityRecord>>(
      () => pending.promise
    );
    const coordinator = new ActivityWriteCoordinator(() => "activity-1");

    const first = coordinator.record(input, save, 1_000);
    const duplicate = coordinator.record(input, save, 1_100);

    expect(duplicate).toBe(first);
    await Promise.resolve();
    expect(save).toHaveBeenCalledTimes(1);

    const candidate = save.mock.calls[0]?.[0];
    expect(candidate).toBeDefined();
    pending.resolve(savedRecord(candidate!));
    await expect(first).resolves.toMatchObject({ id: "activity-1" });
  });

  it("does not remember a failed write as a successful duplicate", async () => {
    const firstSave = deferred<ActivityRecord>();
    const save = vi
      .fn<(record: RecordActivityInput) => Promise<ActivityRecord>>()
      .mockReturnValueOnce(firstSave.promise)
      .mockImplementationOnce(async (record) => savedRecord(record));
    let id = 0;
    const coordinator = new ActivityWriteCoordinator(() => `activity-${++id}`);

    const first = coordinator.record(input, save, 1_000);
    firstSave.reject(new Error("write failed"));
    await expect(first).rejects.toThrow("write failed");

    const retry = coordinator.record(input, save, 1_200);
    await expect(retry).resolves.toMatchObject({ id: "activity-2" });
    expect(save).toHaveBeenCalledTimes(2);
  });

  it("reuses a recent successful record inside the dedupe window", async () => {
    const save = vi.fn(async (record: RecordActivityInput) => savedRecord(record));
    const coordinator = new ActivityWriteCoordinator(() => "activity-1");

    const first = await coordinator.record(input, save, 1_000);
    const duplicate = await coordinator.record(input, save, 1_500);

    expect(duplicate).toBe(first);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("records the same activity again after the dedupe window", async () => {
    let id = 0;
    const save = vi.fn(async (record: RecordActivityInput) => savedRecord(record));
    const coordinator = new ActivityWriteCoordinator(() => `activity-${++id}`);

    await coordinator.record(input, save, 1_000);
    await coordinator.record(input, save, 1_801);

    expect(save).toHaveBeenCalledTimes(2);
  });
});
