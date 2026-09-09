import type { Page } from "@playwright/test";

import { expect, searchVocabulary, test } from "./app.fixture";

async function expectNoDocumentOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    clientHeight: document.documentElement.clientHeight,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight
  }));

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  expect(dimensions.scrollHeight).toBeLessThanOrEqual(dimensions.clientHeight);
}

test("all primary screens and a long detail state fit the minimum desktop window", async ({
  page
}) => {
  await page.setViewportSize({ width: 900, height: 600 });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Discover a new word", level: 1 })).toBeVisible();
  await expectNoDocumentOverflow(page);

  await searchVocabulary(page, "maintain");
  await expect(page.getByRole("heading", { name: "maintain", level: 1 })).toBeVisible();
  await expectNoDocumentOverflow(page);

  await page.goto("/#/grammar");
  await expect(page.getByRole("heading", { name: "Grammar Home", level: 1 })).toBeVisible();
  await expectNoDocumentOverflow(page);

  await page.goto("/#/library");
  await expect(page.getByRole("heading", { name: "Your Collections", level: 1 })).toBeVisible();
  await expectNoDocumentOverflow(page);

  await page.goto("/#/settings");
  await expect(page.getByRole("heading", { name: "Settings", level: 1 })).toBeVisible();
  await expectNoDocumentOverflow(page);
});

test("primary routes remain viewport-safe at common desktop and laptop resolutions", async ({
  page
}) => {
  const viewports = [
    { width: 1920, height: 1080 },
    { width: 1536, height: 864 },
    { width: 1366, height: 768 },
    { width: 900, height: 600 }
  ];

  const routes = [
    { path: "/", heading: "Discover a new word" },
    { path: "/#/grammar", heading: "Grammar Home" },
    { path: "/#/library", heading: "Your Collections" },
    { path: "/#/settings", heading: "Settings" }
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);

    for (const route of routes) {
      await page.goto(route.path);
      await expect(page.getByRole("heading", { name: route.heading, level: 1 })).toBeVisible();
      await expectNoDocumentOverflow(page);
    }
  }
});
