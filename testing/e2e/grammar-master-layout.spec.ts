import { expect, test } from "./app.fixture";

test("grammar master lesson keeps the approved end-user layout and copy", async ({ page }) => {
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

  await expect(page.getByRole("dialog", { name: "Grammar helper" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Wordie AI", level: 2 })).toBeVisible();
  await expect(page.getByText("Welcome.", { exact: true })).toBeVisible();
  await expect(page.getByText("Explain this rule", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Kuralı kısa Türkçe mantıkla açıkla.", { exact: true })
  ).toBeVisible();
  await expect(page.getByText("Compare with Past Simple", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Anlam, zaman ve kullanım farkını göster.", { exact: true })
  ).toBeVisible();
  await expect(page.getByText("Quiz this grammar", { exact: true })).toBeVisible();
  await expect(page.getByText("Bu konudan tek hızlı soru çöz.", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Ask about this grammar...")).toBeVisible();

  await expect(
    page.getByText(
      /LOCAL CACHE|LOCAL KNOWLEDGE|REVIEW QUEUE|TOKEN DURUMU|knowledge base|cache-safe/i
    )
  ).toHaveCount(0);
  await expect(page.getByText(/prototip|prototype|yakında eklenecek/i)).toHaveCount(0);
});
