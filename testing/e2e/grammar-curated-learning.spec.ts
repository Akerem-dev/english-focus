import type { Locator, Page } from "@playwright/test";

import { expect, test } from "./app.fixture";

async function box(locator: Locator) {
  const value = await locator.boundingBox();
  expect(value).not.toBeNull();
  return value!;
}

async function openBeLesson(page: Page) {
  await page.goto("/#/grammar");
  await page.getByRole("button", { name: /Be: am \/ is \/ are, 2 of 5 complete/i }).click();
  await expect(page.getByRole("heading", { name: "Be: am / is / are", level: 1 })).toBeVisible();
}

async function readDetailGeometry(page: Page) {
  return {
    paper: await box(page.locator(".wvg-v15-paper")),
    layout: await box(page.locator(".wvg-v15-detail-layout")),
    map: await box(page.locator(".wvg-v15-lesson-map")),
    content: await box(page.locator(".wvg-v15-section-content"))
  };
}

test("curated Be lesson teaches form meaning examples errors and recall", async ({ page }) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await openBeLesson(page);

  await expect(page.getByText("Subject + am / is / are + complement", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Open .* section$/ })).toHaveCount(8);

  await page.getByRole("button", { name: "Open Core Formula section" }).click();
  await expect(page.getByText("I am", { exact: true })).toBeVisible();
  await expect(page.getByText("He is not / isn’t", { exact: true })).toBeVisible();
  await expect(page.getByText("Are they …?", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Choose the subject first. The subject chooses am, is, or are.", { exact: true })
  ).toBeVisible();

  await page.getByRole("button", { name: "When to Use →" }).click();
  await expect(
    page.getByRole("heading", { name: "Choose the structure because of the meaning", level: 2 })
  ).toBeVisible();
  await expect(page.getByText("Maya is a doctor.", { exact: true })).toBeVisible();
  await expect(page.getByText("TR · Maya bir doktordur.", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Examples →" }).click();
  await expect(page.getByText("Are you busy?", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Move be before the subject; do not add do.", { exact: true })
  ).toBeVisible();

  const lessonMap = page.locator(".wvg-v15-lesson-map");
  await lessonMap.getByRole("button", { name: "5 Common Mistakes", exact: true }).click();
  await expect(page.getByText(/Do you are ready\?/)).toBeVisible();
  await expect(page.getByText(/Are you ready\?/)).toBeVisible();
  await expect(
    page.getByText("Do is not used when be is the main verb.", { exact: true })
  ).toBeVisible();

  await lessonMap.getByRole("button", { name: "6 Common Patterns", exact: true }).click();
  await expect(page.getByText("be + adjective", { exact: true })).toBeVisible();
  await expect(page.getByText("be + interested in", { exact: true })).toBeVisible();
  await expect(page.getByText(/not ‘signal words’ in the tense sense/i)).toBeVisible();

  await lessonMap.getByRole("button", { name: "7 Practice", exact: true }).click();
  await expect(page.getByText("___ you from Ankara?", { exact: true })).toBeVisible();
  await expect(page.getByText("Are", { exact: true })).toBeVisible();
  await expect(page.getByText("5-question Quick Quiz", { exact: true })).toBeVisible();
});

test("curated lesson geometry stays fixed across sections and Wordie overlay", async ({ page }) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await openBeLesson(page);
  await page.getByRole("button", { name: "Open Core Formula section" }).click();

  const formulaGeometry = await readDetailGeometry(page);

  await page.getByRole("button", { name: "When to Use →" }).click();
  const usesGeometry = await readDetailGeometry(page);
  expect(usesGeometry).toEqual(formulaGeometry);

  await page.getByRole("button", { name: "Examples →" }).click();
  const examplesGeometry = await readDetailGeometry(page);
  expect(examplesGeometry).toEqual(formulaGeometry);

  const paperBeforeWordie = await box(page.locator(".wvg-v15-paper"));
  await page.getByRole("button", { name: "Open Wordie" }).click();
  await expect(page.getByRole("dialog", { name: "Grammar helper" })).toBeVisible();
  const paperAfterWordie = await box(page.locator(".wvg-v15-paper"));
  expect(paperAfterWordie).toEqual(paperBeforeWordie);
});
