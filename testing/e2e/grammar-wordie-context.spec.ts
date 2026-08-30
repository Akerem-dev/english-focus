import type { Page } from "@playwright/test";

import { expect, test } from "./app.fixture";

const GRAMMAR_PROGRESS_KEY = "word-valley:grammar:progress-v1";

async function clearGrammarProgress(page: Page) {
  await page.goto("/");
  await page.evaluate((key) => window.localStorage.removeItem(key), GRAMMAR_PROGRESS_KEY);
}

test("Grammar Wordie stays grammar-only and becomes lesson-aware", async ({ page }) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await clearGrammarProgress(page);
  await page.goto("/#/grammar");

  await page.getByRole("button", { name: "Open Wordie", exact: true }).click();
  const homeHelper = page.getByRole("dialog", { name: "Grammar helper" });
  const homeStarters = homeHelper.locator(".wv84-quick-actions--welcome > button:visible");
  await expect(homeHelper).toBeVisible();
  await expect(homeStarters).toHaveCount(2);
  await expect(homeStarters.nth(0)).toContainText("Explain a rule");
  await expect(homeStarters.nth(1)).toContainText("Compare grammar points");
  await expect(homeHelper.getByText("Explain a word", { exact: true })).toHaveCount(0);
  await expect(homeHelper.getByText("Explore in context", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Close Wordie", exact: true }).click();

  await page.getByRole("button", { name: /Resume lesson/i }).click();
  await expect(page.getByRole("heading", { name: "Present Perfect", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Open Wordie", exact: true }).click();

  const lessonHelper = page.getByRole("dialog", { name: "Grammar helper" });
  const lessonStarters = lessonHelper.locator(".wv84-quick-actions--welcome > button:visible");
  await expect(lessonHelper).toBeVisible();
  await expect(lessonStarters).toHaveCount(2);
  await expect(lessonStarters.nth(0)).toContainText("Explain this rule");
  await expect(lessonStarters.nth(1)).toContainText("Compare with Past Simple");
  await expect(lessonHelper.getByText("Explain a word", { exact: true })).toHaveCount(0);
  await expect(lessonHelper.getByText("Explore in context", { exact: true })).toHaveCount(0);

  const composer = lessonHelper.getByPlaceholder("Ask about this grammar...");
  await expect(composer).toBeVisible();
  await lessonStarters.nth(0).click();
  await expect(composer).toHaveValue("Present Perfect kuralını kısa Türkçe mantıkla açıkla.");
});
