import { expect, test } from "./app.fixture";

test("settings categories support roving keyboard navigation and focused management views", async ({
  page,
}) => {
  await page.goto("/settings");

  const vocabularyTab = page.getByRole("tab", { name: /Vocabulary content/ });
  const dataTab = page.getByRole("tab", { name: /Data & backups/ });
  const privacyTab = page.getByRole("tab", { name: /Privacy & maintenance/ });

  await expect(vocabularyTab).toHaveAttribute("aria-selected", "true");
  await vocabularyTab.focus();
  await page.keyboard.press("ArrowRight");

  await expect(dataTab).toBeFocused();
  await expect(dataTab).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByText("Automatic backups", { exact: true }),
  ).toBeVisible();

  await page.keyboard.press("End");
  await expect(privacyTab).toBeFocused();
  await expect(privacyTab).toHaveAttribute("aria-selected", "true");

  await page.getByRole("button", { name: /System diagnostics/ }).click();
  await expect(
    page.getByRole("heading", { name: "System diagnostics", level: 2 }),
  ).toBeFocused();

  await page
    .getByRole("button", { name: /Back to privacy & maintenance/ })
    .click();
  await expect(
    page.getByRole("button", { name: /Recent activity/ }),
  ).toBeFocused();
});
