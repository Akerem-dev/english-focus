import { expect, test } from "./app.fixture";

test("collection selection exposes bulk actions only when words are selected", async ({ page }) => {
  await page.goto("/#/library");
  await expect(page.getByRole("heading", { name: "Your Collections", level: 1 })).toBeVisible();

  await page.getByRole("button", { name: /IELTS Vocabulary/ }).click();
  await expect(page.getByRole("heading", { name: "IELTS Vocabulary", level: 1 })).toBeVisible();
  await expect(page.locator(".wvc-selection-bar")).toHaveCount(0);

  await page.getByLabel("Select maintain").check();
  await expect(page.locator(".wvc-selection-bar")).toBeVisible();
  await expect(
    page.locator(".wvc-selection-bar").getByRole("button", { name: "Export" })
  ).toBeEnabled();
  await expect(
    page.locator(".wvc-selection-bar").getByRole("button", { name: "Move" })
  ).toBeEnabled();

  await page.getByLabel("Select maintain").uncheck();
  await expect(page.locator(".wvc-selection-bar")).toHaveCount(0);
});
