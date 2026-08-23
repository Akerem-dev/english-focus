import { expect, test, type Page } from "./app.fixture";

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
  await expect(page.getByRole("button", { name: /Begin first lesson/i })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Grammar helper" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "English Grammar", level: 1 })).toHaveCount(0);

  await openPresentPerfectFromCurriculum(page);

  await expect(page.getByText("CORE FORMULA · TEMEL YAPI", { exact: true })).toBeVisible();
  await expect(page.getByText("past participle (V3)", { exact: true })).toBeVisible();
  await expect(page.getByText("WHEN TO USE · NE ZAMAN?", { exact: true })).toBeVisible();
  await expect(page.getByText("COMMON SIGNAL WORDS · İPUÇLARI", { exact: true })).toBeVisible();
  await expect(page.getByText("PRESENT PERFECT vs. PAST SIMPLE", { exact: true })).toBeVisible();
  await expect(page.getByText("EXAMPLES · ÖRNEKLER", { exact: true })).toBeVisible();
  await expect(page.getByText("KISA KURAL", { exact: true })).toBeVisible();

  const helper = page.getByRole("dialog", { name: "Grammar helper" });
  await expect(helper).toBeVisible();
  await expect(helper.getByRole("heading", { name: "Wordie AI", level: 2 })).toBeVisible();
  await expect(helper.getByText("Explain this rule", { exact: true })).toBeVisible();
  await expect(helper.getByText("Compare with Past Simple", { exact: true })).toBeVisible();
  await expect(helper.getByText("Quiz this grammar", { exact: true })).toBeVisible();
  await expect(helper.getByText("Explain a word", { exact: true })).toHaveCount(0);
  await expect(helper.getByText("Explore in context", { exact: true })).toHaveCount(0);
  await expect(helper.getByPlaceholder("Ask about this grammar...")).toBeVisible();

  await page.getByRole("button", { name: "Grammar", exact: true }).click();
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
    const lesson = page.locator(".wvg-reference-lesson");
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

    const seam = Math.abs(lessonBox!.x + lessonBox!.width - railBox!.x);
    expect(seam).toBeLessThanOrEqual(2);
    expect(railBox!.x + railBox!.width).toBeLessThanOrEqual(viewport.width + 1);
  }
});
