import { createContext } from "react";
import type { InstructionPreferences } from "@platform/domain";

import type {
  AssistantConnectionStatus,
  AssistantWordPreparationResult
} from "../../infrastructure/assistant/TauriAssistantRepository";

export type AssistantConnectionLoadStatus = "loading" | "ready" | "error";

export interface AssistantContextValue {
  readonly connection: AssistantConnectionStatus;
  readonly status: AssistantConnectionLoadStatus;
  readonly error?: string | undefined;
  readonly refreshConnection: () => Promise<void>;
  readonly saveApiKey: (apiKey: string) => Promise<void>;
  readonly clearApiKey: () => Promise<void>;
  readonly prepareWord: (
    word: string,
    preferences: InstructionPreferences
  ) => Promise<AssistantWordPreparationResult>;
}

export const AssistantContext = createContext<AssistantContextValue | undefined>(undefined);
