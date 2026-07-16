import { expect, test as base, type Page } from "@playwright/test";

export const test = base;
export { expect };

export async function searchVocabulary(page: Page, word: string): Promise<void> {
  await page.goto("/");
  await page.getByLabel("Search vocabulary", { exact: true }).fill(word);
  await page.getByRole("button", { name: "Search word" }).click();
}

export async function openImportSource(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Import" }).click();
  await expect(page.getByRole("dialog", { name: "Import vocabulary" })).toBeVisible();
}
