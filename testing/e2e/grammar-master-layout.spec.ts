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

test("Grammar Home controls work and lesson overview sections are real navigation", async ({
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

  await expect(page.locator(".wvg-v13-shelf--preview")).toBeHidden();

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
  await expect(page.getByRole("button", { name: /Past Simple, 0 of 5 complete/i })).toBeVisible();

  await page.getByLabel("Filter by status").selectOption("all");
  await page.getByLabel("Filter by level").selectOption("all");

  const recommended = page.getByRole("button", { name: "Recommended", exact: true });
  await recommended.click();
  await expect(recommended).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: /Present Simple, 0 of 5 complete/i })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Present Perfect, 0 of 5 complete/i })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /There is \/ There are/i })).toHaveCount(0);
  await recommended.click();

  const a1Shelf = page.locator(".wvg-v13-shelf").filter({ hasText: "A1 · Grammar Foundation" });
  const shelfToggle = a1Shelf.getByRole("button", { name: "Focus level" });
  const shelfToggleVisual = await shelfToggle.evaluate((element) => {
    const style = window.getComputedStyle(element);
    const after = window.getComputedStyle(element, "::after");
    return {
      afterContent: after.content,
      color: style.color,
      fontSize: Number.parseFloat(style.fontSize)
    };
  });
  expect(shelfToggleVisual.fontSize).toBeGreaterThan(0);
  expect(shelfToggleVisual.color).not.toBe("rgba(0, 0, 0, 0)");
  expect(shelfToggleVisual.afterContent).toBe("none");

  await shelfToggle.click();
  await expect(
    page.getByRole("heading", { name: "A1 · Grammar Foundation", level: 2 })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "A2 · Building Confidence", level: 2 })
  ).toHaveCount(0);

  const restoreToggle = a1Shelf.getByRole("button", { name: "Show all levels" });
  await expect(restoreToggle).toBeVisible();
  await restoreToggle.click();

  await expect(
    page.getByRole("heading", { name: "A2 · Building Confidence", level: 2 })
  ).toBeVisible();

  await expect(page.getByRole("button", { name: "Practice · 0/5", exact: true })).toBeVisible();
  await openPresentPerfectFromHome(page);

  await expect(page.getByText("Lesson map", { exact: true })).toBeVisible();
  await expect(page.getByText(/short previews, not the full lesson/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /^Open .* section$/ })).toHaveCount(8);
  await expect(page.getByRole("button", { name: "Quick Quiz", exact: true })).toHaveCount(0);

  const grammarBack = page.getByRole("button", { name: "← Grammar" });
  await expect(grammarBack).toBeVisible();
  const grammarBackStyle = await grammarBack.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return {
      borderWidth: Number.parseFloat(style.borderTopWidth),
      height: rect.height,
      opacity: Number.parseFloat(style.opacity)
    };
  });
  expect(grammarBackStyle.height).toBeGreaterThanOrEqual(30);
  expect(grammarBackStyle.borderWidth).toBeGreaterThan(0);
  expect(grammarBackStyle.opacity).toBe(1);

  await page.getByRole("button", { name: "Open Core Formula section" }).click();
  await expect(page.getByRole("heading", { name: "Core Formula", level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: /Core Formula/ })).toHaveAttribute(
    "aria-current",
    "step"
  );

  await page.getByRole("button", { name: "When to Use →" }).click();
  await expect(page.getByRole("heading", { name: "When to Use", level: 1 })).toBeVisible();

  const overviewBack = page.getByRole("button", { name: "← Lesson overview" });
  await expect(overviewBack).toBeVisible();
  const overviewBackBox = await overviewBack.boundingBox();
  expect(overviewBackBox).not.toBeNull();
  expect(overviewBackBox!.height).toBeGreaterThanOrEqual(30);

  await page.getByRole("button", { name: "Lesson overview", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Core Formula", level: 2 })).toBeVisible();

  await page.getByRole("button", { name: "Open Practice section" }).click();
  await expect(page.getByRole("heading", { name: "Practice", level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: /Guided Practice/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Quick Quiz/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Challenge/i })).toBeVisible();
  await expect(page.getByLabel("Grammar mastery 0 of 5")).toBeVisible();

  await page.getByRole("button", { name: "← Lesson overview" }).click();
  await page.getByRole("button", { name: "← Grammar" }).click();
  await expect(page.getByRole("heading", { name: "Grammar Home", level: 1 })).toBeVisible();
});

