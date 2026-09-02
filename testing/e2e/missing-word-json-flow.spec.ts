import { expect, searchVocabulary, test } from "./app.fixture";

test("a missing word opens the review-first Wordie helper", async ({ page }) => {
  const floatingLauncher = page.locator(
    ".assistant-dock:not(.wvg-wordie-dock) .wv84-assistant-launcher"
  );
  const decorativeMascot = page.locator(
    ".assistant-dock:not(.wvg-wordie-dock) .wv84-assistant__ready-mascot"
  );
  const dialog = page.getByRole("dialog", { name: "Word helper" });
  const input = page.getByRole("textbox", { name: "Ask Wordie" });

  await page.goto("/");
  const homeAskWordie = page.getByRole("button", { name: "Ask Wordie", exact: true });
  await expect(homeAskWordie).toBeVisible();
  await expect(floatingLauncher).toBeHidden();

  await homeAskWordie.click();
  await expect(dialog).toBeVisible();
  await expect(decorativeMascot).toBeHidden();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(floatingLauncher).toBeHidden();

  await searchVocabulary(page, "allocate");
  await expect(page.getByText("No match for “allocate”.", { exact: true })).toBeVisible();
  await expect(floatingLauncher).toBeHidden();

  const askWordie = page.getByRole("button", { name: "Ask Wordie" }).first();
  await askWordie.click();

  await expect(dialog).toBeVisible();
  await expect(input).toHaveValue("allocate");
  await expect(decorativeMascot).toBeHidden();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(floatingLauncher).toBeHidden();

  await askWordie.click();
  await expect(dialog).toBeVisible();
  await expect(input).toHaveValue("allocate");
});
