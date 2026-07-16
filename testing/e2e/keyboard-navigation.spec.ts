import { expect, test } from "./app.fixture";

test("primary navigation and command bar remain keyboard reachable", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByText("Skip to content")).toBeFocused();
  await page.keyboard.press("Control+k");
  await page.getByLabel("Search commands").press("ArrowDown");
  await page.getByLabel("Search commands").press("Escape");
  await expect(page.getByRole("dialog", { name: "Command bar" })).toBeHidden();
});
