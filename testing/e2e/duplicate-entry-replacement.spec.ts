import { resolve } from "node:path";

import { expect, openImportSource, test } from "./app.fixture";

test("replacement JSON preserves the explicit duplicate-review boundary", async ({ page }) => {
  await openImportSource(page);
  await page.getByRole("button", { name: /Advanced JSON entry/ }).click();
  await page
    .locator('input[type="file"]')
    .setInputFiles(resolve("testing/manual/cp13-maintain-user-duplicate.entry.json"));
  await page.getByRole("button", { name: "Continue to validation" }).click();
  await page.getByRole("button", { name: "Check JSON syntax" }).click();
  await page.getByRole("button", { name: "Validate schema" }).click();
  await expect(
    page.getByRole("dialog", { name: "Required information is complete" })
  ).toBeVisible();
});
