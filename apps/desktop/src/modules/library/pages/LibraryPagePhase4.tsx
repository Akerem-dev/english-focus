import { useEffect } from "react";

import { LibraryPagePhase3 } from "./LibraryPagePhase3";

function CollectionsPhase4EditorialCleanup() {
  useEffect(() => {
    let scheduled = false;

    const applyCopyCleanup = () => {
      scheduled = false;

      const root = document.querySelector<HTMLElement>(
        ".application-frame--collections-cleanroom"
      );
      if (root === null) {
        return;
      }

      root.querySelectorAll<HTMLElement>(".wvc-sort-button > span, .wvc-sort-menu button > span")
        .forEach((label) => {
          if (label.textContent?.trim() === "Default order") {
            label.textContent = "Featured";
          }
        });

      root.querySelectorAll<HTMLElement>(".wvc-card__footer > span:first-child")
        .forEach((label) => {
          if (label.textContent?.trim() === "Explore collection") {
            label.setAttribute("aria-hidden", "true");
          }
        });
    };

    const schedule = () => {
      if (scheduled) {
        return;
      }
      scheduled = true;
      requestAnimationFrame(applyCopyCleanup);
    };

    applyCopyCleanup();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}

export function LibraryPagePhase4() {
  return (
    <>
      <LibraryPagePhase3 />
      <CollectionsPhase4EditorialCleanup />
    </>
  );
}
