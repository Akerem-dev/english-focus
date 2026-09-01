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

function escapeRegExp(value: string): RegExp {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
}

async function clearGrammarProgress(page: Page) {
  await page.goto("/");
  await page.evaluate((key) => window.localStorage.removeItem(key), GRAMMAR_PROGRESS_KEY);
}

async function finishRemainingQuiz(page: Page) {
  for (let index = 1; index < QUICK_QUIZ_ANSWERS.length; index += 1) {
    await page.getByRole("button", { name: "Next question →", exact: true }).click();
    await page
      .getByRole("button", { name: escapeRegExp(QUICK_QUIZ_ANSWERS[index]!) })
      .click();
    await page.getByRole("button", { name: "Check answer", exact: true }).click();
    await expect(page.getByText("✓ Correct", { exact: true })).toBeVisible();
  }

  await page.getByRole("button", { name: "See result", exact: true }).click();
}

test("Stage 4 gives Practice a full-size readable learning flow", async ({ page }) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await clearGrammarProgress(page);
  await page.goto("/#/grammar");

  await page.getByRole("button", { name: "Practice · 0/5", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Practice", level: 1 })).toBeVisible();

  const masteryBox = await page.locator(".wvg-v16-mastery").boundingBox();
  const modeCards = page.locator(".wvg-v16-mode-menu > button");
  const firstModeBox = await modeCards.first().boundingBox();

  expect(masteryBox).not.toBeNull();
  expect(masteryBox!.height).toBeGreaterThanOrEqual(95);
  await expect(modeCards).toHaveCount(3);
  expect(firstModeBox).not.toBeNull();
  expect(firstModeBox!.height).toBeGreaterThanOrEqual(200);

  await page.getByRole("button", { name: /Guided Practice/i }).click();
  const guidedPrompt = await page.locator(".wvg-v16-prompt-card").boundingBox();
  expect(guidedPrompt).not.toBeNull();
  expect(guidedPrompt!.height).toBeGreaterThanOrEqual(250);

  await page.getByRole("button", { name: "Reveal answer", exact: true }).click();
  const guidedAnswer = page.locator(".wvg-v16-guided-answer");
  const selfCheck = page.locator(".wvg-v16-self-check");
  await expect(guidedAnswer).toBeVisible();
  await expect(selfCheck).toBeVisible();
  const selfCheckBox = await selfCheck.boundingBox();
  expect(selfCheckBox).not.toBeNull();
  expect(selfCheckBox!.height).toBeGreaterThanOrEqual(68);

  await page.getByRole("button", { name: "← Practice menu", exact: true }).click();
  await page.getByRole("button", { name: /Quick Quiz/i }).click();
  await expect(page.getByText("QUICK QUIZ 1 / 5", { exact: true })).toBeVisible();

  const firstCorrect = page.getByRole("button", {
    name: escapeRegExp(QUICK_QUIZ_ANSWERS[0]!)
  });
  await firstCorrect.click();
  const selectedBox = await firstCorrect.boundingBox();
  expect(selectedBox).not.toBeNull();
  expect(selectedBox!.height).toBeGreaterThanOrEqual(54);

  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.getByText("✓ Correct", { exact: true })).toBeVisible();
  await expect(firstCorrect).toHaveAttribute("data-correct", "true");

  const feedback = page.locator(".wvg-v16-feedback");
  const feedbackBox = await feedback.boundingBox();
  const feedbackBorder = await feedback.evaluate((element) =>
    Number.parseFloat(window.getComputedStyle(element).borderLeftWidth)
  );
  expect(feedbackBox).not.toBeNull();
  expect(feedbackBox!.height).toBeGreaterThanOrEqual(88);
  expect(feedbackBorder).toBeGreaterThanOrEqual(5);

  await finishRemainingQuiz(page);
  await expect(page.getByText("QUICK QUIZ COMPLETE", { exact: true })).toBeVisible();
  await expect(page.getByText("5 / 5 correct", { exact: true })).toBeVisible();

  const result = page.locator(".wvg-v16-result");
  const resultBox = await result.boundingBox();
  const scoreSize = await result.locator("> strong").evaluate((element) =>
    Number.parseFloat(window.getComputedStyle(element).fontSize)
  );
  expect(resultBox).not.toBeNull();
  expect(resultBox!.width).toBeGreaterThan(850);
  expect(resultBox!.height).toBeGreaterThanOrEqual(300);
  expect(scoreSize).toBeGreaterThanOrEqual(44);

  await page.setViewportSize({ width: 1180, height: 760 });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
