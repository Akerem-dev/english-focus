import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { InstructionPreferencesProvider } from "../../../src/app/providers";
import { AiInstructionDialog } from "../../../src/modules/instruction";

describe("AiInstructionDialog", () => {
  it("renders a provider-independent copyable instruction", () => {
    const markup = renderToStaticMarkup(
      <InstructionPreferencesProvider>
        <AiInstructionDialog onClose={() => undefined} open targetWord="allocate" />
      </InstructionPreferencesProvider>
    );

    expect(markup).toContain("AI instruction");
    expect(markup).toContain("Word: allocate");
    expect(markup).toContain("Exactly 10 examples");
    expect(markup).toContain("Copy instruction");
    expect(markup).toContain("does not send this word or instruction anywhere");
    expect(markup).toContain("TARGET WORD: allocate");
  });
});
