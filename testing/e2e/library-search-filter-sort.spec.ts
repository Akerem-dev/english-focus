import { expect, test } from "./app.fixture";

test("Library searches, filters, and sorts the effective catalog", async ({ page }) => {
  await page.goto("/#/library");
  await expect(page.getByRole("table", { name: "Saved vocabulary list" })).toBeVisible();
  await expect(page.locator(".library-entry-count strong")).toHaveText("1");
  await page.getByLabel("Search library").fill("not-present");
  await expect(page.getByRole("heading", { name: "No library entries match" })).toBeVisible();
  await expect(page.locator(".library-entry-count strong")).toHaveText("0");
  await page.getByLabel("Search library").fill("");
  await page.getByRole("button", { name: "Show words starting with M" }).click();
  await expect(page.getByRole("button", { name: "Show words starting with M" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await page.getByRole("button", { name: "Filters" }).click();
  await page.getByLabel("Filter by layer").selectOption("core");
  await page.getByLabel("Sort results").selectOption("word-desc");
  await expect(
    page
      .getByRole("table", { name: "Saved vocabulary list" })
      .getByText("maintain", { exact: true })
  ).toBeVisible();
});
