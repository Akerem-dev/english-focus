import { resolve } from "node:path";

import { expect, openImportSource, test } from "./app.fixture";

test("invalid JSON reports an error and accepts a corrected object", async ({ page }) => {
  await page.goto("/");
  await openImportSource(page);
  await page.getByRole("button", { name: /Advanced JSON entry/ }).click();
  await page
    .locator('input[type="file"]')
    .setInputFiles(resolve("testing/manual/cp11-allocate-valid-with-warnings.entry.json"));
  await page.getByRole("button", { name: "Continue to validation" }).click();

  const editor = page.getByLabel("Generated vocabulary JSON");
  await editor.fill("{ invalid }");
  await page.getByRole("button", { name: "Check JSON syntax" }).click();
  await expect(page.getByRole("alert")).toBeVisible();

  await editor.fill('{"schemaVersion":"1.0.0","word":"allocate"}');
  await page.getByRole("button", { name: "Check JSON syntax" }).click();
  await expect(page.getByText("JSON syntax passed")).toBeVisible();
});
