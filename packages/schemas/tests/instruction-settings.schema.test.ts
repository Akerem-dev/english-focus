import { DEFAULT_INSTRUCTION_PREFERENCES } from "@platform/domain";
import { describe, expect, it } from "vitest";

import { instructionPreferencesSchema } from "../src";

describe("instructionPreferencesSchema", () => {
  it("accepts the provider-independent defaults", () => {
    expect(instructionPreferencesSchema.parse(DEFAULT_INSTRUCTION_PREFERENCES)).toEqual(
      DEFAULT_INSTRUCTION_PREFERENCES
    );
  });

  it("requires exactly ten primary examples", () => {
    expect(
      instructionPreferencesSchema.safeParse({
        ...DEFAULT_INSTRUCTION_PREFERENCES,
        exampleCount: 9
      }).success
    ).toBe(false);
  });

  it("rejects provider and credential fields", () => {
    expect(
      instructionPreferencesSchema.safeParse({
        ...DEFAULT_INSTRUCTION_PREFERENCES,
        provider: "some-provider",
        apiKey: "secret"
      }).success
    ).toBe(false);
  });
});
