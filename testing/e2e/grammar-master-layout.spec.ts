import type { Page } from "@playwright/test";

import { expect, test } from "./app.fixture";

const LEGACY_LAST_GRAMMAR_LESSON_KEY = "word-valley:grammar:last-lesson";
const GRAMMAR_PROGRESS_KEY = "word-valley:grammar:progress-v1";

async function clearGrammarState(page: Page) {
  await page.goto("/");
  await page.evaluate(
    ([legacyKey, progressKey]) => {
      window.localStorage.removeItem(legacyKey);
      window.localStorage.removeItem(progressKey);
    },
    [LEGACY_LAST_GRAMMAR_LESSON_KEY, GRAMMAR_PROGRESS_KEY]
  );
}

async function openPresentPerfectFromHome(page: Page) {
  await page.getByRole("button", { name: /Resume lesson/i }).click();
  await expect(page.getByRole("heading", { name: "Present Perfect", level: 1 })).toBeVisible();
}

async function readElementSnapshot(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const round = (value: number) => Math.round(value * 100) / 100;

    return {
      backgroundColor: style.backgroundColor,
      color: style.color,
      display: style.display,
      fontFamily: style.fontFamily,
      height: round(rect.height),
      visibility: style.visibility,
      width: round(rect.width),
      x: round(rect.x),
      y: round(rect.y)
    };
  });
}

async function readSharedChrome(page: Page) {
  const selectors = {
    brand: ".wvclean-sidebar__brand",
    divider: ".wvclean-sidebar__divider",
    navigation: ".wvclean-nav",
    progress: ".wvclean-progress",
    sidebar: ".wvclean-sidebar",
    topbar: ".wvclean-topbar"
  } as const;

  return {
    brand: await readElementSnapshot(page, selectors.brand),
    divider: await readElementSnapshot(page, selectors.divider),
    navigation: await readElementSnapshot(page, selectors.navigation),
    progress: await readElementSnapshot(page, selectors.progress),
    sidebar: await readElementSnapshot(page, selectors.sidebar),
    topbar: await readElementSnapshot(page, selectors.topbar)
  };
}

async function readAssistantShell(page: Page) {
  return {
    composer: await readElementSnapshot(page, ".wv84-assistant-composer"),
    header: await readElementSnapshot(page, ".wv84-assistant-panel__header"),
    panel: await readElementSnapshot(page, ".assistant-panel.wv84-assistant-panel")
  };
}

test("Grammar Home controls work and Present Perfect uses the single V13 overview", async ({
  page
}) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await clearGrammarState(page);
  await page.goto("/#/grammar");

  await expect(page.getByRole("heading", { name: "Grammar Home", level: 1 })).toBeVisible();
  await expect(page.getByText("RECOMMENDED NEXT LESSON", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "A1 · Grammar Foundation", level: 2 })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "A2 · Building Confidence", level: 2 })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "B1 · Express Yourself", level: 2 })
  ).toBeVisible();

  await page.getByLabel("Filter by level").selectOption("A2");
  await expect(
    page.getByRole("heading", { name: "A1 · Grammar Foundation", level: 2 })
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "A2 · Building Confidence", level: 2 })
  ).toBeVisible();

  await page.getByLabel("Filter by status").selectOption("not-started");
  await expect(
    page.getByRole("button", { name: /Present Perfect, 0 of 5 complete/i })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Past Simple, 1 of 5 complete/i })).toHaveCount(0);

  await page.getByLabel("Filter by status").selectOption("all");
  await page.getByLabel("Filter by level").selectOption("all");

  const recommended = page.getByRole("button", { name: "Recommended", exact: true });
  await recommended.click();
  await expect(recommended).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: /Present Simple, 3 of 5 complete/i })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Present Perfect, 0 of 5 complete/i })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /There is \/ There are/i })).toHaveCount(0);
  await recommended.click();

  const a1Shelf = page.locator(".wvg-v13-shelf").filter({ hasText: "A1 · Grammar Foundation" });
  await a1Shelf.getByRole("button", { name: "View all" }).click();
  await expect(
    page.getByRole("heading", { name: "A1 · Grammar Foundation", level: 2 })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "A2 · Building Confidence", level: 2 })
  ).toHaveCount(0);
  await a1Shelf.getByRole("button", { name: "Show all" }).click();
  await expect(
    page.getByRole("heading", { name: "A2 · Building Confidence", level: 2 })
  ).toBeVisible();

  const complete = page.getByRole("button", { name: /Mark as complete/i }).first();
  await complete.click();
  await expect(page.getByRole("button", { name: "Completed", exact: true }).first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Present Perfect, 5 of 5 complete/i })
  ).toBeVisible();

  await openPresentPerfectFromHome(page);

  await expect(page.getByRole("tab")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Core Formula", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "When to Use", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Examples", level: 2 })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Comparison with Past Simple", level: 2 })
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Common Mistake", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Signal Words", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Practice", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Quick Rule", level: 2 })).toBeVisible();
  await expect(page.getByText("I have went to the store.", { exact: true })).toBeVisible();
  await expect(page.getByText("I have gone to the store.", { exact: true })).toBeVisible();

  const quickQuiz = page.getByRole("button", { name: /Quick Quiz/i });
  await quickQuiz.click();
  await expect(quickQuiz).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Grammar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Grammar Home", level: 1 })).toBeVisible();
});

