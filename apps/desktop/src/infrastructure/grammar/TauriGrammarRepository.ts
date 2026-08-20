import { invoke } from "@tauri-apps/api/core";

export interface GrammarLocalAnswer {
  readonly source: "local-core-cache" | string;
  readonly cardId: string;
  readonly topicName: string;
  readonly category: string;
  readonly answerText: string;
  readonly coreRuleIds: readonly string[];
  readonly supportRuleIds: readonly string[];
  readonly confidence: number;
}

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function stringArray(value: unknown): readonly string[] | undefined {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return undefined;
  }
  return Object.freeze([...value]);
}

function parseLocalAnswer(payload: unknown): GrammarLocalAnswer | undefined {
  if (payload === null || payload === undefined) {
    return undefined;
  }
  if (typeof payload !== "object") {
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

export class TauriGrammarRepository {
  async answerLocal(question: string): Promise<GrammarLocalAnswer | undefined> {
    const trimmed = question.trim();
    if (trimmed.length === 0 || !isTauriRuntime()) {
      return undefined;
    }

    return parseLocalAnswer(
      await invoke<unknown>("assistant_answer_grammar_local", {
        question: trimmed
      })
    );
  }
}
