import { invoke } from "@tauri-apps/api/core";

interface PronunciationAudioPayload {
  readonly bytes: readonly number[];
  readonly mimeType: string;
}

let activeAudio: HTMLAudioElement | undefined;
let activeObjectUrl: string | undefined;

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
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

  const bytes = Uint8Array.from(payload.bytes);
  const objectUrl = URL.createObjectURL(new Blob([bytes], { type: payload.mimeType }));
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

export async function pronounceEnglishWord(word: string): Promise<void> {
  if (isTauriRuntime()) {
    try {
      const payload = await invoke<unknown>("assistant_get_pronunciation_audio", { word });
      if (isPronunciationAudioPayload(payload) && payload.bytes.length > 0) {
        await playRecordedPronunciation(payload);
        return;
      }
    } catch {
      // Dictionary audio is optional. The device voice below is the free fallback.
    }
  }

  await speakWithDeviceVoice(word);
}
