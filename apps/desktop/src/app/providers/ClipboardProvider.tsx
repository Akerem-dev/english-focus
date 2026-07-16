import { useMemo, type PropsWithChildren } from "react";

import type { Clipboard } from "@platform/domain";

import { TauriClipboard } from "../../infrastructure/clipboard";
import { ClipboardContext } from "./ClipboardContext";

interface ClipboardProviderProps extends PropsWithChildren {
  readonly clipboard?: Clipboard;
}

export function ClipboardProvider({ children, clipboard }: ClipboardProviderProps) {
  const value = useMemo(() => clipboard ?? new TauriClipboard(), [clipboard]);

  return <ClipboardContext.Provider value={value}>{children}</ClipboardContext.Provider>;
}
