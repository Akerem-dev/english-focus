import { expect, test } from "./app.fixture";

test("Library selection enables bulk export without a separate toolbar", async ({ page }) => {
  await page.goto("/#/library");
  await expect(page.getByRole("button", { name: "Export selected" })).toBeDisabled();
  await page.getByLabel("Select maintain").check();
  await expect(page.getByRole("button", { name: "Export selected (1)" })).toBeEnabled();
  await page.getByLabel("Select maintain").uncheck();
  await expect(page.getByRole("button", { name: "Export selected" })).toBeDisabled();
  await expect(page.locator('[aria-label="Library selection"]')).toHaveCount(0);
});
