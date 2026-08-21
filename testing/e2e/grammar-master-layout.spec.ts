import { expect, test } from "./app.fixture";

test("grammar master lesson keeps the approved end-user layout and copy", async ({ page }) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await page.goto("/#/grammar");

  await expect(page.getByRole("heading", { name: "English Grammar", level: 1 })).toBeVisible();

  await page.getByRole("button", { name: "Continue lesson" }).click();

  await expect(page.getByRole("heading", { name: "Present Perfect", level: 1 })).toBeVisible();
  await expect(page.getByText("CORE FORMULA · TEMEL YAPI", { exact: true })).toBeVisible();
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

  const quizTitle = helper.getByText("Quiz this grammar", { exact: true });
  const quizDiagnostics = await quizTitle.evaluate((element) => {
    const describe = (node: Element | null) => {
      if (!(node instanceof HTMLElement)) return null;
      const rect = node.getBoundingClientRect();
      const style = window.getComputedStyle(node);
      return {
        tag: node.tagName,
        className: node.className,
        rect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left
        },
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        overflow: style.overflow,
        position: style.position,
        transform: style.transform,
        clip: style.clip,
        clipPath: style.clipPath
      };
    };

    const button = element.closest("button");
    const quickActions = element.closest(".wv84-quick-actions--welcome");
    const panel = element.closest(".wv84-assistant-panel");
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      element: describe(element),
      button: describe(button),
      quickActions: describe(quickActions),
      panel: describe(panel)
    };
  });
  console.log(`GRAMMAR_QUIZ_DIAGNOSTICS=${JSON.stringify(quizDiagnostics)}`);

  await expect(quizTitle).toBeVisible();
  await expect(helper.getByText("Bu konudan tek hızlı soru çöz.", { exact: true })).toBeVisible();
  await expect(helper.getByPlaceholder("Ask about this grammar...")).toBeVisible();

  await expect(
    page.getByText(
      /LOCAL CACHE|LOCAL KNOWLEDGE|REVIEW QUEUE|TOKEN DURUMU|knowledge base|cache-safe/i
    )
  ).toHaveCount(0);
  await expect(page.getByText(/prototip|prototype|yakında eklenecek/i)).toHaveCount(0);
});
