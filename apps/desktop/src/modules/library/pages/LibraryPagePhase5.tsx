import { useEffect, useRef } from "react";

import {
  useCollectionsRepository,
  useToast,
  type PersistedCollection
} from "../../../app/providers";
import { LibraryPagePhase4 } from "./LibraryPagePhase4";

const COLLECTION_TITLE_MAX = 64;
const COLLECTION_DESCRIPTION_MAX = 180;

function normalizeCollectionTitle(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
}

function CollectionsFinalQaGuards() {
  const { showToast } = useToast();
  const collectionsRepository = useCollectionsRepository();
  const storedCollectionsRef = useRef<readonly PersistedCollection[]>([]);

  useEffect(() => {
    let frame = 0;
    let disposed = false;
    let currentEditor: HTMLElement | null = null;

    const rootSelector = ".application-frame--collections-cleanroom";

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(applyGuards);
    };

    const refreshCollections = async () => {
      try {
        const state = await collectionsRepository.getState();
        if (disposed) {
          return;
        }
        storedCollectionsRef.current = state?.collections ?? [];
        schedule();
      } catch {
        // Persistence already owns its user-facing error state. Validation should
        // remain usable even if storage is temporarily unavailable.
      }
    };

    const ensureErrorNode = (nameInput: HTMLInputElement): HTMLElement => {
      const label = nameInput.closest<HTMLElement>(".wvc-field");
      const existing = label?.querySelector<HTMLElement>(".wvc-field-error");
      if (existing !== null && existing !== undefined) {
        return existing;
      }

      const error = document.createElement("small");
      error.className = "wvc-field-error";
      error.id = "wvc-collection-name-error";
      error.setAttribute("role", "status");
      error.setAttribute("aria-live", "polite");
      label?.append(error);
      nameInput.setAttribute("aria-describedby", error.id);
      return error;
    };

    function applyGuards() {
      const root = document.querySelector<HTMLElement>(rootSelector);
      const editor = root?.querySelector<HTMLElement>(".wvc-modal--editor") ?? null;

      if (editor === null) {
        currentEditor = null;
        return;
      }

      if (editor !== currentEditor) {
        currentEditor = editor;
        void refreshCollections();
      }

      const nameInput = editor.querySelector<HTMLInputElement>(
        ".wvc-editor-fields .wvc-field input"
      );
      const descriptionInput = editor.querySelector<HTMLTextAreaElement>(
        ".wvc-editor-fields .wvc-field textarea"
      );
      const saveButton = editor.querySelector<HTMLButtonElement>(
        ".wvc-modal__footer .wvc-button--primary"
      );

      if (nameInput === null || saveButton === null) {
        return;
      }

      nameInput.maxLength = COLLECTION_TITLE_MAX;
      if (descriptionInput !== null) {
        descriptionInput.maxLength = COLLECTION_DESCRIPTION_MAX;
      }

      const title = nameInput.value.trim().replace(/\s+/g, " ");
      const normalizedTitle = normalizeCollectionTitle(title);
      const editing =
        editor.querySelector("#collection-editor-title")?.textContent?.trim() === "Edit collection";
      const currentTitle =
        root?.querySelector<HTMLElement>(".wvc-collection-hero h1")?.textContent?.trim() ?? "";
      const normalizedCurrentTitle = normalizeCollectionTitle(currentTitle);
      const visibleCollectionTitles = Array.from(
        root?.querySelectorAll<HTMLElement>(".wvc-card__body > strong") ?? []
      ).map((node) => normalizeCollectionTitle(node.textContent ?? ""));

      const duplicateInStorage = storedCollectionsRef.current.some(
        (collection) => normalizeCollectionTitle(collection.title) === normalizedTitle
      );
      const duplicateOnScreen = visibleCollectionTitles.includes(normalizedTitle);
      const duplicate =
        normalizedTitle.length > 0 &&
        !(editing && normalizedTitle === normalizedCurrentTitle) &&
        (duplicateInStorage || duplicateOnScreen);

      const touched = nameInput.dataset.qaTouched === "true";
      const empty = normalizedTitle.length === 0;
      const errorNode = ensureErrorNode(nameInput);
      const errorMessage = duplicate
        ? "A collection with this name already exists."
        : touched && empty
          ? "Enter a collection name."
          : "";

      errorNode.textContent = errorMessage;
      errorNode.hidden = errorMessage.length === 0;
      nameInput.setAttribute("aria-invalid", errorMessage.length > 0 ? "true" : "false");
      saveButton.disabled = empty || duplicate;
      saveButton.dataset.qaBlocked = duplicate ? "duplicate" : empty ? "empty" : "";
    }

    const onInput = (event: Event) => {
      if (!(event.target instanceof HTMLInputElement)) {
        return;
      }
      if (
        event.target.matches(
          `${rootSelector} .wvc-modal--editor .wvc-editor-fields .wvc-field input`
        )
      ) {
        event.target.dataset.qaTouched = "true";
        schedule();
      }
    };

    const onBlur = (event: FocusEvent) => {
      if (!(event.target instanceof HTMLInputElement)) {
        return;
      }
      if (
        event.target.matches(
          `${rootSelector} .wvc-modal--editor .wvc-editor-fields .wvc-field input`
        )
      ) {
        event.target.dataset.qaTouched = "true";
        schedule();
      }
    };

    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      const saveButton = event.target.closest<HTMLButtonElement>(
        `${rootSelector} .wvc-modal--editor .wvc-modal__footer .wvc-button--primary`
      );
      if (saveButton === null || saveButton.dataset.qaBlocked !== "duplicate") {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      showToast({
        title: "Choose another name",
        message: "A collection with this name already exists.",
        tone: "info",
        dedupeKey: "collection-duplicate-name"
      });
    };

    const onChange = (event: Event) => {
      if (!(event.target instanceof HTMLInputElement) || event.target.type !== "file") {
        return;
      }
      if (!event.target.matches(`${rootSelector} .wvc-cover-studio input[type="file"]`)) {
        return;
      }

      const input = event.target;
      window.setTimeout(() => {
        input.value = "";
      }, 250);
    };

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("input", onInput, true);
    document.addEventListener("blur", onBlur, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("change", onChange, true);

    void refreshCollections();
    schedule();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("blur", onBlur, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("change", onChange, true);
    };
  }, [collectionsRepository, showToast]);

  return null;
}

export function LibraryPagePhase5() {
  return (
    <>
      <LibraryPagePhase4 />
      <CollectionsFinalQaGuards />
    </>
  );
}
