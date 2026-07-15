import type { Clipboard, ImportIssue } from "@platform/domain";
import { describe, expect, it } from "vitest";

import {
  BuildCorrectionInstruction,
  CopyCorrectionInstruction
} from "../../../src/modules/instruction";

const issues: readonly ImportIssue[] = [
  {
    source: "schema",
    severity: "error",
    code: "too_small",
    path: ["examples"],
    pathText: "examples",
    message: "Too small: expected array to have >=10 items"
  },
  {
    source: "schema",
    severity: "error",
    code: "invalid_type",
    path: ["grammar", "patterns", 2, "explanationTr"],
    pathText: "grammar.patterns[2].explanationTr",
    message: "Invalid input: expected string, received undefined"
  }
];

class RecordingClipboard implements Clipboard {
  text = "";

  async writeText(text: string): Promise<void> {
    this.text = text;
  }
}

describe("BuildCorrectionInstruction", () => {
  it("builds a deterministic schema-versioned repair instruction", () => {
    const builder = new BuildCorrectionInstruction();
    const request = {
      targetWord: "allocate",
      originalJson: '{"schemaVersion":"1.0.0","word":"allocate"}',
      issues
    } as const;

    const first = builder.execute(request);
    const second = builder.execute(request);

    expect(first).toEqual(second);
    expect(first.issueCount).toBe(2);
    expect(first.text).toContain("TARGET WORD: allocate");
    expect(first.text).toContain("SOURCE: schema");
    expect(first.text).toContain("SEVERITY: error");
    expect(first.text).toContain("PATH: examples");
    expect(first.text).toContain("grammar.patterns[2].explanationTr");
    expect(first.text).toContain("<ORIGINAL_JSON>");
    expect(first.text).toContain("REQUIRED JSON SCHEMA");
    expect(first.text).toContain("Output only the corrected JSON object.");
  });

  it("contains no provider, model, endpoint, or credential selection", () => {
    const text = new BuildCorrectionInstruction()
      .execute({
        targetWord: "allocate",
        originalJson: '{"word":"allocate"}',
        issues
      })
      .text.toLocaleLowerCase("en-US");

    expect(text).not.toContain("openai");
    expect(text).not.toContain("anthropic");
    expect(text).not.toContain("gemini");
    expect(text).not.toContain("api key");
    expect(text).not.toContain("endpoint");
  });

  it("rejects invalid targets, empty JSON, and empty issue lists", () => {
    const builder = new BuildCorrectionInstruction();

    expect(() => builder.execute({ targetWord: "two words", originalJson: "{}", issues })).toThrow(
      /single English word/u
    );
    expect(() => builder.execute({ targetWord: "allocate", originalJson: " ", issues })).toThrow(
      /original JSON/u
    );
    expect(() =>
      builder.execute({ targetWord: "allocate", originalJson: "{}", issues: [] })
    ).toThrow(/validation issue/u);
  });

  it("copies the exact correction instruction through the clipboard port", async () => {
    const clipboard = new RecordingClipboard();
    const copier = new CopyCorrectionInstruction(clipboard);

    await copier.execute({
      targetWord: "allocate",
      originalJson: '{"word":"allocate"}',
      issues
    });

    expect(clipboard.text).toContain("TARGET WORD: allocate");
    expect(clipboard.text).toContain("VALIDATION ISSUES: 2");
  });
});
