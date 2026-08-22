import { expect, test } from "./app.fixture";

test("grammar opens directly on the approved master lesson", async ({ page }) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await page.goto("/#/grammar");

  await expect(page.getByRole("heading", { name: "Present Perfect", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "English Grammar", level: 1 })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Continue lesson" })).toHaveCount(0);

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
  await expect(helper.getByText("Welcome.", { exact: true })).toBeVisible();
  await expect(helper.getByText("Explain this rule", { exact: true })).toBeVisible();
  await expect(
    helper.getByText("Kuralı kısa Türkçe mantıkla açıkla.", { exact: true })
  ).toBeVisible();
  await expect(helper.getByText("Compare with Past Simple", { exact: true })).toBeVisible();
  await expect(
    helper.getByText("Anlam, zaman ve kullanım farkını göster.", { exact: true })
  ).toBeVisible();
  await expect(helper.getByText("Quiz this grammar", { exact: true })).toBeVisible();
  await expect(helper.getByText("Bu konudan tek hızlı soru çöz.", { exact: true })).toBeVisible();
  await expect(helper.getByPlaceholder("Ask about this grammar...")).toBeVisible();

  await page.getByRole("button", { name: "Grammar", exact: true }).click();
  const picker = page.getByRole("dialog", { name: "Choose a grammar lesson" });
  await expect(picker).toBeVisible();
  await expect(picker.getByRole("heading", { name: "Choose a lesson", level: 2 })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(picker).toHaveCount(0);

  await expect(
    page.getByText(
      /LOCAL CACHE|LOCAL KNOWLEDGE|REVIEW QUEUE|TOKEN DURUMU|knowledge base|cache-safe/i
    )
  ).toHaveCount(0);
  await expect(page.getByText(/prototip|prototype|yakında eklenecek/i)).toHaveCount(0);
});

test("Word Valley shell fits common desktop and laptop resolutions", async ({ page }) => {
  const viewports = [
    { width: 1920, height: 1080 },
    { width: 1536, height: 864 },
    { width: 1366, height: 768 },
    { width: 900, height: 600 }
  ];

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
    const box = await stage.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(-1);
    expect(box!.y).toBeGreaterThanOrEqual(-1);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
  }
});
