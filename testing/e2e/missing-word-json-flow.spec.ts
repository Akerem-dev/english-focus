import { expect, searchVocabulary, test } from "./app.fixture";

test("a missing word opens the review-first word helper", async ({ page }) => {
  await searchVocabulary(page, "allocate");
  await expect(page.getByText("“allocate” was not found")).toBeVisible();

  await page.getByRole("button", { name: "Prepare this word" }).click();

  await expect(page.getByRole("dialog", { name: "Word helper" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "English word" })).toHaveValue("allocate");
});
