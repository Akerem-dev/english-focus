import { expect, test } from "./app.fixture";

test("settings categories support keyboard navigation and focused maintenance tools", async ({
  page
}) => {
  await page.goto("/#/settings");

  const vocabularyTab = page.getByRole("tab", { name: /Vocabulary content/ });
  const dataTab = page.getByRole("tab", { name: /Data & backups/ });
  const privacyTab = page.getByRole("tab", { name: /Privacy & maintenance/ });

  await expect(vocabularyTab).toHaveAttribute("aria-selected", "true");
  await vocabularyTab.focus();
  await page.keyboard.press("ArrowRight");

  await expect(dataTab).toBeFocused();
  await expect(dataTab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("Automatic backups", { exact: true })).toBeVisible();

  await page.keyboard.press("End");
  await expect(privacyTab).toBeFocused();
  await expect(privacyTab).toHaveAttribute("aria-selected", "true");

  await page.getByRole("button", { name: /App health/ }).click();
  await expect(page.getByRole("heading", { name: "App health", level: 2 })).toBeFocused();
  await expect(page.getByText("Check your app", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Check now" }).click();
  await expect(
    page.getByRole("heading", {
      name: /Everything looks good|A small issue was found|Your data needs attention/
    })
  ).toBeVisible();
  await expect(page.getByText("Your data", { exact: true })).toBeVisible();
  await expect(page.getByText("Next step", { exact: true })).toBeVisible();
  await expect(page.getByText("Check details", { exact: true })).toBeVisible();
  await expect(page.getByText("SQLite integrity", { exact: true })).not.toBeVisible();

  await page.getByRole("button", { name: /Back to privacy & maintenance/ }).click();
  await expect(page.getByRole("button", { name: /Recent activity/ })).toBeFocused();

  await page.getByRole("button", { name: /My data/ }).click();
  await expect(page.getByRole("heading", { name: "My data", level: 2 })).toBeFocused();
  await expect(page.getByRole("button", { name: "Choose data" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open reset options" })).toBeVisible();

  await page.getByRole("button", { name: "Choose data" }).click();
  const selectiveDialog = page.getByRole("dialog", { name: "Remove selected data" });
  await expect(selectiveDialog).toBeVisible();
  await expect(selectiveDialog.getByRole("checkbox")).toHaveCount(6);
  for (const checkbox of await selectiveDialog.getByRole("checkbox").all()) {
    await expect(checkbox).not.toBeChecked();
  }
  await expect(selectiveDialog.getByText("RESET ENGLISH FOCUS")).toHaveCount(0);
  await selectiveDialog.getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "Open reset options" }).click();
  const resetDialog = page.getByRole("dialog", { name: "Reset English Focus" });
  await expect(resetDialog).toBeVisible();
  await expect(resetDialog.getByText("Saved backups are not removed by this reset.")).toBeVisible();
  await expect(resetDialog.getByPlaceholder("RESET ENGLISH FOCUS")).toBeVisible();
});
