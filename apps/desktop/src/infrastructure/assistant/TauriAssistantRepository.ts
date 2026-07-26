import { invoke } from "@tauri-apps/api/core";
import type { InstructionPreferences } from "@platform/domain";

export const ASSISTANT_MODEL = "Automatic · Gemini 3.5 Flash-Lite → 3.6 Flash";

export interface AssistantConnectionStatus {
  readonly runtime: "browser" | "desktop";
  readonly configured: boolean;
  readonly model: string;
}

export type AssistantWordPreparationResult =
  | { readonly kind: "candidate"; readonly value: unknown }
  | {
      readonly kind: "provider-unavailable";
      readonly reason: "desktop-required" | "not-configured";
    };

interface AssistantStatusPayload {
  readonly configured: unknown;
  readonly model: unknown;
}

interface AssistantCandidatePayload {
  readonly value: unknown;
}

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function errorText(cause: unknown): string {
  if (cause instanceof Error) {
    return cause.message;
  }

  return typeof cause === "string" ? cause : "The word helper request failed.";
}

function parseStatus(payload: unknown): AssistantConnectionStatus {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("configured" in payload) ||
    !("model" in payload)
  ) {
    throw new Error("The word helper connection response is invalid.");
  }

  const status = payload as AssistantStatusPayload;
  if (typeof status.configured !== "boolean" || typeof status.model !== "string") {
    throw new Error("The word helper connection response is incomplete.");
  }

  return Object.freeze({
    runtime: "desktop" as const,
    configured: status.configured,
    model: status.model
  });
}

function parseCandidate(payload: unknown): unknown {
  if (typeof payload !== "object" || payload === null || !("value" in payload)) {
    throw new Error("The prepared vocabulary response is incomplete.");
  }

  return (payload as AssistantCandidatePayload).value;
}

export class TauriAssistantRepository {
  async getStatus(): Promise<AssistantConnectionStatus> {
    if (!isTauriRuntime()) {
      return Object.freeze({
        runtime: "browser" as const,
        configured: false,
        model: ASSISTANT_MODEL
      });
    }

    return parseStatus(await invoke<unknown>("assistant_get_status"));
  }

  async saveApiKey(apiKey: string): Promise<AssistantConnectionStatus> {
    if (!isTauriRuntime()) {
      throw new Error("Open the English Focus desktop app to connect the word helper.");
    }

    return parseStatus(
      await invoke<unknown>("assistant_save_api_key", {
        apiKey
      })
    );
  }

  async clearApiKey(): Promise<AssistantConnectionStatus> {
    if (!isTauriRuntime()) {
      throw new Error("Open the English Focus desktop app to change the word helper connection.");
    }

    return parseStatus(await invoke<unknown>("assistant_clear_api_key"));
  }

  async prepareWord(
    word: string,
    preferences: InstructionPreferences
  ): Promise<AssistantWordPreparationResult> {
    if (!isTauriRuntime()) {
      return Object.freeze({
        kind: "provider-unavailable" as const,
        reason: "desktop-required" as const
      });
    }

    try {
      const payload = await invoke<unknown>("assistant_generate_vocabulary", {
        word,
        preferences
      });

      return Object.freeze({
        kind: "candidate" as const,
        value: parseCandidate(payload)
      });
    } catch (cause) {
      const message = errorText(cause);
      if (message.includes("assistant_api_key_missing")) {
        return Object.freeze({
          kind: "provider-unavailable" as const,
          reason: "not-configured" as const
        });
      }

      throw new Error(message);
    }
  }
}
