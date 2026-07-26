import { useState, type FormEvent } from "react";

import { useAssistant, useToast } from "../../../app/providers";
import { Button, TextField } from "../../../components";
import { AppIcon } from "../../../design-system";

function connectionLabel(runtime: "browser" | "desktop", configured: boolean): string {
  if (runtime === "browser") {
    return "Desktop app required";
  }

  return configured ? "Connected" : "Not connected";
}

function messageFromError(cause: unknown): string {
  if (cause instanceof Error) {
    return cause.message;
  }

  return typeof cause === "string" ? cause : "The connection could not be updated.";
}

export function AssistantConnectionSettings() {
  const { clearApiKey, connection, saveApiKey, status } = useAssistant();
  const { showToast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [busyAction, setBusyAction] = useState<"save" | "clear" | undefined>();
  const [feedback, setFeedback] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const desktopAvailable = connection.runtime === "desktop";
  const isBusy = busyAction !== undefined || status === "loading";

  async function handleSave(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const nextApiKey = apiKey.trim();
    if (nextApiKey.length === 0 || !desktopAvailable) {
      return;
    }

    setBusyAction("save");
    setFeedback(undefined);
    setError(undefined);

    try {
      await saveApiKey(nextApiKey);
      setApiKey("");
      setFeedback("The word helper connection is ready.");
      showToast({
        title: "Word helper connected",
        message: "Your API key is stored in the operating system credential vault.",
        tone: "success",
        dedupeKey: "assistant-connection"
      });
    } catch (cause) {
      const message = messageFromError(cause);
      setError(message);
      showToast({
        title: "Connection not saved",
        message,
        tone: "error",
        dedupeKey: "assistant-connection"
      });
    } finally {
      setBusyAction(undefined);
    }
  }

  async function handleClear(): Promise<void> {
    if (!desktopAvailable) {
      return;
    }

    setBusyAction("clear");
    setFeedback(undefined);
    setError(undefined);

    try {
      await clearApiKey();
      setApiKey("");
      setFeedback("The saved connection was removed.");
      showToast({
        title: "Word helper disconnected",
        message: "The saved API key was removed from the credential vault.",
        tone: "success",
        dedupeKey: "assistant-connection"
      });
    } catch (cause) {
      const message = messageFromError(cause);
      setError(message);
      showToast({
        title: "Connection not removed",
        message,
        tone: "error",
        dedupeKey: "assistant-connection"
      });
    } finally {
      setBusyAction(undefined);
    }
  }

  return (
    <section
      aria-labelledby="assistant-connection-title"
      className="assistant-connection-settings"
      data-configured={connection.configured || undefined}
    >
      <header className="assistant-connection-settings__header">
        <span aria-hidden="true" className="assistant-connection-settings__icon">
          <AppIcon name="star" size={18} />
        </span>
        <div>
          <h3 id="assistant-connection-title">Word helper connection</h3>
          <p>Connect your own Gemini API key to prepare missing vocabulary inside English Focus.</p>
        </div>
      </header>

      <div className="assistant-connection-settings__status">
        <span>
          <span aria-hidden="true" className="assistant-connection-settings__status-dot" />
          {connectionLabel(connection.runtime, connection.configured)}
        </span>
        <small>{connection.model}</small>
      </div>

      <form
        className="assistant-connection-settings__form"
        onSubmit={(event) => void handleSave(event)}
      >
        <TextField
          autoComplete="off"
          disabled={!desktopAvailable || isBusy}
          error={error}
          fieldClassName="assistant-connection-settings__field"
          helperText={
            desktopAvailable
              ? "The key is sent only to the Rust backend and stored in your operating system credential vault."
              : "Open the Tauri desktop app to save or use an API key. Browser preview never receives the key."
          }
          label="Gemini API key"
          onChange={(event) => {
            setApiKey(event.currentTarget.value);
            setError(undefined);
            setFeedback(undefined);
          }}
          placeholder={connection.configured ? "Enter a replacement key" : "Paste your API key"}
          type="password"
          value={apiKey}
        />

        <div className="assistant-connection-settings__actions">
          <Button
            disabled={!desktopAvailable || apiKey.trim().length === 0 || isBusy}
            isLoading={busyAction === "save"}
            size="small"
            type="submit"
            variant="primary"
          >
            {connection.configured ? "Replace key" : "Save connection"}
          </Button>
          {connection.configured ? (
            <Button
              disabled={isBusy}
              isLoading={busyAction === "clear"}
              onClick={() => void handleClear()}
              size="small"
              type="button"
              variant="ghost"
            >
              Disconnect
            </Button>
          ) : null}
        </div>
      </form>

      {feedback === undefined ? null : (
        <p aria-live="polite" className="assistant-connection-settings__feedback">
          <AppIcon name="check" size={15} />
          <span>{feedback}</span>
        </p>
      )}
    </section>
  );
}
