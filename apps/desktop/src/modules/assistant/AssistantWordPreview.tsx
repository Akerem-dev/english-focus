import type { VocabularyEntry } from "@platform/domain";

type AssistantWordPreviewState = "waiting" | "existing" | "ready" | "saved";

export interface AssistantWordPreviewModel {
  readonly word: string;
  readonly normalizedWord: string;
  readonly partOfSpeech?: string | undefined;
  readonly cefr?: string | undefined;
  readonly translationsTr: readonly string[];
  readonly definitionEn?: string | undefined;
  readonly exampleEn?: string | undefined;
  readonly exampleTr?: string | undefined;
  readonly state: AssistantWordPreviewState;
  readonly complete: boolean;
}

function formatPartOfSpeech(value: string): string {
  return value.replaceAll("-", " ").toLocaleLowerCase("en-US");
}

export function createAssistantWordPreview(
  word: string,
  entry?: VocabularyEntry,
  state: AssistantWordPreviewState = entry === undefined ? "waiting" : "existing"
): AssistantWordPreviewModel {
  if (entry === undefined) {
    return {
      word,
      normalizedWord: word.trim().toLocaleLowerCase("en-US"),
      translationsTr: Object.freeze([]),
      state: "waiting",
      complete: false
    };
  }

  const primaryMeaning = entry.meanings[0];
  const primaryExample = entry.examples[0];
  const partOfSpeech = primaryMeaning?.partOfSpeech ?? entry.partsOfSpeech[0];

  return {
    word: entry.word,
    normalizedWord: entry.normalizedWord,
    ...(partOfSpeech === undefined ? {} : { partOfSpeech: formatPartOfSpeech(partOfSpeech) }),
    cefr: entry.cefr,
    translationsTr: Object.freeze([...(primaryMeaning?.translationsTr ?? [])]),
    ...(primaryMeaning?.definitionEn === undefined
      ? {}
      : { definitionEn: primaryMeaning.definitionEn }),
    ...(primaryExample?.sentenceEn === undefined ? {} : { exampleEn: primaryExample.sentenceEn }),
    ...(primaryExample?.translationTr === undefined
      ? {}
      : { exampleTr: primaryExample.translationTr }),
    state,
    complete: true
  };
}
