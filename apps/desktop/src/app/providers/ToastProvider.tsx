import { useCallback, useMemo, useState, type PropsWithChildren } from "react";

import { Toast } from "../../components";
import { publishActivity } from "../../modules/history";
import {
  ToastContext,
  type ToastContextValue,
  type ToastInput,
  type ToastRecord
} from "./ToastContext";

const MAX_VISIBLE_TOASTS = 4;
let fallbackToastSequence = 0;

function createToastId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  fallbackToastSequence += 1;
  return `toast-${Date.now()}-${fallbackToastSequence}`;
}

function publishToastActivity(input: ToastInput): void {
  const title = input.title.trim();

  if (title === "Added to favorites" || title === "Removed from favorites") {
    publishActivity({ kind: "favorite-changed", scope: "vocabulary", label: title });
    return;
  }

  switch (title) {
    case "Study details saved":
      publishActivity({ kind: "study-details-saved", scope: "vocabulary", label: title });
      return;
    case "Vocabulary saved locally":
      publishActivity({ kind: "vocabulary-saved", scope: "vocabulary", label: title });
      return;
    case "Existing entry kept":
      publishActivity({ kind: "entry-kept", scope: "vocabulary", label: title });
      return;
    case "Vocabulary JSON exported":
      publishActivity({ kind: "export-created", scope: "vocabulary", label: title });
      return;
    case "Library pack exported":
    case "Selected pack exported":
      publishActivity({ kind: "export-created", scope: "library", label: title });
      return;
    case "Words copied":
      publishActivity({ kind: "clipboard-copied", scope: "library", label: title });
      return;
    default:
      break;
  }

  if (input.tone === "warning") {
    publishActivity({
      kind: "operation-warning",
      scope: "system",
      label: "An operation needs attention"
    });
  } else if (input.tone === "error") {
    publishActivity({
      kind: "operation-failed",
      scope: "system",
      label: "An operation failed"
    });
  }
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<readonly ToastRecord[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback((input: ToastInput) => {
    publishToastActivity(input);
    const id = createToastId();
    const record: ToastRecord = Object.freeze({
      ...input,
      id,
      tone: input.tone ?? "info",
      durationMs: input.durationMs ?? (input.action === undefined ? 4_800 : 8_000),
      createdAt: Date.now()
    });

    setToasts((current) => {
      const deduplicated =
        record.dedupeKey === undefined
          ? current
          : current.filter((toast) => toast.dedupeKey !== record.dedupeKey);

      return Object.freeze([...deduplicated, record].slice(-MAX_VISIBLE_TOASTS));
    });

    return id;
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, showToast, dismissToast, clearToasts }),
    [clearToasts, dismissToast, showToast, toasts]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-label="Application notifications"
        aria-live="polite"
        className="toast-viewport"
        role="region"
      >
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            onDismiss={() => {
              dismissToast(toast.id);
            }}
            toast={toast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
