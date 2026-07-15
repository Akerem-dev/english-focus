import type { ImportIssue } from "@platform/domain";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CorrectionInstructionDialog } from "../../../src/modules/instruction";

const issues: readonly ImportIssue[] = [
  {
    source: "schema",
    severity: "error",
    code: "too_small",
    path: ["examples"],
    pathText: "examples",
    message: "Too small: expected array to have >=10 items"
  }
];

describe("CorrectionInstructionDialog", () => {
  it("renders a local provider-independent repair instruction", () => {
    const markup = renderToStaticMarkup(
      <CorrectionInstructionDialog
        issues={issues}
        onBack={() => undefined}
        onClose={() => undefined}
        open
        originalJson={'{"schemaVersion":"1.0.0","word":"allocate"}'}
        targetWord="allocate"
      />
    );

    expect(markup).toContain("Correction instruction");
    expect(markup).toContain("Word: allocate");
    expect(markup).toContain("1 schema issues");
    expect(markup).toContain("Issues included in the instruction");
    expect(markup).toContain("TARGET WORD: allocate");
    expect(markup).toContain("Copy correction instruction");
    expect(markup).toContain("Nothing is uploaded");
  });

  it("renders nothing while closed", () => {
    const markup = renderToStaticMarkup(
      <CorrectionInstructionDialog
        issues={issues}
        onBack={() => undefined}
        onClose={() => undefined}
        open={false}
        originalJson="{}"
        targetWord="allocate"
      />
    );

    expect(markup).toBe("");
  });
});
