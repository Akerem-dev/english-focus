import type { Page } from "@playwright/test";

import { expect, test } from "./app.fixture";

const A1_LESSONS = Object.freeze([
  {
    title: "Present Simple",
    formula: "Subject + base verb (he/she/it: verb-s/-es)"
  },
  {
    title: "Be: am / is / are",
    formula: "Subject + am / is / are + complement"
  },
  {
    title: "There is / There are",
    formula: "There + is / are + noun (+ place/time)"
  },
  {
    title: "Present Continuous",
    formula: "Subject + am / is / are + verb-ing"
  },
  {
    title: "Can / Could",
    formula: "Subject + can / could + base verb"
  },
  {
    title: "Wh- Questions",
    formula: "Wh-word + auxiliary + subject + main verb?"
  }
]);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function openA1Lesson(page: Page, title: string) {
  await page.goto("/#/grammar");
  await page
    .getByRole("button", { name: new RegExp(`^${escapeRegExp(title)}, \\d of 5 complete$`, "i") })
    .click();
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
}

async function answerCurrentChoice(page: Page) {
  await page.locator(".wvg-v16-choice-list button").first().click();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
}

test("every A1 bookshelf topic opens curated teaching and real practice", async ({ page }) => {
  await page.setViewportSize({ width: 1664, height: 936 });

  for (const lesson of A1_LESSONS) {
    await openA1Lesson(page, lesson.title);

    await expect(page.locator(".wvg-v15-paper--overview")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Open .* section$/ })).toHaveCount(8);
    await expect(page.getByText(lesson.formula, { exact: true })).toBeVisible();
    await expect(page.getByText("Level A1", { exact: false })).toBeVisible();

    await page.getByRole("button", { name: "Open Practice section", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Practice", level: 1 })).toBeVisible();
    await expect(page.getByLabel(/Grammar mastery \d of 5/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Guided Practice/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Quick Quiz/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Challenge/i })).toBeVisible();

    await page.getByRole("button", { name: "← Lesson overview", exact: true }).click();
    await page.getByRole("button", { name: "← Grammar", exact: true }).click();
    await expect(page.getByRole("heading", { name: /Grammar/i, level: 1 })).toBeVisible();
  }
});

test("short A1 lessons generate distinct quiz and challenge reasoning prompts", async ({
  page
}) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await openA1Lesson(page, "There is / There are");
  await page.getByRole("button", { name: "Open Practice section", exact: true }).click();

  await page.getByRole("button", { name: /Quick Quiz/i }).click();
  await expect(page.getByText("QUICK QUIZ 1 / 5", { exact: true })).toBeVisible();
  await expect(page.getByText("Which sentence is correct?", { exact: true })).toBeVisible();
  await expect(page.locator(".wvg-v16-prompt-card h3")).toHaveCount(0);
  await expect(page.locator(".wvg-v16-choice-list")).toContainText("There is two cars outside.");
  await answerCurrentChoice(page);
  await page.getByRole("button", { name: "Next question →", exact: true }).click();

  await expect(page.getByText("QUICK QUIZ 2 / 5", { exact: true })).toBeVisible();
  await expect(page.getByText("Which sentence is correct?", { exact: true })).toBeVisible();
  await expect(page.locator(".wvg-v16-prompt-card h3")).toHaveCount(0);
  await expect(page.locator(".wvg-v16-choice-list")).toContainText("There have a bank here.");
  await answerCurrentChoice(page);
  await page.getByRole("button", { name: "Next question →", exact: true }).click();

  await expect(page.getByText("QUICK QUIZ 3 / 5", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Which answer correctly completes this checkpoint?", { exact: true })
  ).toBeVisible();
  await expect(page.locator(".wvg-v16-prompt-card h3")).toContainText(
    "___ there any shops near here?"
  );

  await page.getByRole("button", { name: "← Practice menu", exact: true }).click();
  await page.getByRole("button", { name: /Challenge/i }).click();

  await expect(page.getByText("CHALLENGE 1 / 3", { exact: true })).toBeVisible();
  await expect(page.locator(".wvg-v16-prompt-card h3")).toContainText("There is two cars outside.");
  await answerCurrentChoice(page);
  await page.getByRole("button", { name: "Next question →", exact: true }).click();

  await expect(page.getByText("CHALLENGE 2 / 3", { exact: true })).toBeVisible();
  await expect(page.locator(".wvg-v16-prompt-card h3")).toContainText("There have a bank here.");
  await answerCurrentChoice(page);
  await page.getByRole("button", { name: "Next question →", exact: true }).click();

  await expect(page.getByText("CHALLENGE 3 / 3", { exact: true })).toBeVisible();
  await expect(page.locator(".wvg-v16-prompt-card h3")).toContainText(
    "Introducing existence vs identifying something"
  );
});
