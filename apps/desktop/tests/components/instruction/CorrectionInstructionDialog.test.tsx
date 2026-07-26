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
  it("renders a local correction request without visible technical metadata", () => {
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

    expect(markup).toContain("Correction request");
    expect(markup).toContain("Word: allocate");
    expect(markup).toContain("1 item to fix");
    expect(markup).toContain("Items included in the request");
    expect(markup).toContain("TARGET WORD: allocate");
    expect(markup).toContain("Copy correction request");
    expect(markup).toContain("Nothing is uploaded");
    expect(markup).not.toContain("<code>examples</code>");
    expect(markup).not.toContain("<small>schema · error · too_small</small>");
    expect(markup).not.toContain("Provider independent");
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
