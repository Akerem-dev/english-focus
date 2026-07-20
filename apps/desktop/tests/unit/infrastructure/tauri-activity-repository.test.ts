import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn()
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock
}));

import { TauriActivityRepository } from "../../../src/infrastructure/persistence/TauriActivityRepository";

const originalWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");

function setWindow(value: object): void {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value,
    writable: true
  });
}

describe("TauriActivityRepository", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    setWindow({ __TAURI_INTERNALS__: {} });
  });

  afterEach(() => {
    if (originalWindowDescriptor === undefined) {
      Reflect.deleteProperty(globalThis, "window");
      return;
    }

    Object.defineProperty(globalThis, "window", originalWindowDescriptor);
  });

  it("normalizes null targets and keeps valid rows around malformed legacy activity", async () => {
    invokeMock.mockResolvedValue([
      {
        id: "activity-1",
        kind: "vocabulary-viewed",
        scope: "vocabulary",
        label: "Viewed vocabulary entry",
        target: null,
        occurredAt: "2026-07-20T18:00:00.000Z"
      },
      {
        id: "activity-2",
        kind: "vocabulary-viewed",
        scope: "vocabulary",
        label: null,
        target: "broken",
        occurredAt: "2026-07-20T18:01:00.000Z"
      },
      {
        id: "activity-3",
        kind: "vocabulary-viewed",
        scope: "vocabulary",
        label: "Viewed vocabulary entry",
        target: "maintain",
        occurredAt: "2026-07-20T18:02:00.000Z"
      }
    ]);

    const repository = new TauriActivityRepository();
    const result = await repository.listActivity(100);

    expect(invokeMock).toHaveBeenCalledWith("list_resilient_activity", { limit: 100 });
    expect(result).toEqual({
      records: [
        {
          id: "activity-1",
          kind: "vocabulary-viewed",
          scope: "vocabulary",
          label: "Viewed vocabulary entry",
          target: undefined,
          occurredAt: "2026-07-20T18:00:00.000Z"
        },
        {
          id: "activity-3",
          kind: "vocabulary-viewed",
          scope: "vocabulary",
          label: "Viewed vocabulary entry",
          target: "maintain",
          occurredAt: "2026-07-20T18:02:00.000Z"
        }
      ],
      skippedCount: 1
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.records)).toBe(true);
  });

  it("returns an empty immutable result outside the Tauri runtime", async () => {
    setWindow({});

    const repository = new TauriActivityRepository();
    const result = await repository.listActivity();

    expect(result).toEqual({ records: [], skippedCount: 0 });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.records)).toBe(true);
    expect(invokeMock).not.toHaveBeenCalled();
  });
});
