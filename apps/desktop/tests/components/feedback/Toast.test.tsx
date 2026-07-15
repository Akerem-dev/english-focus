import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Toast } from "../../../src/components";

const baseToast = {
  id: "toast-test",
  createdAt: 1,
  title: "Vocabulary saved locally",
  message: "The entry is available in Library.",
  tone: "success" as const,
  durationMs: 4_800
};

describe("Toast", () => {
  it("renders an accessible status notification", () => {
    const markup = renderToStaticMarkup(<Toast onDismiss={() => undefined} toast={baseToast} />);

    expect(markup).toContain('role="status"');
    expect(markup).toContain("Vocabulary saved locally");
    expect(markup).toContain("The entry is available in Library.");
  });

  it("renders an undo action when supplied", () => {
    const markup = renderToStaticMarkup(
      <Toast
        onDismiss={() => undefined}
        toast={{ ...baseToast, action: { label: "Undo", onAction: () => undefined } }}
      />
    );

    expect(markup).toContain("Undo");
    expect(markup).toContain("Dismiss Vocabulary saved locally");
  });
});
