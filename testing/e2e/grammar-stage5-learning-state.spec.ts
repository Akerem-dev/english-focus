import type { Page } from "@playwright/test";

import { expect, test } from "./app.fixture";

const GRAMMAR_PROGRESS_KEY = "word-valley:grammar:progress-v1";
const QUICK_QUIZ_ANSWERS = Object.freeze([
  "I have gone to the store.",
  "She has finished her work.",
  "I saw him yesterday.",
  "Subject + have / has + past participle (V3)",
  "Experience/result/unfinished time with a connection to now; no finished past time is named."
]);

function exactAnswer(value: string): RegExp {
  return new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
}

async function clearGrammarProgress(page: Page) {
  await page.goto("/");
  await page.evaluate((key) => window.localStorage.removeItem(key), GRAMMAR_PROGRESS_KEY);
}

test("Stage 5 makes session progress and saved mastery consequences explicit", async ({ page }) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await clearGrammarProgress(page);
  await page.goto("/#/grammar");

  await page.getByRole("button", { name: "Practice · 0/5", exact: true }).click();
  await page.getByRole("button", { name: /Quick Quiz/i }).click();

  const progress = page.getByRole("progressbar", { name: "Quick Quiz progress" });
  await expect(progress).toBeVisible();
  await expect(progress).toHaveAttribute("max", "5");
  await expect(progress).toHaveAttribute("value", "1");
  await expect(page.getByText("1 of 5", { exact: true })).toBeVisible();

  for (let index = 0; index < QUICK_QUIZ_ANSWERS.length; index += 1) {
    await page.getByRole("button", { name: exactAnswer(QUICK_QUIZ_ANSWERS[index]!) }).click();
    await page.getByRole("button", { name: "Check answer", exact: true }).click();
    await expect(page.getByText("✓ Correct", { exact: true })).toBeVisible();

    if (index < QUICK_QUIZ_ANSWERS.length - 1) {
      await page.getByRole("button", { name: "Next question →", exact: true }).click();
      await expect(progress).toHaveAttribute("value", String(index + 2));
    }
  }

  await page.getByRole("button", { name: "See result", exact: true }).click();
  await expect(page.getByText("QUICK QUIZ COMPLETE", { exact: true })).toBeVisible();

  const summary = page.locator(".wvg-v22-result-summary");
  await expect(summary).toBeVisible();
  const savedMastery = summary.locator("article").filter({ hasText: "SAVED MASTERY" });
  const reviewCount = summary.locator("article").filter({ hasText: "DECISIONS TO REVIEW" });
  await expect(savedMastery).toContainText("5 / 5");
  await expect(reviewCount).toContainText("None");

  await page.getByRole("button", { name: "Practice menu", exact: true }).click();
  await expect(page.getByLabel("Grammar mastery 5 of 5")).toBeVisible();

  await page.setViewportSize({ width: 1180, height: 760 });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
