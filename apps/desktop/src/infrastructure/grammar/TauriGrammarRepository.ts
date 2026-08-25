import { invoke } from "@tauri-apps/api/core";

interface GrammarLocalAnswer {
  readonly source: "local-core-cache" | string;
  readonly cardId: string;
  readonly topicName: string;
  readonly category: string;
  readonly answerText: string;
  readonly coreRuleIds: readonly string[];
  readonly supportRuleIds: readonly string[];
  readonly confidence: number;
}

export type GrammarAnswerResult =
  | { readonly kind: "local"; readonly answer: GrammarLocalAnswer }
  | { readonly kind: "miss" }
  | { readonly kind: "desktop-required" };

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function stringArray(value: unknown): readonly string[] | undefined {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return undefined;
  }
  return Object.freeze([...value]);
}

function parseLocalAnswer(payload: unknown): GrammarLocalAnswer {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("The local grammar response is invalid.");
  }

  const value = payload as Record<string, unknown>;
  const coreRuleIds = stringArray(value.coreRuleIds);
  const supportRuleIds = stringArray(value.supportRuleIds);

  if (
    typeof value.source !== "string" ||
    typeof value.cardId !== "string" ||
    typeof value.topicName !== "string" ||
    typeof value.category !== "string" ||
    typeof value.answerText !== "string" ||
    typeof value.confidence !== "number" ||
    coreRuleIds === undefined ||
    supportRuleIds === undefined
  ) {
    throw new Error("The local grammar response is incomplete.");
  }

  return Object.freeze({
    source: value.source,
    cardId: value.cardId,
    topicName: value.topicName,
    category: value.category,
    answerText: value.answerText,
    coreRuleIds,
    supportRuleIds,
    confidence: value.confidence
  });
}

function parseAnswer(
  payload: unknown
): Exclude<GrammarAnswerResult, { readonly kind: "desktop-required" }> {
  if (typeof payload !== "object" || payload === null || !("kind" in payload)) {
    throw new Error("The grammar answer response is invalid.");
  }

  const value = payload as Record<string, unknown>;
  if (value.kind === "miss") {
    return Object.freeze({ kind: "miss" as const });
  }
  if (value.kind === "local" && "answer" in value) {
    return Object.freeze({
      kind: "local" as const,
      answer: parseLocalAnswer(value.answer)
    });
  }

  throw new Error("The grammar answer response has an unknown result kind.");
}

export class TauriGrammarRepository {
  async answerQuestion(question: string): Promise<GrammarAnswerResult> {
    const trimmed = question.trim();
    if (trimmed.length === 0) {
      return Object.freeze({ kind: "miss" as const });
    }
    if (!isTauriRuntime()) {
      return Object.freeze({ kind: "desktop-required" as const });
    }

    return parseAnswer(
      await invoke<unknown>("assistant_answer_grammar", {
        question: trimmed
      })
    );
  }
}
