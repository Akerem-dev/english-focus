import { DEFAULT_INSTRUCTION_PREFERENCES, type InstructionPreferences } from "@platform/domain";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { describe, expect, it } from "vitest";

import { createInstructionSettingsHandlers } from "../../../src/modules/settings/components/instructionSettingsHandlers";

function createDeferredPreferencesHarness() {
  let update: SetStateAction<InstructionPreferences> | undefined;

  const setPreferences: Dispatch<SetStateAction<InstructionPreferences>> = (next) => {
    update = next;
  };

  return {
    setPreferences,
    resolve(current = DEFAULT_INSTRUCTION_PREFERENCES): InstructionPreferences {
      if (update === undefined) {
        throw new Error("No preference update was recorded");
      }

      return typeof update === "function" ? update(current) : update;
    }
  };
}

function selectEvent(target: { value: string }): ChangeEvent<HTMLSelectElement> {
  return { currentTarget: target } as unknown as ChangeEvent<HTMLSelectElement>;
}

function switchEvent(target: { checked: boolean }): ChangeEvent<HTMLInputElement> {
  return { currentTarget: target } as unknown as ChangeEvent<HTMLInputElement>;
}

describe("instruction settings event handlers", () => {
  it("snapshots Maximum before the deferred state updater runs", () => {
    const harness = createDeferredPreferencesHarness();
    const handlers = createInstructionSettingsHandlers(harness.setPreferences);
    const target = { value: "maximum" };

    handlers.onDetailLevelChange(selectEvent(target));
    target.value = "balanced";

    expect(harness.resolve().detailLevel).toBe("maximum");
  });

  it("snapshots C1 before the deferred state updater runs", () => {
    const harness = createDeferredPreferencesHarness();
    const handlers = createInstructionSettingsHandlers(harness.setPreferences);
    const target = { value: "C1" };

    handlers.onTargetProficiencyChange(selectEvent(target));
    target.value = "A1";

    expect(harness.resolve().targetProficiency).toBe("C1");
  });

  it("snapshots switch state before the deferred state updater runs", () => {
    const harness = createDeferredPreferencesHarness();
    const handlers = createInstructionSettingsHandlers(harness.setPreferences);
    const target = { checked: false };

    handlers.onGrammarNotesChange(switchEvent(target));
    target.checked = true;

    expect(harness.resolve().includeGrammarNotes).toBe(false);
  });
});
