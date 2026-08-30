import type { Page } from "@playwright/test";

import { expect, test } from "./app.fixture";

const A2_LESSONS = Object.freeze([
  {
    title: "Past Simple",
    formula:
      "Positive: Subject + past form (V2) · Negative: did not + base verb · Question: Did + subject + base verb?"
  },
  {
    title: "Used to",
    formula:
      "Positive: Subject + used to + base verb · Negative: didn't use to + base verb · Question: Did + subject + use to + base verb?"
  },
  {
    title: "Present Perfect",
    formula: "Subject + have / has + past participle (V3)"
  },
  {
    title: "Past Continuous",
    formula: "Subject + was / were + verb-ing"
  },
  {
    title: "Going to",
    formula: "Subject + am / is / are + going to + base verb"
  },
  {
    title: "Comparatives",
    formula:
      "short adjective + -er + than · more + long adjective + than · irregular: better / worse / farther-further"
  }
]);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function openA2Lesson(page: Page, title: string) {
  await page.goto("/#/grammar");
  await page
    .getByRole("button", { name: new RegExp(`^${escapeRegExp(title)}, \\d of 5 complete$`, "i") })
    .click();
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
}

test("every A2 bookshelf topic opens a complete curated eight-section lesson", async ({ page }) => {
  await page.setViewportSize({ width: 1664, height: 936 });

  for (const lesson of A2_LESSONS) {
    await openA2Lesson(page, lesson.title);

    await expect(page.locator(".wvg-v15-paper--overview")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Open .* section$/ })).toHaveCount(8);
    await expect(page.getByText(lesson.formula, { exact: true })).toBeVisible();
    await expect(page.getByText("Level A2", { exact: false })).toBeVisible();

    await page.getByRole("button", { name: "← Grammar", exact: true }).click();
    await expect(page.getByRole("heading", { name: /Grammar/i, level: 1 })).toBeVisible();
  }
});

test("Present Perfect A2 lesson teaches form meaning timing and high-value confusions", async ({
  page
}) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await openA2Lesson(page, "Present Perfect");

  await page.getByRole("button", { name: "Open Core Formula section" }).click();
  await expect(page.getByText("We have finished.", { exact: true })).toBeVisible();
  await expect(page.getByText("Has she finished?", { exact: true })).toBeVisible();

  const lessonMap = page.locator(".wvg-v15-lesson-map");
  await lessonMap.getByRole("button", { name: "3 Examples", exact: true }).click();
  await expect(
    page.getByText("Maya has been to Rome, but Leo has gone to Rome.", { exact: true })
  ).toBeVisible();
  await expect(page.getByText(/visited and returned/i)).toBeVisible();

  await lessonMap
    .getByRole("button", { name: "4 Present Perfect vs Past Simple", exact: true })
    .click();
  await expect(page.getByText("I visited Paris last summer.", { exact: true })).toBeVisible();
  await expect(page.getByText(/Ask 'When\?'/i)).toBeVisible();

  await lessonMap.getByRole("button", { name: "5 Common Mistakes", exact: true }).click();
  await expect(page.getByText(/I have went to the store\./)).toBeVisible();
  await expect(page.getByText(/go → went → gone/i)).toBeVisible();

  await lessonMap
    .getByRole("button", { name: "6 Common Time & Experience Clues", exact: true })
    .click();
  await expect(page.getByText("since", { exact: true })).toBeVisible();
  await expect(page.getByText("for", { exact: true })).toBeVisible();

  await lessonMap.getByRole("button", { name: "7 Practice", exact: true }).click();
  await expect(page.getByRole("button", { name: /Guided Practice/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Quick Quiz/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Challenge/i })).toBeVisible();
  await expect(page.getByLabel("Grammar mastery 0 of 5")).toBeVisible();

  await page.getByRole("button", { name: /Guided Practice/i }).click();
  await expect(
    page.getByText("Complete: She ___ already ___ (finish) the report.", { exact: true })
  ).toBeVisible();
  await page.getByRole("button", { name: "Reveal answer", exact: true }).click();
  await expect(page.getByText("has already finished", { exact: true })).toBeVisible();
});
