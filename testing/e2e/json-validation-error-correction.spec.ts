import { expect, searchVocabulary, test } from "./app.fixture";

test("invalid JSON reports an error and accepts a corrected object", async ({ page }) => {
  await searchVocabulary(page, "allocate");
  await page.getByRole("button", { name: "Paste generated JSON" }).click();
  const editor = page.getByLabel("Generated vocabulary JSON");
  await editor.fill("{ invalid }");
  await page.getByRole("button", { name: "Check JSON syntax" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await editor.fill('{"schemaVersion":"1.0.0","word":"allocate"}');
  await page.getByRole("button", { name: "Check JSON syntax" }).click();
  await expect(page.getByText("JSON syntax passed")).toBeVisible();
});