test("each bookshelf card opens the topic it actually names", async ({ page }) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await clearGrammarState(page);
  await page.goto("/#/grammar");

  await page.getByRole("button", { name: /There is \/ There are, 0 of 5 complete/i }).click();
  await expect(page.getByRole("heading", { name: "There is / There are", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Word Order & Agreement", level: 1 })).toHaveCount(
    0
  );
  await expect(page.getByRole("tab")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Core Formula", level: 2 })).toBeVisible();

  await page.getByRole("button", { name: "Grammar", exact: true }).click();
  await page.getByRole("button", { name: /Present Continuous, 1 of 5 complete/i }).click();
  await expect(page.getByRole("heading", { name: "Present Continuous", level: 1 })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Present Simple vs Present Continuous", level: 1 })
  ).toHaveCount(0);
});

test("Grammar always enters through Home instead of restoring an overlapping legacy lesson", async ({
  page
}) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await clearGrammarState(page);
  await page.goto("/#/grammar");
  await openPresentPerfectFromHome(page);

  await page.goto("/#/");
  await page.goto("/#/grammar");

  await expect(page.getByRole("heading", { name: "Grammar Home", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Present Perfect", level: 1 })).toHaveCount(0);
});

test("Grammar uses the exact same topbar and sidebar chrome as Search", async ({ page }) => {
  const viewports = [
    { width: 1664, height: 936 },
    { width: 1366, height: 768 },
    { width: 1180, height: 760 }
  ];

  await clearGrammarState(page);

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);

    await page.goto("/#/");
    await expect(
      page.getByRole("heading", { name: "Discover a new word.", level: 1 })
    ).toBeVisible();
    const searchChrome = await readSharedChrome(page);

    await page.goto("/#/grammar");
    await expect(page.getByRole("heading", { name: "Grammar Home", level: 1 })).toBeVisible();
    const grammarChrome = await readSharedChrome(page);

    expect(grammarChrome).toEqual(searchChrome);

    const dimensions = await page.evaluate(() => ({
      clientHeight: document.documentElement.clientHeight,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      scrollWidth: document.documentElement.scrollWidth
    }));

    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    expect(dimensions.scrollHeight).toBeLessThanOrEqual(dimensions.clientHeight);

    const heroBox = await page.locator(".wvg-v13-hero").boundingBox();
    const bookBox = await page.locator(".wvg-v13-book").first().boundingBox();
    const shelfBox = await page.locator(".wvg-v13-shelf__wood").first().boundingBox();

    expect(heroBox).not.toBeNull();
    expect(bookBox).not.toBeNull();
    expect(shelfBox).not.toBeNull();
    expect(heroBox!.height).toBeCloseTo(219, 0);
    expect(bookBox!.width).toBeCloseTo(158, 0);
    expect(bookBox!.height).toBeCloseTo(88, 0);
    expect(shelfBox!.height).toBeCloseTo(14, 0);
  }
});

test("Grammar Wordie uses the same shared panel shell as Search", async ({ page }) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await clearGrammarState(page);

  await page.goto("/#/");
  await expect(page.getByRole("heading", { name: "Discover a new word.", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Ask Wordie", exact: true }).click();
  await expect(page.locator(".assistant-panel.wv84-assistant-panel")).toBeVisible();
  const searchAssistant = await readAssistantShell(page);

  await page.goto("/#/grammar");
  await openPresentPerfectFromHome(page);
  await page.getByRole("button", { name: "Open Wordie" }).click();
  await expect(page.getByRole("dialog", { name: "Grammar helper" })).toBeVisible();
  const grammarAssistant = await readAssistantShell(page);

  expect(grammarAssistant).toEqual(searchAssistant);
});

test("windowed Grammar keeps shared navigation expanded and Wordie non-blocking", async ({
  page
}) => {
  await page.setViewportSize({ width: 1180, height: 760 });
  await clearGrammarState(page);
  await page.goto("/#/grammar");

  const navigation = page.locator(".wvclean-nav");
  await expect(page.locator(".wvclean-sidebar__brand strong")).toBeVisible();
  await expect(navigation.getByText("Search", { exact: true })).toBeVisible();
  await expect(navigation.getByText("Grammar", { exact: true })).toBeVisible();
  await expect(navigation.getByText("Collections", { exact: true })).toBeVisible();
  await expect(navigation.getByText("Practice", { exact: true })).toBeVisible();
  await expect(navigation.getByText("Favorites", { exact: true })).toBeVisible();
  await expect(navigation.getByText("Settings", { exact: true })).toBeVisible();

  await openPresentPerfectFromHome(page);

  const grammarPage = page.locator(".wvg-page");
  const launcher = page.getByRole("button", { name: "Open Wordie" });
  const helper = page.getByRole("dialog", { name: "Grammar helper" });

  await expect(helper).toHaveCount(0);
  await expect(launcher).toBeVisible();

  const pageBeforeWordie = await grammarPage.boundingBox();
  expect(pageBeforeWordie).not.toBeNull();

  await launcher.click();
  await expect(helper).toBeVisible();

  const pageAfterWordie = await grammarPage.boundingBox();
  expect(pageAfterWordie).not.toBeNull();
  expect(pageAfterWordie).toEqual(pageBeforeWordie);
});
