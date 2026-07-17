import type { InstructionPreferences } from "@platform/domain";

const PRIMARY_EXAMPLE_COUNT = 3;

function enabledLabel(value: boolean): string {
  return value ? "required" : "omit when no reliable content exists";
}

export function renderVocabularyInstructionRules(
  targetWord: string,
  preferences: InstructionPreferences
): string {
  return [
    "You are preparing one production-quality English vocabulary entry for a local learning application.",
    "",
    `TARGET WORD: ${targetWord}`,
    `EXPLANATION LANGUAGE: Turkish (tr)`,
    `TARGET LEARNER LEVEL: ${preferences.targetProficiency.toUpperCase()}`,
    `DETAIL LEVEL: ${preferences.detailLevel}`,
    `PRIMARY EXAMPLE SENTENCES: ${PRIMARY_EXAMPLE_COUNT}`,
    "",
    "CONTENT REQUIREMENTS",
    `- Word family: ${enabledLabel(preferences.includeWordFamily)}.`,
    `- Applicable grammar notes: ${enabledLabel(preferences.includeGrammarNotes)}.`,
    `- Common learner mistakes: ${enabledLabel(preferences.includeCommonMistakes)}.`,
    `- Etymology: ${enabledLabel(preferences.includeEtymology)}; never invent uncertain origins.`,
    `- Practical usage tips: ${enabledLabel(preferences.includeUsageTips)}.`,
    "- Separate genuinely different meanings. Give precise Turkish translations for every meaning.",
    "- Include only real collocations, phrasal verbs, idioms, related words, and preposition patterns.",
    "- Empty arrays are correct when a structure does not naturally apply.",
    "- Never force tense, passive, conditional, idiom, phrasal-verb, or preposition content merely to fill fields.",
    "- Grammar examples must use the target word naturally and must match the stated grammar label.",
    `- Provide ${PRIMARY_EXAMPLE_COUNT} primary examples, each with an accurate Turkish translation.`,
    "- Avoid duplicate examples, duplicate meanings, circular definitions, and generic filler.",
    "",
    "IDENTITY AND NORMALIZATION RULES",
    `- entry.word must be the canonical display form of '${targetWord}'.`,
    `- entry.normalizedWord must be exactly '${targetWord}'.`,
    "- aliases may contain only authentic alternate or inflected forms useful for local search.",
    "- Use compact, deterministic-looking identifiers without spaces.",
    "",
    "OUTPUT RULES",
    "- Return exactly one JSON object and nothing else.",
    "- Do not use Markdown fences, commentary, headings, apologies, or notes outside the JSON object.",
    "- Include every required property from the JSON Schema.",
    "- Do not add properties that are absent from the JSON Schema.",
    "- Use valid UTC ISO-8601 timestamps.",
    "- Set generation.method to 'external-ai' and generation.validationStatus to 'unvalidated'; English Focus performs its own validation and review.",
    "- Set source.kind to 'user' and use a neutral sourceLabel such as 'External AI import'."
  ].join("\n");
}
