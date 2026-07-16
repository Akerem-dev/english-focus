import { expect, searchVocabulary, test } from "./app.fixture";

test("a missing word can enter the local JSON workflow", async ({ page }) => {
  await searchVocabulary(page, "allocate");
  await expect(page.getByText("“allocate” was not found")).toBeVisible();
  await page.getByRole("button", { name: "Paste generated JSON" }).click();
  await expect(page.getByRole("dialog", { name: "Paste generated JSON" })).toBeVisible();
  await expect(page.getByText("Expected word: allocate")).toBeVisible();
});
