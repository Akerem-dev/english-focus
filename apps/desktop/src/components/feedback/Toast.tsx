import { useEffect, useState } from "react";

import type { ToastRecord } from "../../app/providers/ToastContext";
import { AppIcon } from "../../design-system";
import { Button, IconButton } from "../actions";

export interface ToastProps {
  readonly toast: ToastRecord;
  readonly onDismiss: () => void;
}

function iconName(tone: ToastRecord["tone"]) {
  return tone === "error" || tone === "warning" ? "warning" : "check";
}

export function Toast({ onDismiss, toast }: ToastProps) {
  const [actionPending, setActionPending] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (toast.durationMs === undefined || toast.durationMs <= 0 || paused || actionPending) {
      return;
    }

    const timeout = window.setTimeout(onDismiss, toast.durationMs);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [actionPending, onDismiss, paused, toast.durationMs]);

  async function runAction() {
    if (toast.action === undefined || actionPending) {
      return;
    }

    setActionPending(true);

    try {
      await toast.action.onAction();
      onDismiss();
    } finally {
      setActionPending(false);
    }
  }

  return (
    <article
      className="toast"
      data-tone={toast.tone}
      onMouseEnter={() => {
        setPaused(true);
      }}
      onMouseLeave={() => {
        setPaused(false);
      }}
      onFocusCapture={() => {
        setPaused(true);
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false);
        }
      }}
      role={toast.tone === "error" || toast.tone === "warning" ? "alert" : "status"}
    >
      <span aria-hidden="true" className="toast__icon">
        <AppIcon name={iconName(toast.tone)} size={18} />
      </span>
      <div className="toast__copy">
        <strong>{toast.title}</strong>
        {toast.message === undefined ? null : <p>{toast.message}</p>}
      </div>
      <div className="toast__actions">
        {toast.action === undefined ? null : (
          <Button
            isLoading={actionPending}
            onClick={() => {
              void runAction();
            }}
            size="small"
            variant="ghost"
          >
            {toast.action.label}
          </Button>
        )}
        <IconButton
          icon={<AppIcon name="close" size={15} />}
          label={`Dismiss ${toast.title}`}
          onClick={onDismiss}
          size="small"
        />
      </div>
    </article>
  );
}
