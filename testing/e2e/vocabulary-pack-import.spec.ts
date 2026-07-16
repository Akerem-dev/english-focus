import { resolve } from "node:path";

import { expect, openImportSource, test } from "./app.fixture";

test("a vocabulary pack is analyzed before persistence", async ({ page }) => {
  await page.goto("/");
  await openImportSource(page);
  await page.getByRole("button", { name: /Vocabulary pack/ }).click();
  await page
    .locator('input[type="file"]')
    .setInputFiles(resolve("testing/manual/cp17-mixed-vocabulary-pack.json"));
  await expect(page.getByText("Selected pack")).toBeVisible();
  await expect(page.getByText("Structurally valid")).toBeVisible();
  await expect(page.getByRole("button", { name: "Import vocabulary pack" })).toBeDisabled();
});
