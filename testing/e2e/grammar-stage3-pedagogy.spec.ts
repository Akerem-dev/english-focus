import type { Locator, Page } from "@playwright/test";

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

async function pseudoContent(locator: Locator): Promise<string> {
  return locator.evaluate((element) => window.getComputedStyle(element, "::before").content);
}

test("Stage 3 makes curated grammar reasoning visually explicit", async ({ page }) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await clearGrammarState(page);
  await page.goto("/#/grammar");

  await expect(page.getByRole("heading", { name: "Grammar Home", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: /Resume lesson/i }).click();
  await expect(page.getByRole("heading", { name: "Present Perfect", level: 1 })).toBeVisible();

  await page.getByRole("button", { name: "Open Examples section" }).click();
  const exampleSentence = page.locator(".wvg-v15-example-list__sentence strong").first();
  const exampleReason = page.locator(".wvg-v15-example-list article > p").first();
  await expect(exampleSentence).toBeVisible();
  await expect(exampleReason).toBeVisible();

  const sentenceBackground = await exampleSentence.evaluate(
    (element) => window.getComputedStyle(element).backgroundImage
  );
  expect(sentenceBackground).toContain("linear-gradient");
  expect(await pseudoContent(exampleReason)).toContain("WHY IT WORKS");

  await page
    .locator(".wvg-v15-lesson-map button")
    .filter({ hasText: /Mistake/i })
    .click();
  const wrong = page.locator(".wvg-v15-mistake-list__wrong").first();
  const correct = page.locator(".wvg-v15-mistake-list__right").first();
  await expect(wrong).toBeVisible();
  await expect(correct).toBeVisible();

  expect(await pseudoContent(wrong)).toContain("WRONG");
  expect(await pseudoContent(correct)).toContain("CORRECT");
  const [wrongBackground, correctBackground] = await Promise.all([
    wrong.evaluate((element) => window.getComputedStyle(element).backgroundColor),
    correct.evaluate((element) => window.getComputedStyle(element).backgroundColor)
  ]);
  expect(wrongBackground).not.toBe(correctBackground);

  await page
    .locator(".wvg-v15-lesson-map button")
    .filter({ hasText: /Clue|Signal/i })
    .click();
  const clueCloud = page.locator(".wvg-v15-pattern-cloud");
  await expect(clueCloud).toBeVisible();
  const clueProcess = await pseudoContent(clueCloud);
  expect(clueProcess).toContain("SPOT A CLUE");
  expect(clueProcess).toContain("CONFIRM THE MEANING");
  expect(clueProcess).toContain("BUILD THE FORM");

  await page
    .locator(".wvg-v15-lesson-map button")
    .filter({ hasText: /Quick Rule/i })
    .click();
  const ruleList = page.locator(".wvg-v15-rule-list");
  await expect(ruleList).toBeVisible();
  expect(await pseudoContent(ruleList)).toContain("30-SECOND RECALL");
  await expect(ruleList.locator("article").first()).toBeVisible();

  await page.setViewportSize({ width: 1180, height: 760 });
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  );
  expect(horizontalOverflow).toBeLessThanOrEqual(1);
});
