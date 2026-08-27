import type { Page } from "@playwright/test";

import { expect, test } from "./app.fixture";

const LAST_GRAMMAR_LESSON_KEY = "word-valley:grammar:last-lesson";

async function clearLastGrammarLesson(page: Page) {
  await page.goto("/");
  await page.evaluate((key) => window.localStorage.removeItem(key), LAST_GRAMMAR_LESSON_KEY);
}

async function openPresentPerfectFromHome(page: Page) {
  await page.getByRole("button", { name: /Resume lesson/i }).click();
  await expect(page.getByRole("heading", { name: "Present Perfect", level: 1 })).toBeVisible();
}

test("first Grammar visit opens the V13 bookshelf home, then the approved lesson master", async ({
  page
}) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await clearLastGrammarLesson(page);
  await page.goto("/#/grammar");

  await expect(page.getByRole("heading", { name: "Grammar Home", level: 1 })).toBeVisible();
  await expect(page.getByText("RECOMMENDED NEXT LESSON", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Present Perfect", level: 2 })).toBeVisible();
  await expect(page.getByText("A1 · Grammar Foundation", { exact: true })).toBeVisible();
  await expect(page.getByText("A2 · Building Confidence", { exact: true })).toBeVisible();
  await expect(page.getByText("B1 · Express Yourself", { exact: true })).toBeVisible();
  await expect(page.getByText("B2+ · Refine & Master", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Present Simple/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Present Perfect/i })).toBeVisible();
  await expect(page.getByPlaceholder("Search grammar topics...")).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Grammar helper" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "English Grammar", level: 1 })).toHaveCount(0);

  await openPresentPerfectFromHome(page);

  await expect(page.getByRole("tab", { name: "Rule", exact: true })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  await expect(page.getByText("CORE FORMULA", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /have \/ has.*past participle/i, level: 2 })
  ).toBeVisible();
  await expect(page.getByText("WHEN TO USE", { exact: true })).toBeVisible();
  await expect(page.getByText("SIGNAL WORDS", { exact: true })).toBeVisible();
  await expect(page.getByText("QUICK DECISION", { exact: true })).toBeVisible();
  await expect(page.getByText("EXAMPLES", { exact: true })).toBeVisible();

  const helper = page.getByRole("dialog", { name: "Grammar helper" });
  await expect(helper).toBeVisible();
  await expect(helper.getByRole("heading", { name: "Wordie AI", level: 2 })).toBeVisible();
  await expect(helper.getByText("Explain this rule", { exact: true })).toBeVisible();
  await expect(helper.getByText("Compare with Past Simple", { exact: true })).toBeVisible();
  await expect(helper.getByText("Give another example", { exact: true })).toBeVisible();
  await expect(helper.getByText("Quiz me", { exact: true })).toBeVisible();
  await expect(helper.getByText("Why is this wrong?", { exact: true })).toBeVisible();
  await expect(helper.getByText("Explain a word", { exact: true })).toHaveCount(0);
  await expect(helper.getByText("Explore in context", { exact: true })).toHaveCount(0);
  await expect(helper.getByPlaceholder("Ask about this grammar...")).toBeVisible();

  const assistantBox = await helper.boundingBox();
  expect(assistantBox).not.toBeNull();
  expect(assistantBox!.width).toBeCloseTo(382, 0);

  await page.getByRole("button", { name: /B1 · TENSES & TIME/i }).click();
  await expect(page.getByRole("heading", { name: "Grammar Home", level: 1 })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Choose a grammar lesson" })).toHaveCount(0);

  await expect(
    page.getByText(
      /LOCAL CACHE|LOCAL KNOWLEDGE|REVIEW QUEUE|TOKEN DURUMU|knowledge base|cache-safe/i
    )
  ).toHaveCount(0);
  await expect(page.getByText(/prototip|prototype|yakında eklenecek/i)).toHaveCount(0);
});

test("Grammar keeps the exact shared Word Valley shell at desktop and windowed widths", async ({
  page
}) => {
  const viewports = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1180, height: 760 }
  ];

  await clearLastGrammarLesson(page);

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/#/grammar");
    await expect(page.getByRole("heading", { name: "Grammar Home", level: 1 })).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      clientHeight: document.documentElement.clientHeight,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight
    }));

    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    expect(dimensions.scrollHeight).toBeLessThanOrEqual(dimensions.clientHeight);

    const topbar = page.locator(".wvclean-topbar");
    const sidebar = page.locator(".wvclean-sidebar");
    const paper = page.locator(".wvg-v13-home__paper");
    const hero = page.locator(".wvg-v13-hero");
    const firstBook = page.locator(".wvg-v13-book").first();
    const shelf = page.locator(".wvg-v13-shelf__wood").first();

    const topbarBox = await topbar.boundingBox();
    const sidebarBox = await sidebar.boundingBox();
    const paperBox = await paper.boundingBox();
    const heroBox = await hero.boundingBox();
    const bookBox = await firstBook.boundingBox();
    const shelfBox = await shelf.boundingBox();

    expect(topbarBox).not.toBeNull();
    expect(sidebarBox).not.toBeNull();
    expect(paperBox).not.toBeNull();
    expect(heroBox).not.toBeNull();
    expect(bookBox).not.toBeNull();
    expect(shelfBox).not.toBeNull();

    expect(topbarBox!.height).toBeCloseTo(46, 0);
    expect(sidebarBox!.x).toBeCloseTo(0, 0);
    expect(sidebarBox!.y).toBeCloseTo(46, 0);
    expect(sidebarBox!.width).toBeCloseTo(318, 0);
    expect(paperBox!.width).toBeCloseTo(1054, 0);
    expect(heroBox!.height).toBeCloseTo(219, 0);
    expect(bookBox!.width).toBeCloseTo(158, 0);
    expect(bookBox!.height).toBeCloseTo(88, 0);
    expect(shelfBox!.height).toBeCloseTo(14, 0);
  }
});
