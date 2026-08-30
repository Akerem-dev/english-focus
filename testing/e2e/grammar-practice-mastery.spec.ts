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

const BE_QUICK_QUIZ_ANSWERS = Object.freeze([
  "I am tired.",
  "They are at home.",
  "Are you ready?",
  "Subject + am / is / are + complement",
  "Move be before the subject to make a question."
]);

const CHALLENGE_ANSWERS = Object.freeze([
  "Present Perfect needs the past participle V3: go → went → gone.",
  "Have/has must be followed by a past participle.",
  "Yesterday is a finished past time, so Past Simple is required."
]);

function escapeRegExp(value: string): RegExp {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
}

async function clearGrammarProgress(page: Page) {
  await page.goto("/");
  await page.evaluate((key) => window.localStorage.removeItem(key), GRAMMAR_PROGRESS_KEY);
}

async function answerChoiceSession(page: Page, answers: readonly string[]) {
  for (let index = 0; index < answers.length; index += 1) {
    await page.getByRole("button", { name: escapeRegExp(answers[index]!) }).click();
    await page.getByRole("button", { name: "Check answer", exact: true }).click();
    await expect(page.getByText("✓ Correct", { exact: true })).toBeVisible();
    await page
      .getByRole("button", {
        name: index === answers.length - 1 ? "See result" : "Next question →",
        exact: true
      })
      .click();
  }
}

test("Present Perfect practice drives mastery and persists it back to the bookshelf", async ({
  page
}) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await clearGrammarProgress(page);
  await page.goto("/#/grammar");

  await page.getByRole("button", { name: "Practice · 0/5", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Practice", level: 1 })).toBeVisible();
  await expect(page.getByLabel("Grammar mastery 0 of 5")).toBeVisible();

  await page.getByRole("button", { name: /Guided Practice/i }).click();
  for (let index = 0; index < 3; index += 1) {
    await page.getByRole("button", { name: "Reveal answer", exact: true }).click();
    await page.getByRole("button", { name: "✓ I got it", exact: true }).click();
  }

  await expect(page.getByText("GUIDED PRACTICE COMPLETE", { exact: true })).toBeVisible();
  await expect(page.getByText("3 / 3 felt secure", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Practice menu", exact: true }).click();
  await expect(page.getByLabel("Grammar mastery 2 of 5")).toBeVisible();

  await page.getByRole("button", { name: /Quick Quiz/i }).click();
  await expect(page.getByText("QUICK QUIZ 1 / 5", { exact: true })).toBeVisible();
  await answerChoiceSession(page, QUICK_QUIZ_ANSWERS);
  await expect(page.getByText("QUICK QUIZ COMPLETE", { exact: true })).toBeVisible();
  await expect(page.getByText("5 / 5 correct", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Practice menu", exact: true }).click();
  await expect(page.getByLabel("Grammar mastery 5 of 5")).toBeVisible();

  const storedProgress = await page.evaluate(
    (key) => window.localStorage.getItem(key),
    GRAMMAR_PROGRESS_KEY
  );
  expect(storedProgress).not.toBeNull();
  expect(JSON.parse(storedProgress!)).toMatchObject({ "present-perfect": 5 });

  await page.getByRole("button", { name: "← Lesson overview", exact: true }).click();
  await expect(page.getByRole("button", { name: /Mastered · Review/i })).toBeVisible();
  await page.getByRole("button", { name: "← Grammar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Present Perfect, 5 of 5 complete", exact: true })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Mastered · Review", exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Grammar Home", level: 1 })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Present Perfect, 5 of 5 complete", exact: true })
  ).toBeVisible();
});

test("A1 curated practice promotes Be mastery and persists it to the bookshelf", async ({ page }) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await clearGrammarProgress(page);
  await page.goto("/#/grammar");

  await page
    .getByRole("button", { name: "Be: am / is / are, 2 of 5 complete", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Be: am / is / are", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Mastery 2/5 · Practice", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Practice", level: 1 })).toBeVisible();
  await expect(page.getByLabel("Grammar mastery 2 of 5")).toBeVisible();

  await page.getByRole("button", { name: /Quick Quiz/i }).click();
  await expect(page.getByText("QUICK QUIZ 1 / 5", { exact: true })).toBeVisible();
  await answerChoiceSession(page, BE_QUICK_QUIZ_ANSWERS);
  await expect(page.getByText("QUICK QUIZ COMPLETE", { exact: true })).toBeVisible();
  await expect(page.getByText("5 / 5 correct", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Practice menu", exact: true }).click();
  await expect(page.getByLabel("Grammar mastery 5 of 5")).toBeVisible();

  const storedProgress = await page.evaluate(
    (key) => window.localStorage.getItem(key),
    GRAMMAR_PROGRESS_KEY
  );
  expect(storedProgress).not.toBeNull();
  expect(JSON.parse(storedProgress!)).toMatchObject({ "be-am-is-are": 5 });

  await page.getByRole("button", { name: "← Lesson overview", exact: true }).click();
  await expect(page.getByRole("button", { name: /Mastered · Review/i })).toBeVisible();
  await page.getByRole("button", { name: "← Grammar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Be: am / is / are, 5 of 5 complete", exact: true })
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("button", { name: "Be: am / is / are, 5 of 5 complete", exact: true })
  ).toBeVisible();
});

test("Challenge tests error reasoning and preserves mastered status", async ({ page }) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await clearGrammarProgress(page);
  await page.goto("/#/grammar");
  await page.evaluate(
    (key) => window.localStorage.setItem(key, JSON.stringify({ "present-perfect": 5 })),
    GRAMMAR_PROGRESS_KEY
  );
  await page.reload();

  await page.getByRole("button", { name: "Mastered · Review", exact: true }).click();
  await expect(page.getByLabel("Grammar mastery 5 of 5")).toBeVisible();
  await page.getByRole("button", { name: /Challenge/i }).click();
  await expect(page.getByText("CHALLENGE 1 / 3", { exact: true })).toBeVisible();

  await answerChoiceSession(page, CHALLENGE_ANSWERS);
  await expect(page.getByText("CHALLENGE COMPLETE", { exact: true })).toBeVisible();
  await expect(page.getByText("3 / 3 correct", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Practice menu", exact: true }).click();
  await expect(page.getByLabel("Grammar mastery 5 of 5")).toBeVisible();
});
