import { expect, test } from "./app.fixture";

test("backup settings expose an honest empty desktop state", async ({ page }) => {
  await page.goto("/#/settings");
  await page.getByRole("tab", { name: /Data & backups/ }).click();

  await expect(page.getByText("Create your first backup", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create first backup" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Manage backups" })).toHaveCount(0);
});
