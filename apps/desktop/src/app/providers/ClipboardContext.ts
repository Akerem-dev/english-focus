import { createContext } from "react";

import type { Clipboard } from "@platform/domain";

export const ClipboardContext = createContext<Clipboard | undefined>(undefined);
