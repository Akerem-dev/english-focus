import { expect, test } from "./app.fixture";

test("Collections searches, sorts, and exposes the effective word catalog", async ({ page }) => {
  await page.goto("/#/library");
  await expect(page.getByRole("heading", { name: "Your Collections", level: 1 })).toBeVisible();
  await expect(page.getByLabel("Your collections")).toBeVisible();

  const search = page.getByLabel("Search collections");
  await search.fill("Academic");
  await expect(page.getByRole("button", { name: /Academic Writing/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /IELTS Vocabulary/ })).toHaveCount(0);

  await search.fill("");
  await page.locator(".wvc-sort-button").click();
  await page.getByRole("menuitemradio", { name: "Name A–Z" }).click();
  await expect(page.locator(".wvc-card__body > strong").first()).toHaveText("Academic Writing");

  await page.getByRole("button", { name: "All Words" }).click();
  await expect(page.getByRole("heading", { name: "All Words", level: 1 })).toBeVisible();
  await expect(page.getByText("maintain", { exact: true })).toBeVisible();
});
