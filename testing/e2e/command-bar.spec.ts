import { expect, test } from "./app.fixture";

test("command bar opens from the keyboard and filters commands", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog", { name: "Command bar" })).toBeVisible();
  await page.getByLabel("Search commands").fill("settings");
  await expect(page.getByRole("option", { name: /Open Settings/ })).toBeVisible();
});
