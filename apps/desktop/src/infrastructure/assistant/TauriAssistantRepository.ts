import { invoke } from "@tauri-apps/api/core";
import type { InstructionPreferences } from "@platform/domain";

export const ASSISTANT_MODEL = "Automatic · Gemini 3.5 Flash-Lite → 3.6 Flash";

export interface AssistantConnectionStatus {
  readonly runtime: "browser" | "desktop";
  readonly configured: boolean;
  readonly model: string;
}

export type AssistantPreparationStrategy = "automatic" | "quality";

export type AssistantWordPreparationResult =
  | {
      readonly kind: "candidate";
      readonly value: unknown;
      readonly model: string;
    }
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
  readonly model: unknown;
}

interface PronunciationAudioPayload {
  readonly bytes: readonly number[];
  readonly mimeType: string;
}

type CachedAssistantCandidate = Extract<AssistantWordPreparationResult, { readonly kind: "candidate" }>;

const PREPARATION_CACHE_LIMIT = 500;
const preparationCache = new Map<string, CachedAssistantCandidate>();
let activeAudio: HTMLAudioElement | undefined;
let activeObjectUrl: string | undefined;

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function errorText(cause: unknown): string {
  if (cause instanceof Error) {
    return cause.message;
  }

  return typeof cause === "string" ? cause : "The word helper request failed.";
}

function preparationCacheKey(
  word: string,
  preferences: InstructionPreferences,
  strategy: AssistantPreparationStrategy
): string {
  const normalizedWord = word
    .trim()
    .replaceAll("’", "'")
    .split(/\s+/u)
    .join(" ")
    .toLocaleLowerCase("en-US");

  return `${normalizedWord}|${strategy}|${JSON.stringify(preferences)}`;
}

function rememberPreparation(key: string, candidate: CachedAssistantCandidate): void {
  if (preparationCache.size >= PREPARATION_CACHE_LIMIT) {
    const oldestKey = preparationCache.keys().next().value;
    if (typeof oldestKey === "string") {
      preparationCache.delete(oldestKey);
    }
  }

  preparationCache.set(key, candidate);
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

function parseCandidate(payload: unknown): Readonly<{ value: unknown; model: string }> {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("value" in payload) ||
    !("model" in payload)
  ) {
    throw new Error("The prepared vocabulary response is incomplete.");
  }

  const candidate = payload as AssistantCandidatePayload;
  if (typeof candidate.model !== "string" || candidate.model.length === 0) {
    throw new Error("The prepared vocabulary response has no model information.");
  }

  return Object.freeze({
    value: candidate.value,
    model: candidate.model
  });
}

function isPronunciationAudioPayload(value: unknown): value is PronunciationAudioPayload {
  if (typeof value !== "object" || value === null || !("bytes" in value) || !("mimeType" in value)) {
    return false;
  }

  const payload = value as { readonly bytes: unknown; readonly mimeType: unknown };
  return (
    Array.isArray(payload.bytes) &&
    payload.bytes.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255) &&
    typeof payload.mimeType === "string" &&
    payload.mimeType.startsWith("audio/")
  );
}

function stopActiveAudio(): void {
  activeAudio?.pause();
  activeAudio = undefined;

  if (activeObjectUrl !== undefined) {
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = undefined;
  }
}

async function playRecordedPronunciation(payload: PronunciationAudioPayload): Promise<void> {
  stopActiveAudio();

  const audioBuffer = Uint8Array.from(payload.bytes).buffer as ArrayBuffer;
  const objectUrl = URL.createObjectURL(new Blob([audioBuffer], { type: payload.mimeType }));
  const audio = new Audio(objectUrl);

  activeAudio = audio;
  activeObjectUrl = objectUrl;

  const cleanup = () => {
    if (activeAudio === audio) {
      stopActiveAudio();
    }
  };

  audio.addEventListener("ended", cleanup, { once: true });
  audio.addEventListener("error", cleanup, { once: true });

  try {
    await audio.play();
  } catch (cause) {
    cleanup();
    throw cause;
  }
}

function selectEnglishVoice(voices: readonly SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  return (
    voices.find((voice) => voice.lang.toLocaleLowerCase("en-US") === "en-gb") ??
    voices.find((voice) => voice.lang.toLocaleLowerCase("en-US") === "en-us") ??
    voices.find((voice) => voice.lang.toLocaleLowerCase("en-US").startsWith("en"))
  );
}

function speakWithDeviceVoice(word: string): Promise<void> {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window) ||
    typeof SpeechSynthesisUtterance === "undefined"
  ) {
    return Promise.reject(new Error("Pronunciation is not available on this device."));
  }

  return new Promise((resolve, reject) => {
    stopActiveAudio();

    const synthesis = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(word);
    const voice = selectEnglishVoice(synthesis.getVoices());

    utterance.lang = voice?.lang ?? "en-GB";
    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.volume = 1;
    if (voice !== undefined) {
      utterance.voice = voice;
    }

    utterance.addEventListener("end", () => resolve(), { once: true });
    utterance.addEventListener(
      "error",
      () => reject(new Error("Pronunciation could not be played.")),
      { once: true }
    );

    synthesis.cancel();
    synthesis.speak(utterance);
  });
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

    preparationCache.clear();
    return parseStatus(await invoke<unknown>("assistant_clear_api_key"));
  }

  async prepareWord(
    word: string,
    preferences: InstructionPreferences,
    strategy: AssistantPreparationStrategy = "automatic"
  ): Promise<AssistantWordPreparationResult> {
    if (!isTauriRuntime()) {
      return Object.freeze({
        kind: "provider-unavailable" as const,
        reason: "desktop-required" as const
      });
    }

    const cacheKey = preparationCacheKey(word, preferences, strategy);
    const cachedCandidate = preparationCache.get(cacheKey);
    if (cachedCandidate !== undefined) {
      return cachedCandidate;
    }

    try {
      const payload = parseCandidate(
        await invoke<unknown>("assistant_generate_vocabulary", {
          word,
          preferences,
          qualityOnly: strategy === "quality"
        })
      );
      const candidate = Object.freeze({
        kind: "candidate" as const,
        value: payload.value,
        model: payload.model
      });

      rememberPreparation(cacheKey, candidate);
      return candidate;
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

  async pronounceWord(word: string): Promise<void> {
    if (isTauriRuntime()) {
      try {
        const payload = await invoke<unknown>("assistant_get_pronunciation_audio", { word });
        if (isPronunciationAudioPayload(payload) && payload.bytes.length > 0) {
          await playRecordedPronunciation(payload);
          return;
        }
      } catch {
        // Recorded dictionary audio is optional; the free device voice is the fallback.
      }
    }

    await speakWithDeviceVoice(word);
  }
}
