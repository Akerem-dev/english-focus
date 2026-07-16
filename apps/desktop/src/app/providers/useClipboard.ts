import { useContext } from "react";

import { ClipboardError, type Clipboard } from "@platform/domain";

import { ClipboardContext } from "./ClipboardContext";

const MISSING_CLIPBOARD: Clipboard = Object.freeze({
  async writeText(): Promise<void> {
    throw new ClipboardError("ClipboardProvider is not mounted.");
  }
});

export function useClipboard(): Clipboard {
  return useContext(ClipboardContext) ?? MISSING_CLIPBOARD;
}