test("Start lesson enters section one instead of scrolling to a fake practice control", async ({
  page
}) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await clearGrammarState(page);
  await page.goto("/#/grammar");
  await openPresentPerfectFromHome(page);

  await page.getByRole("button", { name: /Start lesson/i }).click();
  await expect(page.getByRole("heading", { name: "Core Formula", level: 1 })).toBeVisible();
  await expect(page.getByText("SECTION 1 OF 8", { exact: true })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "Core Formula", level: 2 })).toBeVisible();

  await page.getByRole("button", { name: "← Grammar" }).click();
  await page.getByRole("button", { name: /Present Continuous, 0 of 5 complete/i }).click();
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
  await page.evaluate(
    ([key, lessonId]) => window.localStorage.setItem(key, lessonId),
    [LEGACY_LAST_GRAMMAR_LESSON_KEY, "present-perfect"]
  );

  await page.goto("/#/grammar");
  await expect(page.getByRole("heading", { name: "Grammar Home", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Present Perfect", level: 1 })).toHaveCount(0);

  await page.goto("/#/");
  await page.goto("/#/grammar");
  await expect(page.getByRole("heading", { name: "Grammar Home", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Present Perfect", level: 1 })).toHaveCount(0);
});

test("Grammar preserves shared chrome while the v18 home grid responds cleanly", async ({
  page
}) => {
  const viewports = [
    { width: 1664, height: 936, expectedColumns: 4 },
    { width: 1366, height: 768, expectedColumns: 4 },
    { width: 1180, height: 760, expectedColumns: 3 }
  ];

  await clearGrammarState(page);

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

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
    const books = page.locator(".wvg-v13-shelf__books").first();
    const bookBox = await page.locator(".wvg-v13-book").first().boundingBox();

    expect(heroBox).not.toBeNull();
    expect(heroBox!.height).toBeGreaterThanOrEqual(180);
    expect(bookBox).not.toBeNull();
    expect(bookBox!.height).toBeGreaterThanOrEqual(132);

    const columnCount = await books.evaluate(
      (element) =>
        window
          .getComputedStyle(element)
          .gridTemplateColumns.split(" ")
          .filter((column) => column.length > 0).length
    );
    expect(columnCount).toBe(viewport.expectedColumns);
  }
});

test("Grammar Wordie uses the v18 bubble, grammar starters, and independent controls", async ({
  page
}) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await clearGrammarState(page);
  await page.goto("/#/grammar");
  await openPresentPerfectFromHome(page);

  const launcher = page.getByRole("button", { name: "Open Wordie" });
  await expect(launcher).toBeVisible();
  const launcherBox = await launcher.boundingBox();
  expect(launcherBox).not.toBeNull();
  expect(launcherBox!.width).toBeCloseTo(62, 0);
  expect(launcherBox!.height).toBeCloseTo(62, 0);
  expect(launcherBox!.x).toBeGreaterThan(1550);
  expect(launcherBox!.y).toBeGreaterThan(840);

  await launcher.click();
  const helper = page.getByRole("dialog", { name: "Grammar helper" });
  await expect(helper).toBeVisible();
  await expect(page.getByRole("button", { name: "Minimize Wordie" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Close Wordie" })).toBeVisible();

  await expect(page.getByRole("button", { name: "Explain this rule", exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Compare with Past Simple", exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Draft lesson template", exact: true })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Explain a word", exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Draft lesson template", exact: true }).click();
  const composer = page.getByLabel("Ask Wordie a grammar question");
  await expect(composer).toHaveValue(/Present Perfect.*8 bölümü/s);
  await expect(composer).toHaveValue(/Core formula.*Common mistakes.*Quick rule/s);

  await page.getByRole("button", { name: "Close Wordie" }).click();
  await expect(helper).toHaveCount(0);
  await expect(launcher).toBeVisible();
});

test("Stage 1 locks Wordie reflow geometry, minimize behavior, and lesson scroll ownership", async ({
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

  await openPresentPerfectFromHome(page);
  await page.getByRole("button", { name: "Open Core Formula section" }).click();
  await expect(page.getByRole("heading", { name: "Core Formula", level: 1 })).toBeVisible();

  const nestedOverflow = await page.evaluate(() => {
    const selectors = [
      ".wvg-v15-paper",
      ".wvg-v15-detail-layout",
      ".wvg-v15-lesson-map",
      ".wvg-v15-section-content",
      ".wvg-v15-teaching-stack"
    ];

    return selectors.map((selector) => {
      const element = document.querySelector(selector);
      return {
        selector,
        overflowY: element === null ? null : window.getComputedStyle(element).overflowY
      };
    });
  });

  for (const entry of nestedOverflow) {
    expect(entry.overflowY, `${entry.selector} must exist`).not.toBeNull();
    expect(["auto", "scroll"], `${entry.selector} must not own a nested scrollbar`).not.toContain(
      entry.overflowY
    );
  }

  await expect(page.locator(".wvg-v15-lesson.wvg-v15-lesson--detail")).toHaveCSS(
    "overflow-y",
    "auto"
  );

  const paper = page.locator(".wvg-v15-paper");
  const paperBeforeWordie = await paper.boundingBox();
  expect(paperBeforeWordie).not.toBeNull();

  const launcher = page.getByRole("button", { name: "Open Wordie" });
  await expect(launcher).toBeVisible();
  const launcherBox = await launcher.boundingBox();
  expect(launcherBox).not.toBeNull();
  expect(launcherBox!.width).toBeCloseTo(62, 0);
  expect(launcherBox!.height).toBeCloseTo(62, 0);

  await launcher.click();
  const helper = page.getByRole("dialog", { name: "Grammar helper" });
  await expect(helper).toBeVisible();

  const paperAfterWordie = await paper.boundingBox();
  const helperBox = await helper.boundingBox();
  expect(paperAfterWordie).not.toBeNull();
  expect(helperBox).not.toBeNull();
  expect(paperAfterWordie!.width).toBeLessThan(paperBeforeWordie!.width);
  expect(paperAfterWordie!.x + paperAfterWordie!.width).toBeLessThanOrEqual(helperBox!.x + 2);

  await page.getByRole("button", { name: "Minimize Wordie" }).click();
  await expect(helper).toHaveCount(0);
  await expect(launcher).toBeVisible();
  await expect(launcher).toBeFocused();

  const paperAfterMinimize = await paper.boundingBox();
  expect(paperAfterMinimize).not.toBeNull();
  expect(paperAfterMinimize!.x).toBeCloseTo(paperBeforeWordie!.x, 1);
  expect(paperAfterMinimize!.width).toBeCloseTo(paperBeforeWordie!.width, 1);
});
