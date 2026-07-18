import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppProviders } from "../../../src/app/providers";
import {
  LocalDataControlsSection,
  ResetApplicationDialog,
  SelectiveDataRemovalDialog
} from "../../../src/modules/settings/components";

const categories = [
  {
    category: "study-metadata" as const,
    title: "Favorites, tags & notes",
    description: "Personal details",
    count: 4
  },
  {
    category: "user-vocabulary" as const,
    title: "Words I added",
    description: "Added words",
    count: 3
  }
];

describe("LocalDataControlsSection", () => {
  it("separates selective removal from full application reset", () => {
    const markup = renderToStaticMarkup(
      <AppProviders>
        <LocalDataControlsSection />
      </AppProviders>
    );

    expect(markup).toContain("Remove selected data");
    expect(markup).toContain("Choose data");
    expect(markup).toContain("Reset English Focus");
    expect(markup).toContain("Open reset options");
    expect(markup).toContain("Built-in words and saved backups stay available");
    expect(markup).not.toContain("Your data stays protected");
  });

  it("opens selective removal with no data selected and no typed confirmation", () => {
    const markup = renderToStaticMarkup(
      <SelectiveDataRemovalDialog
        busy={false}
        canSubmit={false}
        categories={categories}
        createSafetyBackup={true}
        onClose={() => undefined}
        onCreateSafetyBackupChange={() => undefined}
        onReviewConfirmedChange={() => undefined}
        onSubmit={() => undefined}
        onToggleCategory={() => undefined}
        open
        reviewConfirmed={false}
        safetyAvailable={false}
        selectedCategories={[]}
        selectedCount={0}
      />
    );

    expect(markup).toContain("Nothing is selected in advance");
    expect(markup).toContain("Select at least one data group to continue");
    expect(markup).not.toContain("checked=\"\"");
    expect(markup).not.toContain("Type to confirm");
    expect(markup).not.toContain("RESET ENGLISH FOCUS");
  });

  it("reserves typed confirmation for a full application reset", () => {
    const markup = renderToStaticMarkup(
      <ResetApplicationDialog
        busy={false}
        canSubmit={false}
        confirmationText=""
        createSafetyBackup={true}
        onClose={() => undefined}
        onConfirmationTextChange={() => undefined}
        onCreateSafetyBackupChange={() => undefined}
        onSubmit={() => undefined}
        open
      />
    );

    expect(markup).toContain("Reset English Focus");
    expect(markup).toContain("Saved backups are not removed by this reset");
    expect(markup).toContain("RESET ENGLISH FOCUS");
    expect(markup).not.toContain("Choose data");
  });
});
