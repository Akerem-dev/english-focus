import { useEffect } from "react";

import collectionsBackground from "../../../assets/collections/collections-background.png";
import academicWritingCover from "../../../assets/collections/cover-academic-writing.png";
import dailyCommunicationCover from "../../../assets/collections/cover-daily-communication.png";
import ieltsVocabularyCover from "../../../assets/collections/cover-ielts-vocabulary.png";
import studyReviewCover from "../../../assets/collections/cover-study-review.png";
import usefulExpressionsCover from "../../../assets/collections/cover-useful-expressions.png";
import workBusinessCover from "../../../assets/collections/cover-work-business.png";
import { LibraryPagePhase3 } from "./LibraryPagePhase3";

const COPY_REPLACEMENTS: Readonly<Record<string, string>> = Object.freeze({
  "Recently studied": "Featured",
  "Default order": "Featured",
  "MAKE IT YOURS": "COLLECTION DETAILS",
  "A NEW PLACE TO GROW": "NEW COLLECTION",
  "Refresh the cover, name, or description.": "Update the cover, name, or description.",
  "Give this collection a look and a purpose of its own.":
    "Choose a cover and name your collection.",
  "GROW THIS COLLECTION": "ADD WORDS",
  "Pick words you already know you want together.": "Choose words to add to this collection.",
  "A NEW HOME": "MOVE WORDS",
  "Choose the collection that fits best.": "Choose a destination collection.",
  "This collection is waiting for its first word": "No words yet",
  "Add a few words and make this collection yours.": "Add words to start this collection.",
  "Meaning coming soon": "—",
  "This word is ready for a definition when you revisit it.": "—",
  "Open this word again after adding an example you want to remember.": "No examples yet.",
  "No definition is saved for this word yet.": "No definition yet.",
  "No example sentence is saved for this word yet.": "No examples yet.",
  "No additional forms are saved for this word.": "No additional forms."
});

const PRESET_COVERS: Readonly<Record<string, string>> = Object.freeze({
  ridge: ieltsVocabularyCover,
  lake: academicWritingCover,
  cottage: workBusinessCover,
  meadow: dailyCommunicationCover,
  forest: studyReviewCover,
  sunrise: usefulExpressionsCover
});

const COVER_GRADIENT = "linear-gradient(180deg, rgba(8,47,41,.03), rgba(8,47,41,.28))";

function isUserCover(backgroundImage: string): boolean {
  return backgroundImage.includes("data:image/") || backgroundImage.includes("blob:");
}

function applyFinalCollectionArtwork(root: HTMLElement) {
  const sceneImage = `url(\"${collectionsBackground}\")`;

  root.querySelectorAll<HTMLElement>(".wvc-scene, .wvc-phase3-scene").forEach((scene) => {
    if (scene.style.backgroundImage !== sceneImage) {
      scene.style.backgroundImage = sceneImage;
    }
  });

  root.querySelectorAll<HTMLElement>("[data-cover]").forEach((cover) => {
    const preset = cover.dataset.cover;
    if (preset === undefined || isUserCover(cover.style.backgroundImage)) {
      return;
    }

    const artwork = PRESET_COVERS[preset];
    if (artwork === undefined) {
      return;
    }

    const backgroundImage = `${COVER_GRADIENT}, url(\"${artwork}\")`;
    if (cover.style.backgroundImage !== backgroundImage) {
      cover.style.backgroundImage = backgroundImage;
    }
  });
}

function CollectionsPhase4EditorialCleanup() {
  useEffect(() => {
    let scheduled = false;

    const applyCleanup = () => {
      scheduled = false;

      const root = document.querySelector<HTMLElement>(".application-frame--collections-cleanroom");
      if (root === null) {
        return;
      }

      applyFinalCollectionArtwork(root);

      root
        .querySelectorAll<HTMLElement>(
          ".wvc-sort-button > span, .wvc-sort-menu button > span, .wvc-eyebrow, .wvc-modal__header p, .wvc-inline-empty strong, .wvc-inline-empty p, .wvc-phase3-empty-copy, .wvc-word-panel p, .wvc-word-panel h2"
        )
        .forEach((node) => {
          const current = node.textContent?.trim();
          if (current === undefined) {
            return;
          }

          const replacement = COPY_REPLACEMENTS[current];
          if (replacement !== undefined && replacement !== current) {
            node.textContent = replacement;
          }
        });

      root
        .querySelectorAll<HTMLElement>(".wvc-card__footer > span:first-child")
        .forEach((label) => {
          if (label.textContent?.trim() === "Explore collection") {
            label.setAttribute("aria-hidden", "true");
          }
        });

      root.querySelectorAll<HTMLElement>(".wvc-phase3-example__notes span").forEach((note) => {
        if (note.textContent?.trim().startsWith("Target form:")) {
          note.hidden = true;
        }
      });
    };

    const schedule = () => {
      if (scheduled) {
        return;
      }
      scheduled = true;
      requestAnimationFrame(applyCleanup);
    };

    applyCleanup();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-cover", "style"],
      childList: true,
      subtree: true
    });

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
