import { describe, expect, it } from "vitest";

import {
  cleanPastedJsonText,
  MAX_PASTED_JSON_CHARACTERS
} from "../../../src/modules/import-export";

const validJson = '{"schemaVersion":"1.0.0","word":"allocate"}';

describe("cleanPastedJsonText", () => {
  it("trims whitespace and removes a JSON Markdown fence", () => {
    const result = cleanPastedJsonText(`\n\n\`\`\`json\n${validJson}\n\`\`\`\n`);

    expect(result).toMatchObject({
      kind: "success",
      cleanedText: validJson,
      transformations: ["trimmed-whitespace", "removed-markdown-fence"]
    });
  });

  it("extracts the first complete object from surrounding prose", () => {
    const result = cleanPastedJsonText(`Here is the requested entry:\n${validJson}\nDone.`);

    expect(result).toMatchObject({
      kind: "success",
      cleanedText: validJson,
      transformations: ["removed-leading-text", "removed-trailing-text"]
    });
  });

  it("does not treat braces inside JSON strings as structure", () => {
    const text = '{"word":"allocate","note":"Use {carefully} in prose."}';

    expect(cleanPastedJsonText(text)).toMatchObject({
      kind: "success",
      cleanedText: text
    });
  });

  it("rejects empty input", () => {
    expect(cleanPastedJsonText("  \n ")).toMatchObject({
      kind: "failure",
      code: "empty"
    });
  });

  it("rejects input over the safety limit before extraction", () => {
    const oversized = "x".repeat(MAX_PASTED_JSON_CHARACTERS + 1);

    expect(cleanPastedJsonText(oversized)).toMatchObject({
      kind: "failure",
      code: "too-large"
    });
  });

  it("reports an unterminated object", () => {
    expect(cleanPastedJsonText('{"word":"allocate"')).toMatchObject({
      kind: "failure",
      code: "unterminated-object"
    });
  });
});
