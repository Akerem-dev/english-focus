import { cleanPastedJsonText, type JsonTextTransformation } from "./CleanPastedJsonText";
import { normalizeSmartJsonQuotes, repairMojibakeJsonValue } from "../services";

type ParsedJsonTransformation =
  JsonTextTransformation | "normalized-smart-quotes" | "repaired-mojibake-text";

interface ParsedVocabularyJson {
  readonly value: Readonly<Record<string, unknown>>;
  readonly cleanedText: string;
  readonly transformations: readonly ParsedJsonTransformation[];
  readonly topLevelKeys: readonly string[];
  readonly detectedWord?: string;
}

export type ParseVocabularyJsonResult =
  | {
      readonly kind: "success";
      readonly parsed: ParsedVocabularyJson;
    }
  | {
      readonly kind: "failure";
      readonly code:
        | "empty"
        | "too-large"
        | "no-object"
        | "unterminated-object"
        | "invalid-json"
        | "invalid-top-level";
      readonly message: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractJsonPosition(message: string): number | undefined {
  const positionMatch = /position\s+(\d+)/iu.exec(message);
  const rawPosition = positionMatch?.[1];

  if (rawPosition === undefined) {
    return undefined;
  }

  const position = Number.parseInt(rawPosition, 10);
  return Number.isFinite(position) ? position : undefined;
}

function describeJsonSyntaxError(error: unknown, text: string): string {
  if (!(error instanceof SyntaxError)) {
    return "The pasted text could not be parsed as JSON.";
  }

  const position = extractJsonPosition(error.message);

  if (position === undefined) {
    return `The JSON syntax is invalid: ${error.message}`;
  }

  const beforeError = text.slice(0, position);
  const line = beforeError.split("\n").length;
  const lastLineBreak = beforeError.lastIndexOf("\n");
  const column = position - lastLineBreak;

  return `The JSON syntax is invalid near line ${line}, column ${column}.`;
}

function parseRecord(
  text: string
):
  | { readonly kind: "success"; readonly value: Record<string, unknown> }
  | { readonly kind: "failure"; readonly error: unknown } {
  try {
    const value: unknown = JSON.parse(text);

    if (!isRecord(value)) {
      return {
        kind: "failure",
        error: new TypeError("The top-level JSON value must be an object.")
      };
    }

    return { kind: "success", value };
  } catch (error) {
    return { kind: "failure", error };
  }
}

function createSuccessResult(
  value: Record<string, unknown>,
  cleanedText: string,
  transformations: readonly ParsedJsonTransformation[]
): ParseVocabularyJsonResult {
  const repairResult = repairMojibakeJsonValue(value);
  const repairedValue = repairResult.value;
  const finalTransformations = repairResult.changed
    ? [...transformations, "repaired-mojibake-text" as const]
    : transformations;
  const finalCleanedText = repairResult.changed
    ? JSON.stringify(repairedValue, null, 2)
    : cleanedText;
  const detectedWord = typeof repairedValue.word === "string" ? repairedValue.word : undefined;

  return {
    kind: "success",
    parsed: {
      value: Object.freeze(repairedValue),
      cleanedText: finalCleanedText,
      transformations: finalTransformations,
      topLevelKeys: Object.keys(repairedValue),
      ...(detectedWord === undefined ? {} : { detectedWord })
    }
  };
}

export function parseVocabularyJson(input: string): ParseVocabularyJsonResult {
  const cleaned = cleanPastedJsonText(input);

  if (cleaned.kind === "failure") {
    return {
      kind: "failure",
      code: cleaned.code,
      message: cleaned.message
    };
  }

  const firstAttempt = parseRecord(cleaned.cleanedText);

  if (firstAttempt.kind === "success") {
    return createSuccessResult(firstAttempt.value, cleaned.cleanedText, cleaned.transformations);
  }

  const smartQuoteResult = normalizeSmartJsonQuotes(cleaned.cleanedText);

  if (smartQuoteResult.changed) {
    const fallbackAttempt = parseRecord(smartQuoteResult.text);

    if (fallbackAttempt.kind === "success") {
      return createSuccessResult(fallbackAttempt.value, smartQuoteResult.text, [
        ...cleaned.transformations,
        "normalized-smart-quotes"
      ]);
    }
  }

  if (firstAttempt.error instanceof TypeError) {
    return {
      kind: "failure",
      code: "invalid-top-level",
      message: firstAttempt.error.message
    };
  }

  return {
    kind: "failure",
    code: "invalid-json",
    message: describeJsonSyntaxError(firstAttempt.error, cleaned.cleanedText)
  };
}
