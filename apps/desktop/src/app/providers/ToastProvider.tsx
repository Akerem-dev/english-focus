import { useCallback, useMemo, useState, type PropsWithChildren } from "react";

import { Toast } from "../../components";
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

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<readonly ToastRecord[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback((input: ToastInput) => {
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
