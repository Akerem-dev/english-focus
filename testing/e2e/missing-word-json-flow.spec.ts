import { expect, searchVocabulary, test } from "./app.fixture";

test("a missing word opens the review-first Wordie helper", async ({ page }) => {
  await searchVocabulary(page, "allocate");
  await expect(page.getByText("No match for “allocate”.", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Ask Wordie" }).click();

  const dialog = page.getByRole("dialog", { name: "Word helper" });
  const launcher = page.getByRole("button", { name: "Open Wordie" });
  const input = page.getByRole("textbox", { name: "Ask Wordie" });

  await expect(dialog).toBeVisible();
  await expect(input).toHaveValue("allocate");

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(launcher).toBeFocused();

  await launcher.click();
  await expect(dialog).toBeVisible();
  await expect(input).toHaveValue("allocate");
});
