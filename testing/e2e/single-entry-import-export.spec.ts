import { resolve } from "node:path";

import { expect, openImportSource, test } from "./app.fixture";

test("a single-entry file reaches the shared validation workflow", async ({ page }) => {
  await page.goto("/");
  await openImportSource(page);
  await page.getByRole("button", { name: /One vocabulary entry/ }).click();
  await page
    .locator('input[type="file"]')
    .setInputFiles(resolve("testing/manual/cp11-allocate-valid-with-warnings.entry.json"));
  await expect(page.getByText("File is ready")).toBeVisible();
  await page.getByRole("button", { name: "Continue to validation" }).click();
  await expect(page.getByRole("dialog", { name: "Paste generated JSON" })).toBeVisible();
});
