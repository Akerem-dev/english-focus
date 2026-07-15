export type JsonObjectExtractionResult =
  | {
      readonly kind: "success";
      readonly text: string;
      readonly removedLeadingText: boolean;
      readonly removedTrailingText: boolean;
    }
  | {
      readonly kind: "failure";
      readonly code: "no-object" | "unterminated-object";
      readonly message: string;
    };

export function extractFirstJsonObject(input: string): JsonObjectExtractionResult {
  const startIndex = input.indexOf("{");

  if (startIndex < 0) {
    return {
      kind: "failure",
      code: "no-object",
      message: "No JSON object was found in the pasted text."
    };
  }

  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = startIndex; index < input.length; index += 1) {
    const character = input[index];

    if (character === undefined) {
      continue;
    }

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (character === "\\") {
        isEscaped = true;
      } else if (character === '"') {
        inString = false;
      }

      continue;
    }

    if (character === '"') {
      inString = true;
      continue;
    }

    if (character === "{") {
      depth += 1;
      continue;
    }

    if (character !== "}") {
      continue;
    }

    depth -= 1;

    if (depth === 0) {
      return {
        kind: "success",
        text: input.slice(startIndex, index + 1),
        removedLeadingText: input.slice(0, startIndex).trim().length > 0,
        removedTrailingText: input.slice(index + 1).trim().length > 0
      };
    }
  }

  return {
    kind: "failure",
    code: "unterminated-object",
    message: "A JSON object started, but its closing brace could not be found."
  };
}
