import { describe, expect, it } from "vitest";

import { FakeClipboard } from "../src";

describe("FakeClipboard", () => {
  it("records local plain-text writes", async () => {
    const clipboard = new FakeClipboard();

    await clipboard.writeText("instruction");

    expect(clipboard.lastCopiedText).toBe("instruction");
    expect(clipboard.writes).toEqual(["instruction"]);
  });
});
