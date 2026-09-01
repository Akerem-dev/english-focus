import type { Page } from "@playwright/test";

import { expect, test } from "./app.fixture";

const LEGACY_LAST_GRAMMAR_LESSON_KEY = "word-valley:grammar:last-lesson";
const GRAMMAR_PROGRESS_KEY = "word-valley:grammar:progress-v1";

async function clearGrammarState(page: Page) {
  await page.goto("/");
  await page.evaluate(
    ([legacyKey, progressKey]) => {
      window.localStorage.removeItem(legacyKey);
      window.localStorage.removeItem(progressKey);
    },
    [LEGACY_LAST_GRAMMAR_LESSON_KEY, GRAMMAR_PROGRESS_KEY]
  );
}

function numericCss(value: string): number {
  return Number.parseFloat(value.replace("px", ""));
}

test("Stage 2 gives Home, Overview, and Detail a dominant readable canvas", async ({ page }) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await clearGrammarState(page);
  await page.goto("/#/grammar");

  await expect(page.getByRole("heading", { name: "Grammar Home", level: 1 })).toBeVisible();

  const homePaper = await page.locator(".wvg-v13-home__paper").boundingBox();
  const homeHero = await page.locator(".wvg-v13-hero").boundingBox();
  const firstBook = page.locator(".wvg-v13-book").first();
  const firstBookBox = await firstBook.boundingBox();
  const firstBookTitleSize = numericCss(
    await firstBook
      .locator(".wvg-v13-book__title")
      .evaluate((element) => window.getComputedStyle(element).fontSize)
  );

  expect(homePaper).not.toBeNull();
  expect(homePaper!.width).toBeGreaterThan(1240);
  expect(homeHero).not.toBeNull();
  expect(homeHero!.height).toBeGreaterThanOrEqual(200);
  expect(firstBookBox).not.toBeNull();
  expect(firstBookBox!.height).toBeGreaterThanOrEqual(145);
  expect(firstBookTitleSize).toBeGreaterThanOrEqual(18);

  await page.getByRole("button", { name: /Resume lesson/i }).click();
  await expect(page.getByRole("heading", { name: "Present Perfect", level: 1 })).toBeVisible();

  const overviewPaper = await page.locator(".wvg-v15-paper--overview").boundingBox();
  const overviewHero = await page.locator(".wvg-v15-overview-hero").boundingBox();
  const overviewCard = await page.locator(".wvg-v15-overview-card").first().boundingBox();
  const overviewCopySize = numericCss(
    await page
      .locator(".wvg-v15-overview-intro p")
      .evaluate((element) => window.getComputedStyle(element).fontSize)
  );

  expect(overviewPaper).not.toBeNull();
  expect(overviewPaper!.width).toBeGreaterThan(1240);
  expect(overviewHero).not.toBeNull();
  expect(overviewHero!.height).toBeGreaterThanOrEqual(210);
  expect(overviewCard).not.toBeNull();
  expect(overviewCard!.height).toBeGreaterThanOrEqual(130);
  expect(overviewCopySize).toBeGreaterThanOrEqual(12);

  await page.getByRole("button", { name: "Open Core Formula section" }).click();
  await expect(page.getByRole("heading", { name: "Core Formula", level: 1 })).toBeVisible();

  const detailPaper = await page.locator(".wvg-v15-paper").boundingBox();
  const lessonMap = await page.locator(".wvg-v15-lesson-map").boundingBox();
  const sectionContent = await page.locator(".wvg-v15-section-content").boundingBox();
  const teachingStack = await page.locator(".wvg-v15-teaching-stack").boundingBox();
  const sectionHeadingSize = numericCss(
    await page
      .locator(".wvg-v15-section-heading h2")
      .evaluate((element) => window.getComputedStyle(element).fontSize)
  );
  const sectionCopySize = numericCss(
    await page
      .locator(".wvg-v15-section-heading p")
      .evaluate((element) => window.getComputedStyle(element).fontSize)
  );

  expect(detailPaper).not.toBeNull();
  expect(detailPaper!.width).toBeGreaterThan(1240);
  expect(lessonMap).not.toBeNull();
  expect(lessonMap!.width).toBeLessThanOrEqual(180);
  expect(sectionContent).not.toBeNull();
  expect(sectionContent!.width).toBeGreaterThan(1000);
  expect(teachingStack).not.toBeNull();
  expect(teachingStack!.width).toBeGreaterThan(sectionContent!.width * 0.9);
  expect(sectionHeadingSize).toBeGreaterThanOrEqual(32);
  expect(sectionCopySize).toBeGreaterThanOrEqual(14);
});
