import type { ActivityEventDetail } from "../../modules/history";
import type { ToastInput } from "./ToastContext";

export function resolveToastActivity(input: ToastInput): ActivityEventDetail | undefined {
  if (input.tone === "success" && input.dedupeKey === "vocabulary-export") {
    return {
      kind: "export-created",
      scope: "vocabulary",
      label: "Vocabulary export created"
    };
  }

  if (input.tone === "success" && input.dedupeKey === "library-export") {
    return {
      kind: "export-created",
      scope: "library",
      label: "Library export created"
    };
  }

  if (input.tone === "info" && input.dedupeKey === "vocabulary-persistence") {
    return {
      kind: "entry-kept",
      scope: "vocabulary",
      label: "Existing vocabulary entry kept"
    };
  }

  return undefined;
}
