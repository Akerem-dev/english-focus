import type { Page } from "@playwright/test";

import { expect, test } from "./app.fixture";

const B1_LESSONS = Object.freeze([
  {
    title: "Future Continuous",
    formula: "Subject + will be + verb-ing"
  },
  {
    title: "Present Perfect Continuous",
    formula: "Subject + have / has been + verb-ing"
  },
  {
    title: "Modal Perfects",
    formula: "modal + have + past participle (V3)"
  },
  {
    title: "Relative Clauses",
    formula: "noun + relative word + relative clause"
  },
  {
    title: "Passive Voice",
    formula: "subject + be (in the required tense) + past participle (V3)"
  },
  {
    title: "Reported Speech",
    formula: "reporting verb + (that / object) + reported clause"
  }
]);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function openB1Lesson(page: Page, title: string) {
  await page.goto("/#/grammar");
  await page
    .getByRole("button", { name: new RegExp(`^${escapeRegExp(title)}, \\d of 5 complete$`, "i") })
    .click();
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
}

test("every B1 bookshelf topic opens the curated eight-section lesson experience", async ({
  page
}) => {
  await page.setViewportSize({ width: 1664, height: 936 });

  for (const lesson of B1_LESSONS) {
    await openB1Lesson(page, lesson.title);

    await expect(page.locator(".wvg-v15-paper--overview")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Open .* section$/ })).toHaveCount(8);
    await expect(page.getByText(lesson.formula, { exact: true })).toBeVisible();
    await expect(page.getByText("Level B1", { exact: false })).toBeVisible();

    await page.getByRole("button", { name: "← Grammar", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Grammar Home", level: 1 })).toBeVisible();
  }
});

test("B1 lessons teach high-value contrasts instead of generic source summaries", async ({
  page
}) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await openB1Lesson(page, "Passive Voice");

  await page.getByRole("button", { name: "Open Active vs Passive Voice section" }).click();
  await expect(
    page.getByText("The company launched the product in May.", { exact: true })
  ).toBeVisible();
  await expect(page.getByText("The product was launched in May.", { exact: true })).toBeVisible();
  await expect(page.getByText(/focus choice/i)).toBeVisible();

  await page.getByRole("button", { name: "← Lesson overview", exact: true }).click();
  await page.getByRole("button", { name: "← Grammar", exact: true }).click();
  await page.getByRole("button", { name: /^Reported Speech, \d of 5 complete$/i }).click();

  await page.getByRole("button", { name: "Open Common Mistakes section" }).click();
  await expect(page.getByText(/She asked where did I live\./)).toBeVisible();
  await expect(page.getByText(/statement word order/i)).toBeVisible();

  const lessonMap = page.locator(".wvg-v15-lesson-map");
  await lessonMap.getByRole("button", { name: "4 Direct vs Reported Speech", exact: true }).click();
  await expect(page.getByText("Maya said, ‘I am tired.’", { exact: true })).toBeVisible();
  await expect(page.getByText("Maya said that she was tired.", { exact: true })).toBeVisible();
});
