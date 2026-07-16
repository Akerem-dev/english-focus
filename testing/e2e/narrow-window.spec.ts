import type { Page } from "@playwright/test";

import { expect, searchVocabulary, test } from "./app.fixture";

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
}

test("all primary screens and a long detail state fit the minimum desktop window", async ({
  page
}) => {
  await page.setViewportSize({ width: 900, height: 600 });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Look up an English word" })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await searchVocabulary(page, "maintain");
  await expect(page.getByRole("heading", { name: "maintain", level: 1 })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole("link", { name: "Library" }).click();
  await expect(page.getByRole("heading", { name: "Library", level: 1 })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings", level: 1 })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
