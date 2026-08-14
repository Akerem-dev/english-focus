import { useEffect, useState } from "react";

import { LibraryPage as BaseLibraryPage } from "./LibraryPage";

type WordSortKey = "word" | "meaning" | "level";
type SortDirection = "asc" | "desc";

interface WordSortState {
  readonly key: WordSortKey;
  readonly direction: SortDirection;
}

const CEFR_ORDER: Readonly<Record<string, number>> = Object.freeze({
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6
});

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function compareRows(left: HTMLElement, right: HTMLElement, sort: WordSortState): number {
  let comparison = 0;

  if (sort.key === "level") {
    const leftLevel = normalizeText(left.querySelector(".cefr-badge")?.textContent).toUpperCase();
    const rightLevel = normalizeText(right.querySelector(".cefr-badge")?.textContent).toUpperCase();
    const leftRank = CEFR_ORDER[leftLevel] ?? Number.MAX_SAFE_INTEGER;
    const rightRank = CEFR_ORDER[rightLevel] ?? Number.MAX_SAFE_INTEGER;

    comparison = leftRank - rightRank;

    if (comparison === 0) {
      const leftWord = normalizeText(left.querySelector(".wvc-word-open strong")?.textContent);
      const rightWord = normalizeText(right.querySelector(".wvc-word-open strong")?.textContent);
      comparison = leftWord.localeCompare(rightWord, "en", { sensitivity: "base" });
    }
  } else if (sort.key === "meaning") {
    const leftMeaning = normalizeText(left.querySelector(".wvc-word-meaning")?.textContent);
    const rightMeaning = normalizeText(right.querySelector(".wvc-word-meaning")?.textContent);
    comparison = leftMeaning.localeCompare(rightMeaning, "tr", {
      sensitivity: "base",
      numeric: true
    });
  } else {
    const leftWord = normalizeText(left.querySelector(".wvc-word-open strong")?.textContent);
    const rightWord = normalizeText(right.querySelector(".wvc-word-open strong")?.textContent);
    comparison = leftWord.localeCompare(rightWord, "en", {
      sensitivity: "base",
      numeric: true
    });
  }

  return sort.direction === "asc" ? comparison : -comparison;
}

function nextSort(current: WordSortState, key: WordSortKey): WordSortState {
  if (current.key !== key) {
    return { key, direction: "asc" };
  }

  return {
    key,
    direction: current.direction === "asc" ? "desc" : "asc"
  };
}

function humanSortName(key: WordSortKey): string {
  if (key === "meaning") {
    return "meaning";
  }
  if (key === "level") {
    return "level";
  }
  return "word";
}

function CollectionsPhase1Sorting() {
  const [sort, setSort] = useState<WordSortState>({ key: "word", direction: "asc" });

  useEffect(() => {
    let applying = false;
    let scheduled = false;

    const enhance = () => {
      scheduled = false;

      const root = document.querySelector<HTMLElement>(".application-frame--collections-cleanroom");
      if (root === null) {
        return;
      }

      // Until real study timestamps are persisted, do not promise a recency sort we do not have.
      const overviewSortLabel = root.querySelector<HTMLElement>(".wvc-sort-button > span");
      if (overviewSortLabel?.textContent?.trim() === "Recently studied") {
        overviewSortLabel.textContent = "Default order";
      }

      root.querySelectorAll<HTMLElement>(".wvc-sort-menu button > span").forEach((label) => {
        if (label.textContent?.trim() === "Recently studied") {
          label.textContent = "Default order";
        }
      });

      const list = root.querySelector<HTMLElement>(".wvc-word-list");
      const head = root.querySelector<HTMLElement>(".wvc-word-list__head");
      if (list === null || head === null) {
        return;
      }

      const rows = Array.from(list.querySelectorAll<HTMLElement>(":scope > .wvc-word-row"));
      const cells = Array.from(head.children).filter(
        (child): child is HTMLElement => child instanceof HTMLElement
      );

      const configureHeading = (index: number, key: WordSortKey, label: string) => {
        const cell = cells[index];
        if (cell === undefined) {
          return;
        }

        const active = sort.key === key;
        cell.classList.add("wvc-sortable-heading");
        cell.dataset.sortKey = key;
        cell.dataset.sortDirection = active ? sort.direction : "none";
        cell.tabIndex = 0;
        cell.setAttribute("role", "columnheader");
        cell.setAttribute("aria-sort", active ? (sort.direction === "asc" ? "ascending" : "descending") : "none");
        cell.setAttribute(
          "aria-label",
          active
            ? `${label}, sorted ${sort.direction === "asc" ? "ascending" : "descending"}. Activate to reverse order.`
            : `Sort by ${humanSortName(key)}.`
        );

        cell.onclick = () => {
          setSort((current) => nextSort(current, key));
        };

        cell.onkeydown = (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setSort((current) => nextSort(current, key));
          }
        };
      };

      configureHeading(1, "word", "Word");
      configureHeading(2, "meaning", "Meaning");
      configureHeading(3, "level", "Level");

      if (rows.length === 0 || applying) {
        return;
      }

      applying = true;
      const sortedRows = [...rows].sort((left, right) => compareRows(left, right, sort));

      head.style.order = "0";
      sortedRows.forEach((row, index) => {
        row.style.order = String(index + 1);
      });

      const emptyState = list.querySelector<HTMLElement>(":scope > .wvc-inline-empty");
      if (emptyState !== null) {
        emptyState.style.order = "1";
      }

      queueMicrotask(() => {
        applying = false;
      });
    };

    const scheduleEnhance = () => {
      if (scheduled || applying) {
        return;
      }
      scheduled = true;
      requestAnimationFrame(enhance);
    };

    enhance();

    const observer = new MutationObserver(scheduleEnhance);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
    };
  }, [sort]);

  return null;
}

export function LibraryPagePhase1() {
  return (
    <>
      <BaseLibraryPage />
      <CollectionsPhase1Sorting />
    </>
  );
}
