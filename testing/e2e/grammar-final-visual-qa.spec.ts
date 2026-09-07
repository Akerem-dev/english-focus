import { expect, test } from "./app.fixture";

const GRAMMAR_PROGRESS_KEY = "word-valley:grammar:progress-v1";
const GRAMMAR_COMPLETION_KEY = "word-valley:grammar:completion-v1";

test("final Grammar QA keeps hero, Wordie, scrollbar and completion states polished", async ({
  page
}) => {
  await page.setViewportSize({ width: 1664, height: 936 });
  await page.goto("/");
  await page.evaluate(
    ([progressKey, completionKey]) => {
      window.localStorage.removeItem(progressKey);
      window.localStorage.removeItem(completionKey);
    },
    [GRAMMAR_PROGRESS_KEY, GRAMMAR_COMPLETION_KEY]
  );
  await page.goto("/#/grammar");

  await page.getByRole("button", { name: /Be: am \/ is \/ are, 0 of 5 complete/i }).click();
  await expect(page.getByRole("heading", { name: "Be: am / is / are", level: 1 })).toBeVisible();

  const hero = page.locator(".wvg-v15-overview-hero");
  const heroMeta = hero.locator("em");
  await expect(heroMeta).toBeVisible();
  const heroBox = await hero.boundingBox();
  const metaBox = await heroMeta.boundingBox();
  expect(heroBox).not.toBeNull();
  expect(metaBox).not.toBeNull();
  expect(metaBox!.y + metaBox!.height).toBeLessThanOrEqual(heroBox!.y + heroBox!.height - 2);

  const markComplete = page.getByRole("button", { name: "✓ Mark complete", exact: true });
  await expect(markComplete).toBeVisible();
  await markComplete.click();
  await expect(page.getByRole("button", { name: "✓ Completed · Undo", exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Mastery 0/5 · Practice", exact: true })
  ).toBeVisible();

  const launcher = page.getByRole("button", { name: "Open Wordie", exact: true });
  await launcher.click();
  const helper = page.getByRole("dialog", { name: "Grammar helper" });
  await expect(helper).toBeVisible();

  const helperGeometry = await helper.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return {
      borderRadius: style.borderRadius,
      bottom: rect.bottom,
      right: rect.right,
      top: rect.top
    };
  });
  expect(helperGeometry.borderRadius).toBe("0px");
  expect(helperGeometry.top).toBeCloseTo(46, 0);
  expect(helperGeometry.right).toBeCloseTo(1664, 0);
  expect(helperGeometry.bottom).toBeCloseTo(936, 0);
  await expect(helper.locator(".wv84-quick-actions__arrow")).toHaveCount(0);

  await helper.getByRole("button", { name: "Explain this rule", exact: true }).click();
  await expect(
    helper.getByText(/Formula: Subject \+ am \/ is \/ are \+ complement/i)
  ).toBeVisible();
  await expect(helper.getByText(/Why it works:/i)).toBeVisible();
  await expect(helper.getByText(/not confident enough/i)).toHaveCount(0);

  await page.getByRole("button", { name: "Close Wordie", exact: true }).click();
  await page.getByRole("button", { name: "Open Core Formula section" }).click();
  const scrollOwner = page.locator(".wvg-v15-lesson.wvg-v15-lesson--detail");
  const scrollbar = await scrollOwner.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      color: style.scrollbarColor,
      width: style.scrollbarWidth
    };
  });
  expect(scrollbar.width).toBe("thin");
  expect(scrollbar.color).not.toBe("auto");

  await page.getByRole("button", { name: "← Lesson overview" }).click();
  await page.getByRole("button", { name: "← Grammar" }).click();

  const completedBook = page.getByRole("button", {
    name: /Be: am \/ is \/ are, 0 of 5 complete/i
  });
  await expect(completedBook).toBeVisible();
  await expect(completedBook).toHaveAttribute("data-status", "complete");
  const completedStyle = await completedBook.evaluate((element) => {
    const style = window.getComputedStyle(element);
    const status = element.querySelector<HTMLElement>(".wvg-v13-book__status");
    const statusStyle = status === null ? undefined : window.getComputedStyle(status);
    return {
      background: style.backgroundColor,
      color: style.color,
      statusFontSize: statusStyle === undefined ? 0 : Number.parseFloat(statusStyle.fontSize),
      statusOpacity: statusStyle === undefined ? 0 : Number.parseFloat(statusStyle.opacity),
      statusText: status?.textContent?.trim() ?? ""
    };
  });

  expect(completedStyle.background).not.toBe("rgb(11, 75, 64)");
  expect(completedStyle.color).not.toBe("rgb(247, 242, 232)");
  expect(completedStyle.statusText).toBe("✓");
  expect(completedStyle.statusFontSize).toBeGreaterThanOrEqual(50);
  expect(completedStyle.statusOpacity).toBeGreaterThan(0);

  await page.reload();
  await expect(
    page.getByRole("button", { name: /Be: am \/ is \/ are, 0 of 5 complete/i })
  ).toBeVisible();
});
