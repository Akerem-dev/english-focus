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

function quotedSubject(message: string | undefined): string | undefined {
  return message?.match(/“([^”]+)”/u)?.[1];
}

function notificationMessage(toast: ToastRecord): string | undefined {
  const subject = quotedSubject(toast.message);

  if (toast.title === "Added to favorites" && subject !== undefined) {
    return `“${subject}” is now easy to find in Favorites.`;
  }
  if (toast.title === "Removed from favorites" && subject !== undefined) {
    return `“${subject}” was removed from Favorites.`;
  }
  if (toast.message === undefined) {
    return undefined;
  }

  return toast.message
    .replace("study metadata was updated locally.", "was updated.")
    .replace("returned to its previous favorite state.", "is back to its previous state.")
    .replace("is now in your local library.", "is ready in your Wordbook.")
    .replace("is stored locally.", "was updated.")
    .replace("local SQLite storage", "your Wordbook")
    .replace("A local override", "Your edited version");
}

export function Toast({ onDismiss, toast }: ToastProps) {
  const [actionPending, setActionPending] = useState(false);
  const [paused, setPaused] = useState(false);
  const message = notificationMessage(toast);

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
        <AppIcon name={iconName(toast.tone)} size={17} />
      </span>
      <div className="toast__copy">
        <strong>{toast.title}</strong>
        {message === undefined ? null : <p>{message}</p>}
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
          icon={<AppIcon name="close" size={14} />}
          label={`Dismiss ${toast.title}`}
          onClick={onDismiss}
          size="small"
        />
      </div>
    </article>
  );
}
