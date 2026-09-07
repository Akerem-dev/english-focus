import type { Page } from "@playwright/test";

import { expect, test } from "./app.fixture";

const GRAMMAR_PROGRESS_KEY = "word-valley:grammar:progress-v1";
const GRAMMAR_COMPLETION_KEY = "word-valley:grammar:completion-v1";

async function clearGrammarProgress(page: Page) {
  await page.goto("/");
  await page.evaluate(
    ([progressKey, completionKey]) => {
      window.localStorage.removeItem(progressKey);
      window.localStorage.removeItem(completionKey);
    },
    [GRAMMAR_PROGRESS_KEY, GRAMMAR_COMPLETION_KEY]
  );
}

test("Grammar Wordie stays grammar-only, uses the Search rail, and answers starters", async ({
  page
}) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await clearGrammarProgress(page);
  await page.goto("/#/grammar");

  await page.getByRole("button", { name: "Open Wordie", exact: true }).click();
  const homeHelper = page.getByRole("dialog", { name: "Grammar helper" });
  await expect(homeHelper).toBeVisible();
  await expect(homeHelper).toHaveCSS("border-radius", "0px");

  const railBox = await homeHelper.boundingBox();
  expect(railBox).not.toBeNull();
  if (railBox !== null) {
    expect(Math.abs(railBox.width - 382)).toBeLessThanOrEqual(2);
    expect(Math.abs(railBox.x + railBox.width - 1664)).toBeLessThanOrEqual(2);
    expect(Math.abs(railBox.y - 46)).toBeLessThanOrEqual(2);
    expect(Math.abs(railBox.height - 890)).toBeLessThanOrEqual(2);
  }

  const explainAtHome = homeHelper.getByRole("button", { name: /Explain a rule/i });
  await expect(explainAtHome).toBeVisible();
  await expect(explainAtHome).toBeEnabled();
  await expect(homeHelper.getByRole("button", { name: /Compare grammar points/i })).toBeVisible();
  await expect(homeHelper.getByText("Explain a word", { exact: true })).toHaveCount(0);
  await expect(homeHelper.getByText("Explore in context", { exact: true })).toHaveCount(0);
  await expect(homeHelper.locator(".wv84-quick-actions__arrow")).toHaveCount(0);

  await explainAtHome.click();
  await expect(homeHelper.locator(".wv84-wordie-answer__body")).toBeVisible();
  await expect(homeHelper.locator(".wv84-wordie-answer__body")).toContainText(/Kısa mantık:/i);
  await expect(homeHelper.locator(".wv84-wordie-answer__body")).toContainText(/have\/has \+ V3/i);
  await expect(explainAtHome).toBeVisible();
  await expect(explainAtHome).toBeEnabled();
  await expect(homeHelper.getByRole("button", { name: /Compare grammar points/i })).toBeEnabled();
  await page.getByRole("button", { name: "Close Wordie", exact: true }).click();

  await page.getByRole("button", { name: /Resume lesson/i }).click();
  await expect(page.getByRole("heading", { name: "Present Perfect", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Open Wordie", exact: true }).click();

  const lessonHelper = page.getByRole("dialog", { name: "Grammar helper" });
  await expect(lessonHelper).toBeVisible();
  await expect(lessonHelper.getByRole("button", { name: /Explain this rule/i })).toBeVisible();
  await expect(
    lessonHelper.getByRole("button", { name: /Compare with Past Simple/i })
  ).toBeVisible();
  await expect(lessonHelper.getByText("Explain a word", { exact: true })).toHaveCount(0);
  await expect(lessonHelper.getByText("Explore in context", { exact: true })).toHaveCount(0);

  const composer = lessonHelper.getByPlaceholder("Ask about this grammar...");
  await expect(composer).toBeVisible();
  const explainThisRule = lessonHelper.getByRole("button", { name: /Explain this rule/i });
  await explainThisRule.click();
  await expect(composer).toHaveValue("");
  await expect(lessonHelper.locator(".wv84-wordie-answer__body")).toBeVisible();
  await expect(lessonHelper.locator(".wv84-wordie-answer__body")).toContainText(/Kısa mantık:/i);
  await expect(lessonHelper.locator(".wv84-wordie-answer__body")).toContainText(/bitmiş bir zaman/i);
  await expect(explainThisRule).toBeVisible();
  await expect(explainThisRule).toBeEnabled();
  await expect(
    lessonHelper.getByRole("button", { name: /Compare with Past Simple/i })
  ).toBeEnabled();
});

test("lesson overview keeps its metadata visible and completion uses a readable tick", async ({
  page
}) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await clearGrammarProgress(page);
  await page.goto("/#/grammar");

  const presentSimple = page.getByRole("button", {
    name: "Present Simple, 0 of 5 complete",
    exact: true
  });
  await expect(presentSimple).toBeVisible();
  await expect(presentSimple).not.toHaveCSS("background-color", "rgb(7, 89, 77)");
  await presentSimple.click();

  const hero = page.locator(".wvg-v15-overview-hero");
  const metadata = hero.locator("em");
  await expect(metadata).toBeVisible();
  await expect(metadata).toContainText("Level A1");

  const heroBox = await hero.boundingBox();
  const metadataBox = await metadata.boundingBox();
  expect(heroBox).not.toBeNull();
  expect(metadataBox).not.toBeNull();
  if (heroBox !== null && metadataBox !== null) {
    expect(metadataBox.y + metadataBox.height).toBeLessThanOrEqual(heroBox.y + heroBox.height);
  }

  const markComplete = page.getByRole("button", { name: "✓ Mark complete", exact: true });
  await markComplete.click();
  const undoComplete = page.getByRole("button", { name: "✓ Completed · Undo", exact: true });
  await expect(undoComplete).toBeVisible();

  await undoComplete.click();
  await expect(markComplete).toBeVisible();
  await markComplete.click();
  await page.getByRole("button", { name: "← Grammar", exact: true }).click();

  const completedCard = page.getByRole("button", {
    name: "Present Simple, 0 of 5 complete",
    exact: true
  });
  await expect(completedCard).toBeVisible();
  await expect(completedCard).toHaveAttribute("data-status", "complete");
  await expect(completedCard).toHaveCSS("background-color", "rgb(250, 245, 234)");
  await expect(completedCard.locator(".wvg-v13-book__title")).toHaveCSS("color", "rgb(16, 45, 39)");
  await expect(completedCard.locator(".wvg-v13-book__status")).toHaveText("✓");
  await expect(completedCard.locator(".wvg-v13-book__status")).toBeVisible();

  await completedCard.click();
  await page.getByRole("button", { name: "✓ Completed · Undo", exact: true }).click();
  await page.getByRole("button", { name: "← Grammar", exact: true }).click();

  const unmarkedCard = page.getByRole("button", {
    name: "Present Simple, 0 of 5 complete",
    exact: true
  });
  await expect(unmarkedCard).toHaveAttribute("data-status", "not-started");
  await expect(unmarkedCard.locator(".wvg-v13-book__status")).toBeHidden();
});
