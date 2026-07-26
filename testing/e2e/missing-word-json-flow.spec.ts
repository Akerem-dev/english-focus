import { expect, searchVocabulary, test } from "./app.fixture";

test("a missing word opens the review-first word helper", async ({ page }) => {
  await searchVocabulary(page, "allocate");
  await expect(page.getByText("“allocate” was not found")).toBeVisible();

  await page.getByRole("button", { name: "Prepare this word" }).click();

  const dialog = page.getByRole("dialog", { name: "Word helper" });
  const launcher = page.getByRole("button", { name: "Open word helper" });

  await expect(dialog).toBeVisible();
  await expect(page.getByRole("textbox", { name: "English word" })).toHaveValue("allocate");

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(launcher).toBeFocused();

  await launcher.click();
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("textbox", { name: "English word" })).toHaveValue("allocate");
});
