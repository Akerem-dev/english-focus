type AssistantWordPreparationResult =
  | { readonly kind: "candidate"; readonly value: unknown }
  | { readonly kind: "provider-unavailable" };

/**
 * Provider boundary for assistant-created vocabulary content.
 *
 * The local review and persistence path is intentionally complete before a remote provider
 * is connected. The Gemini implementation will replace this unavailable result in the next
 * roadmap stage while keeping the user-facing review and save flow unchanged.
 */
export function prepareAssistantWord(word: string): Promise<AssistantWordPreparationResult> {
  void word;
  return Promise.resolve(Object.freeze({ kind: "provider-unavailable" as const }));
}
