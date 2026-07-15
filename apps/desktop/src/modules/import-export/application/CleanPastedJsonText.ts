import { extractFirstJsonObject, removeMarkdownFence } from "../services";

export const MAX_PASTED_JSON_CHARACTERS = 524_288;

export type JsonTextTransformation =
  | "trimmed-whitespace"
  | "removed-byte-order-mark"
  | "removed-markdown-fence"
  | "removed-leading-text"
  | "removed-trailing-text"
  | "normalized-line-endings";

export type CleanPastedJsonTextResult =
  | {
      readonly kind: "success";
      readonly cleanedText: string;
      readonly originalLength: number;
      readonly cleanedLength: number;
      readonly transformations: readonly JsonTextTransformation[];
    }
  | {
      readonly kind: "failure";
      readonly code: "empty" | "too-large" | "no-object" | "unterminated-object";
      readonly message: string;
      readonly originalLength: number;
    };

function appendTransformation(
  transformations: JsonTextTransformation[],
  transformation: JsonTextTransformation,
  condition: boolean
) {
  if (condition) {
    transformations.push(transformation);
  }
}

export function cleanPastedJsonText(input: string): CleanPastedJsonTextResult {
  const originalLength = input.length;

  if (originalLength > MAX_PASTED_JSON_CHARACTERS) {
    return {
      kind: "failure",
      code: "too-large",
      message: `The pasted text exceeds the ${MAX_PASTED_JSON_CHARACTERS.toLocaleString("en-US")} character safety limit.`,
      originalLength
    };
  }

  const transformations: JsonTextTransformation[] = [];
  const withoutByteOrderMark = input.replace(/^\uFEFF/u, "");
  appendTransformation(transformations, "removed-byte-order-mark", withoutByteOrderMark !== input);

  const withNormalizedLineEndings = withoutByteOrderMark.replace(/\r\n?/gu, "\n");
  appendTransformation(
    transformations,
    "normalized-line-endings",
    withNormalizedLineEndings !== withoutByteOrderMark
  );

  const trimmed = withNormalizedLineEndings.trim();
  appendTransformation(
    transformations,
    "trimmed-whitespace",
    trimmed !== withNormalizedLineEndings
  );

  if (trimmed.length === 0) {
    return {
      kind: "failure",
      code: "empty",
      message: "Paste the JSON generated for this vocabulary entry.",
      originalLength
    };
  }

  const fenceResult = removeMarkdownFence(trimmed);
  appendTransformation(transformations, "removed-markdown-fence", fenceResult.removed);

  const extractionResult = extractFirstJsonObject(fenceResult.text);

  if (extractionResult.kind === "failure") {
    return {
      kind: "failure",
      code: extractionResult.code,
      message: extractionResult.message,
      originalLength
    };
  }

  appendTransformation(
    transformations,
    "removed-leading-text",
    extractionResult.removedLeadingText
  );
  appendTransformation(
    transformations,
    "removed-trailing-text",
    extractionResult.removedTrailingText
  );

  return {
    kind: "success",
    cleanedText: extractionResult.text.trim(),
    originalLength,
    cleanedLength: extractionResult.text.trim().length,
    transformations
  };
}
