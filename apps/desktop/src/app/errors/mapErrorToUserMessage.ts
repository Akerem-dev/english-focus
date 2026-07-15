export interface UserFacingError {
  readonly title: string;
  readonly message: string;
  readonly retryable: boolean;
}

function normalizeMessage(cause: unknown): string {
  if (cause instanceof Error) {
    return cause.message.trim();
  }

  return typeof cause === "string" ? cause.trim() : "";
}

export function mapErrorToUserMessage(
  cause: unknown,
  fallbackTitle = "Something went wrong."
): UserFacingError {
  const raw = normalizeMessage(cause);
  const lowered = raw.toLocaleLowerCase("en-US");

  if (lowered.includes("clipboard") || lowered.includes("permission denied")) {
    return {
      title: "Clipboard access was blocked",
      message: "Allow clipboard access for English Focus and try the action again.",
      retryable: true
    };
  }

  if (lowered.includes("database is locked") || lowered.includes("database busy")) {
    return {
      title: "Local storage is temporarily busy",
      message: "Wait a moment, then try again. No vocabulary data was removed.",
      retryable: true
    };
  }

  if (lowered.includes("no such table") || lowered.includes("schema version")) {
    return {
      title: "Local database needs attention",
      message: "Run Diagnostics in Settings before trying this action again.",
      retryable: false
    };
  }

  if (lowered.includes("checksum") || lowered.includes("backup")) {
    return {
      title: "The backup could not be used",
      message: raw.length > 0 ? raw : "Validate the selected backup before retrying.",
      retryable: false
    };
  }

  return {
    title: fallbackTitle,
    message:
      raw.length > 0
        ? raw
        : "The operation did not complete. Your existing local data was left unchanged.",
    retryable: true
  };
}
