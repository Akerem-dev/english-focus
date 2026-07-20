import { describe, expect, it, vi } from "vitest";
import type { AppSettings } from "@platform/domain";

import { createDefaultAppSettings } from "../../../src/modules/settings/application";
import { SettingsSaveCoordinator } from "../../../src/modules/settings/state";

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

function withAppearance(
  current: AppSettings,
  appearance: Partial<AppSettings["appearance"]>,
  updatedAt: string
): AppSettings {
  return {
    ...current,
    appearance: { ...current.appearance, ...appearance },
    updatedAt
  };
}

describe("SettingsSaveCoordinator", () => {
  it("rolls two failed optimistic saves back to the last confirmed settings", async () => {
    const initial = createDefaultAppSettings("2026-07-19T00:00:00.000Z");
    const coordinator = new SettingsSaveCoordinator(initial);
    const firstSave = deferred<AppSettings>();
    const secondSave = deferred<AppSettings>();
    const save = vi
      .fn<(settings: AppSettings) => Promise<AppSettings>>()
      .mockReturnValueOnce(firstSave.promise)
      .mockReturnValueOnce(secondSave.promise);

    const first = coordinator.schedule(
      (current) => withAppearance(current, { theme: "dark" }, "2026-07-19T00:00:01.000Z"),
      save
    );
    const second = coordinator.schedule(
      (current) => withAppearance(current, { interfaceSize: "large" }, "2026-07-19T00:00:02.000Z"),
      save
    );

    expect(coordinator.current.appearance).toMatchObject({ theme: "dark", interfaceSize: "large" });

    firstSave.reject(new Error("first save failed"));
    const firstOutcome = await first.completion;
    expect(firstOutcome).toMatchObject({ status: "failed", latest: false });

    secondSave.reject(new Error("second save failed"));
    const secondOutcome = await second.completion;
    expect(secondOutcome).toMatchObject({ status: "failed", latest: true, rollback: initial });
    expect(coordinator.current).toBe(initial);
    expect(save).toHaveBeenCalledTimes(2);
  });

  it("rolls a failed latest save back to the previous successful save", async () => {
    const initial = createDefaultAppSettings("2026-07-19T00:00:00.000Z");
    const coordinator = new SettingsSaveCoordinator(initial);
    const firstSave = deferred<AppSettings>();
    const secondSave = deferred<AppSettings>();
    const save = vi
      .fn<(settings: AppSettings) => Promise<AppSettings>>()
      .mockReturnValueOnce(firstSave.promise)
      .mockReturnValueOnce(secondSave.promise);

    const first = coordinator.schedule(
      (current) => withAppearance(current, { theme: "dark" }, "2026-07-19T00:00:01.000Z"),
      save
    );
    const second = coordinator.schedule(
      (current) => withAppearance(current, { interfaceSize: "large" }, "2026-07-19T00:00:02.000Z"),
      save
    );

    firstSave.resolve(first.optimistic);
    await expect(first.completion).resolves.toMatchObject({ status: "saved", latest: false });

    secondSave.reject(new Error("second save failed"));
    await expect(second.completion).resolves.toMatchObject({
      status: "failed",
      latest: true,
      rollback: first.optimistic
    });
    expect(coordinator.current).toBe(first.optimistic);
  });

  it("allows a later successful snapshot to include an earlier optimistic change", async () => {
    const initial = createDefaultAppSettings("2026-07-19T00:00:00.000Z");
    const coordinator = new SettingsSaveCoordinator(initial);
    const firstSave = deferred<AppSettings>();
    const secondSave = deferred<AppSettings>();
    const save = vi
      .fn<(settings: AppSettings) => Promise<AppSettings>>()
      .mockReturnValueOnce(firstSave.promise)
      .mockReturnValueOnce(secondSave.promise);

    const first = coordinator.schedule(
      (current) => withAppearance(current, { theme: "dark" }, "2026-07-19T00:00:01.000Z"),
      save
    );
    const second = coordinator.schedule(
      (current) => withAppearance(current, { interfaceSize: "large" }, "2026-07-19T00:00:02.000Z"),
      save
    );

    firstSave.reject(new Error("first save failed"));
    await expect(first.completion).resolves.toMatchObject({ status: "failed", latest: false });

    secondSave.resolve(second.optimistic);
    await expect(second.completion).resolves.toMatchObject({ status: "saved", latest: true });
    expect(coordinator.current.appearance).toMatchObject({ theme: "dark", interfaceSize: "large" });
  });
});
