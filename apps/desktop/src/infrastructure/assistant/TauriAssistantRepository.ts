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

function parsePronunciationBytes(value: unknown): Uint8Array | undefined {
  if (value instanceof ArrayBuffer) {
    return value.byteLength > 0 ? new Uint8Array(value) : undefined;
  }

  if (value instanceof Uint8Array) {
    return value.byteLength > 0 ? value : undefined;
  }

  if (ArrayBuffer.isView(value)) {
    const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    return bytes.byteLength > 0 ? bytes.slice() : undefined;
  }

  if (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255)
  ) {
    return Uint8Array.from(value);
  }

  return undefined;
}

function hasAscii(bytes: Uint8Array, offset: number, text: string): boolean {
  if (offset + text.length > bytes.length) {
    return false;
  }

  for (let index = 0; index < text.length; index += 1) {
    if (bytes[offset + index] !== text.charCodeAt(index)) {
      return false;
    }
  }

  return true;
}

function audioMimeType(bytes: Uint8Array): string | undefined {
  if (
    hasAscii(bytes, 0, "ID3") ||
    (bytes.at(0) === 0xff && ((bytes.at(1) ?? 0) & 0xe0) === 0xe0)
  ) {
    return "audio/mpeg";
  }

  if (hasAscii(bytes, 0, "OggS")) {
    return "audio/ogg";
  }

  if (hasAscii(bytes, 0, "RIFF") && hasAscii(bytes, 8, "WAVE")) {
    return "audio/wav";
  }

  if (hasAscii(bytes, 0, "fLaC")) {
    return "audio/flac";
  }

  if (
    bytes.length >= 4 &&
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  ) {
    return "audio/webm";
  }

  if (hasAscii(bytes, 4, "ftyp")) {
    return "audio/mp4";
  }

  return undefined;
}

function stopActiveAudio(): void {
  const audio = activeAudio;
  activeAudio = undefined;

  if (audio !== undefined) {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }

  if (activeObjectUrl !== undefined) {
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = undefined;
  }
}

function playRecordedPronunciation(bytes: Uint8Array): Promise<void> {
  const mimeType = audioMimeType(bytes);
  if (mimeType === undefined) {
    return Promise.reject(new Error("Recorded pronunciation has an unsupported audio format."));
  }

  stopActiveAudio();

  const audioBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
  const objectUrl = URL.createObjectURL(new Blob([audioBuffer], { type: mimeType }));
  const audio = new Audio(objectUrl);

  audio.preload = "auto";
  activeAudio = audio;
  activeObjectUrl = objectUrl;

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
        const response = await invoke<ArrayBuffer>("assistant_get_pronunciation_audio", { word });
        const bytes = parsePronunciationBytes(response);
        if (bytes !== undefined) {
          await playRecordedPronunciation(bytes);
          return;
        }
      } catch {
        // Both free recorded-audio providers are optional; a real English device voice is the fallback.
      }
    }

    await speakWithDeviceVoice(word);
  }
}
