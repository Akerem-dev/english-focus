import { describe, expect, it } from "vitest";

import { designTokens } from "../../src/design-system";

describe("designTokens", () => {
  it("defines the approved visual foundation", () => {
    expect(designTokens.color.accent).toBe("#7b1722");
    expect(designTokens.color.canvas).toBe("#f6f3ed");
    expect(designTokens.color.text).toBe("#24211f");
    expect(designTokens.motion.duration.fast).toBe("120ms");
    expect(designTokens.motion.duration.slow).toBe("240ms");
    expect(designTokens.breakpoint.narrow).toBe(960);
    expect(designTokens.layer.modal).toBeGreaterThan(designTokens.layer.overlay);
  });
});
