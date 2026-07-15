import {
  VOCABULARY_INSTRUCTION_TEMPLATE_VERSION,
  VOCABULARY_SCHEMA_VERSION,
  type InstructionPreferences,
  type InstructionTemplate
} from "@platform/domain";
import { vocabularyEntryJsonSchema } from "@platform/schemas";

import { renderVocabularyInstructionRules } from "../templates";

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, sortJsonValue(nestedValue)])
    );
  }

  return value;
}

export interface RenderVocabularyInstructionInput {
  readonly targetWord: string;
  readonly preferences: InstructionPreferences;
}

export class InstructionTemplateRenderer {
  renderVocabularyInstruction({
    targetWord,
    preferences
  }: RenderVocabularyInstructionInput): InstructionTemplate {
    const schemaText = JSON.stringify(sortJsonValue(vocabularyEntryJsonSchema), null, 2);
    const text = [
      renderVocabularyInstructionRules(targetWord, preferences),
      "",
      `VOCABULARY SCHEMA VERSION: ${VOCABULARY_SCHEMA_VERSION}`,
      `INSTRUCTION TEMPLATE VERSION: ${VOCABULARY_INSTRUCTION_TEMPLATE_VERSION}`,
      "",
      "REQUIRED JSON SCHEMA",
      schemaText
    ].join("\n");

    return Object.freeze({
      templateId: "english-focus-vocabulary-entry" as const,
      templateVersion: VOCABULARY_INSTRUCTION_TEMPLATE_VERSION,
      targetWord,
      vocabularySchemaVersion: VOCABULARY_SCHEMA_VERSION,
      preferences,
      text
    });
  }
}
