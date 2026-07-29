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

type CachedAssistantCandidate = Extract<AssistantWordPreparationResult, { readonly kind: "candidate" }>;

const PREPARATION_CACHE_LIMIT = 500;
const VOICE_LOAD_TIMEOUT_MS = 1_500;
const ALLOWED_PRONUNCIATION_HOSTS = new Set(["api.dictionaryapi.dev", "ssl.gstatic.com"]);
const preparationCache = new Map<string, CachedAssistantCandidate>();
let activeAudio: HTMLAudioElement | undefined;

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

function isPronunciationUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" && ALLOWED_PRONUNCIATION_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

function stopActiveAudio(): void {
  const audio = activeAudio;
  activeAudio = undefined;

  if (audio !== undefined) {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }
}

function playRecordedPronunciation(audioUrl: string): Promise<void> {
  stopActiveAudio();

  const audio = new Audio();
  audio.preload = "none";
  audio.src = audioUrl;
  activeAudio = audio;

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      if (activeAudio === audio) {
        stopActiveAudio();
      }
    };
    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      resolve();
    };
    const fail = () => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      reject(new Error("Recorded pronunciation could not be played."));
    };

    audio.addEventListener("ended", finish, { once: true });
    audio.addEventListener("error", fail, { once: true });
    void audio.play().catch(fail);
  });
}

function selectEnglishVoice(voices: readonly SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const languageOf = (voice: SpeechSynthesisVoice) => voice.lang.toLowerCase();

  return (
    voices.find((voice) => languageOf(voice) === "en-gb") ??
    voices.find((voice) => languageOf(voice) === "en-us") ??
    voices.find((voice) => languageOf(voice).startsWith("en-")) ??
    voices.find((voice) => languageOf(voice) === "en")
  );
}

function loadSpeechVoices(synthesis: SpeechSynthesis): Promise<readonly SpeechSynthesisVoice[]> {
  const availableVoices = synthesis.getVoices();
  if (availableVoices.length > 0) {
    return Promise.resolve(availableVoices);
  }

  return new Promise((resolve) => {
    let settled = false;
    let timeoutId = 0;

    const finish = (voices: readonly SpeechSynthesisVoice[]) => {
      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeoutId);
      synthesis.removeEventListener("voiceschanged", handleVoicesChanged);
      resolve(voices);
    };
    const handleVoicesChanged = () => {
      const voices = synthesis.getVoices();
      if (voices.length > 0) {
        finish(voices);
      }
    };

    synthesis.addEventListener("voiceschanged", handleVoicesChanged);
    timeoutId = window.setTimeout(() => finish(synthesis.getVoices()), VOICE_LOAD_TIMEOUT_MS);
  });
}

async function speakWithDeviceVoice(word: string): Promise<void> {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window) ||
    typeof SpeechSynthesisUtterance === "undefined"
  ) {
    throw new Error("Pronunciation is not available on this device.");
  }

  stopActiveAudio();

  const synthesis = window.speechSynthesis;
  const voice = selectEnglishVoice(await loadSpeechVoices(synthesis));
  if (voice === undefined) {
    throw new Error("No English pronunciation voice is installed on this device.");
  }

  await new Promise<void>((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(word);

    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.volume = 1;

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
        const audioUrl = await invoke<unknown>("assistant_get_pronunciation_url", { word });
        if (isPronunciationUrl(audioUrl)) {
          await playRecordedPronunciation(audioUrl);
          return;
        }
      } catch {
        // Recorded dictionary audio is optional; a real English device voice is the fallback.
      }
    }

    await speakWithDeviceVoice(word);
  }
}
