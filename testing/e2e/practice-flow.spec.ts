import { expect, test } from "./app.fixture";

async function expectNoDocumentOverflow(page: import("@playwright/test").Page) {
  const dimensions = await page.evaluate(() => ({
    clientHeight: document.documentElement.clientHeight,
    clientWidth: document.documentElement.clientWidth,
    scrollHeight: document.documentElement.scrollHeight,
    scrollWidth: document.documentElement.scrollWidth
  }));

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  expect(dimensions.scrollHeight).toBeLessThanOrEqual(dimensions.clientHeight);
}

test("Practice home exposes adaptive expedition and every silent training ground", async ({
  page
}) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await page.goto("/#/practice");

  await expect(
    page.getByRole("heading", { name: "Strengthen what you know.", level: 1 })
  ).toBeVisible();
  await expect(page.getByText("The Northern Trail", { exact: true })).toBeVisible();

  for (const mode of [
    "Memory Grove",
    "Word Forge",
    "Context Bridge",
    "Phrase Falls",
    "Mistake Mine",
    "Recall Summit"
  ]) {
    await expect(page.getByRole("button", { name: new RegExp(mode, "i") })).toBeVisible();
  }

  await expect(page.locator('audio')).toHaveCount(0);
  await expect(page.getByRole("button", { name: /listen|play audio|pronunciation audio/i })).toHaveCount(
    0
  );

  const dueChip = page.locator(".wvp-expedition-card__chips span").first();
  await expect(dueChip).toContainText(/\d+ due/);
  await expectNoDocumentOverflow(page);
});

test("Practice opens Northern Trail, Memory Grove and contextual Wordie", async ({ page }) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await page.goto("/#/practice");

  await page.getByRole("button", { name: /Begin expedition/i }).click();
  await expect(page.getByRole("heading", { name: "The Northern Trail", level: 1 })).toBeVisible();
  await expect(page.getByText(/STAGE 1 OF 4/i)).toBeVisible();
  await page.getByRole("button", { name: "← Practice Home" }).click();

  await page.getByRole("button", { name: /Memory Grove/i }).click();
  await expect(page.getByRole("heading", { name: "Memory Grove", level: 1 })).toBeVisible();

  const wordieContext = page.getByRole("button", {
    name: "Wordie can explain close meanings.",
    exact: true
  });
  await expect(wordieContext).toBeVisible();
  await wordieContext.click();

  await expect(page.getByRole("dialog", { name: "Word helper" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Close Wordie" })).toBeVisible();
});

test("Practice remains viewport-safe at the minimum desktop size", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 600 });
  await page.goto("/#/practice");

  await expect(
    page.getByRole("heading", { name: "Strengthen what you know.", level: 1 })
  ).toBeVisible();
  await expectNoDocumentOverflow(page);
});
