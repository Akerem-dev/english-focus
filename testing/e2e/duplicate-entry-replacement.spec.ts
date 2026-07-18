import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { expect, searchVocabulary, test } from "./app.fixture";

test("replacement JSON preserves the explicit duplicate-review boundary", async ({ page }) => {
  await searchVocabulary(page, "maintain");
  await page.getByRole("button", { name: "Import JSON" }).click();
  await page
    .getByLabel("Generated vocabulary JSON")
    .fill(
      await readFile(resolve("testing/manual/cp13-maintain-user-duplicate.entry.json"), "utf8")
    );
  await page.getByRole("button", { name: "Check JSON syntax" }).click();
  await page.getByRole("button", { name: "Validate schema" }).click();
  await expect(page.getByText(/Schema validation passed|Content validation/)).toBeVisible();
});
