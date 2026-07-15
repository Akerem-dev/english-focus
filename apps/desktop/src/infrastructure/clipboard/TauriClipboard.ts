import { ClipboardError, type Clipboard } from "@platform/domain";

function copyWithTextAreaFallback(text: string): boolean {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.inset = "0 auto auto -9999px";
  textArea.style.opacity = "0";
  document.body.append(textArea);
  textArea.select();

  try {
    return document.execCommand("copy");
  } finally {
    textArea.remove();
  }
}

/**
 * Uses the secure WebView clipboard API when available and a local textarea
 * fallback otherwise. No remote service or Tauri plugin is required.
 */
export class TauriClipboard implements Clipboard {
  async writeText(text: string): Promise<void> {
    let primaryFailure: unknown;

    if (navigator.clipboard?.writeText !== undefined) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch (error) {
        primaryFailure = error;
      }
    }

    try {
      if (copyWithTextAreaFallback(text)) {
        return;
      }

      throw new Error("The browser clipboard fallback returned false.");
    } catch (fallbackFailure) {
      throw new ClipboardError(undefined, {
        cause: fallbackFailure ?? primaryFailure
      });
    }
  }
}
