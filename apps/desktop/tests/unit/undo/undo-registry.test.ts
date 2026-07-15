import { describe, expect, it } from "vitest";

import { UndoRegistry } from "../../../src/modules/undo";

describe("UndoRegistry", () => {
  it("keeps only the latest transient undo action", () => {
    const registry = new UndoRegistry();
    const action = {
      perform: () => undefined,
      undo: () => undefined,
      successTitle: "Changed"
    };

    registry.register(action);
    expect(registry.getLatest()).toBe(action);

    registry.clear();
    expect(registry.getLatest()).toBeUndefined();
  });
});
