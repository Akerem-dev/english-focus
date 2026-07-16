import { expect, searchVocabulary, test } from "./app.fixture";

test("an existing core word opens as a Vocabulary state", async ({ page }) => {
  await searchVocabulary(page, "maintains");
  await expect(page.getByRole("article", { name: "maintain vocabulary entry" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "maintain", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Vocabulary entry sections" })).toBeVisible();
});
