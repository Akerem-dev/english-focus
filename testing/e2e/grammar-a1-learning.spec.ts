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
