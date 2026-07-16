import { expect, test } from "./app.fixture";

test("backup manager exposes an honest empty desktop state", async ({ page }) => {
  await page.goto("/#/settings");
  await page.getByRole("button", { name: "Manage backups" }).click();
  await expect(page.getByRole("dialog", { name: "Backup management" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "No retained backups yet" })).toBeVisible();
});
