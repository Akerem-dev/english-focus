import { expect, test as base, type Page } from "@playwright/test";

export const test = base;
export { expect };

export async function searchVocabulary(page: Page, word: string): Promise<void> {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Search vocabulary" }).fill(word);
  await page.getByRole("button", { name: "Search", exact: true }).click();
}

export async function openImportSource(page: Page): Promise<void> {
  await page.goto("/#/library");
  await expect(page.getByRole("heading", { name: "Your Collections", level: 1 })).toBeVisible();
  await page.keyboard.press("Control+I");
  await expect(page.getByRole("dialog", { name: "Import vocabulary" })).toBeVisible();
}
