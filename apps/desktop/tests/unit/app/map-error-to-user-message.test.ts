import { describe, expect, it } from "vitest";

import { mapErrorToUserMessage } from "../../../src/app/errors";

describe("mapErrorToUserMessage", () => {
  it("maps clipboard permission failures to a safe actionable message", () => {
    const result = mapErrorToUserMessage(new Error("Clipboard permission denied"));

    expect(result.title).toBe("Clipboard access was blocked");
    expect(result.retryable).toBe(true);
    expect(result.message).not.toContain("stack");
  });

  it("maps schema failures to diagnostics guidance", () => {
    const result = mapErrorToUserMessage(new Error("database schema version mismatch"));

    expect(result.title).toBe("Local database needs attention");
    expect(result.retryable).toBe(false);
    expect(result.message).toContain("Diagnostics");
  });
});
