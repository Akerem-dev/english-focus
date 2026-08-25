import type { Page } from "@playwright/test";

import { expect, test } from "./app.fixture";

const LAST_GRAMMAR_LESSON_KEY = "word-valley:grammar:last-lesson";

async function clearLastGrammarLesson(page: Page) {
  await page.goto("/");
  await page.evaluate((key) => window.localStorage.removeItem(key), LAST_GRAMMAR_LESSON_KEY);
}

async function openPresentPerfectFromCurriculum(page: Page) {
  await page.getByRole("button", { name: /Present Perfect & Past Simple/i }).click();
  await expect(page.getByRole("heading", { name: "Present Perfect", level: 1 })).toBeVisible();
}

test("first Grammar visit opens the ordered curriculum, then the approved lesson master", async ({
  page
}) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await clearLastGrammarLesson(page);
  await page.goto("/#/grammar");

  await expect(
    page.getByRole("heading", { name: "Learn grammar in the right order.", level: 1 })
  ).toBeVisible();
  await expect(page.getByText("EASIER", { exact: false })).toBeVisible();
  for (const level of ["A1", "A2", "B1", "B2", "C1"]) {
    await expect(page.getByText(level, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByRole("button", { name: /Start learning/i })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Grammar helper" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "English Grammar", level: 1 })).toHaveCount(0);

  await openPresentPerfectFromCurriculum(page);

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

  await page.getByRole("button", { name: /B1 · TENSES & TIME/i }).click();
  await expect(
    page.getByRole("heading", { name: "Learn grammar in the right order.", level: 1 })
  ).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Choose a grammar lesson" })).toHaveCount(0);

  await expect(
    page.getByText(
      /LOCAL CACHE|LOCAL KNOWLEDGE|REVIEW QUEUE|TOKEN DURUMU|knowledge base|cache-safe/i
    )
  ).toHaveCount(0);
  await expect(page.getByText(/prototip|prototype|yakında eklenecek/i)).toHaveCount(0);
});

test("Grammar lesson paper meets Wordie cleanly at common desktop and laptop resolutions", async ({
  page
}) => {
  const viewports = [
    { width: 1920, height: 1080 },
    { width: 1536, height: 864 },
    { width: 1366, height: 768 },
    { width: 900, height: 600 }
  ];

  await page.setViewportSize(viewports[0]);
  await clearLastGrammarLesson(page);
  await page.goto("/#/grammar");
  await openPresentPerfectFromCurriculum(page);

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/#/grammar");
    await expect(page.getByRole("heading", { name: "Present Perfect", level: 1 })).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      clientHeight: document.documentElement.clientHeight,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight
    }));

    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    expect(dimensions.scrollHeight).toBeLessThanOrEqual(dimensions.clientHeight);

    const stage = page.locator(".word-valley-stage");
    const lesson = page.locator(".wvg-v12-lesson");
    const rail = page.locator('.assistant-dock.wv84-assistant[data-open="true"]');
    const stageBox = await stage.boundingBox();
    const lessonBox = await lesson.boundingBox();
    const railBox = await rail.boundingBox();

    expect(stageBox).not.toBeNull();
    expect(lessonBox).not.toBeNull();
    expect(railBox).not.toBeNull();
    expect(stageBox!.x).toBeGreaterThanOrEqual(-1);
    expect(stageBox!.y).toBeGreaterThanOrEqual(-1);
    expect(stageBox!.width).toBeCloseTo(viewport.width, 0);
    expect(stageBox!.height).toBeCloseTo(viewport.height, 0);

    const lessonRight = lessonBox!.x + lessonBox!.width;
    const railRight = railBox!.x + railBox!.width;
    expect(lessonRight).toBeLessThanOrEqual(viewport.width + 1);
    expect(railRight).toBeLessThanOrEqual(viewport.width + 1);

    if (viewport.width > 900) {
      const seam = Math.abs(lessonRight - railBox!.x);
      const styles = await page.evaluate(() => {
        const frame = document.querySelector<HTMLElement>(".application-frame--grammar-cleanroom");
        const lessonElement = document.querySelector<HTMLElement>(".wvg-v12-lesson");
        const railElement = document.querySelector<HTMLElement>(
          '.assistant-dock.wv84-assistant[data-open="true"]'
        );
        return {
          railToken: frame === null ? "missing" : getComputedStyle(frame).getPropertyValue("--wvg-rail-width"),
          lessonRight: lessonElement === null ? "missing" : getComputedStyle(lessonElement).right,
          lessonWidth: lessonElement === null ? "missing" : getComputedStyle(lessonElement).width,
          railWidth: railElement === null ? "missing" : getComputedStyle(railElement).width
        };
      });
      expect(
        seam,
        `viewport=${viewport.width}x${viewport.height} lesson=${JSON.stringify(lessonBox)} rail=${JSON.stringify(railBox)} styles=${JSON.stringify(styles)}`
      ).toBeLessThanOrEqual(2);
    } else {
      const overlay = lessonRight - railBox!.x;
      expect(overlay).toBeGreaterThan(0);
    }
  }
});
