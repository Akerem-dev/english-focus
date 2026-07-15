import type { ImportIssue, VocabularyEntry } from "@platform/domain";
import { vocabularyEntrySchema } from "@platform/schemas";

export type ValidateVocabularySchemaResult =
  | {
      readonly kind: "success";
      readonly entry: VocabularyEntry;
      readonly issues: readonly [];
    }
  | {
      readonly kind: "failure";
      readonly issues: readonly ImportIssue[];
    };

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }

  for (const nestedValue of Object.values(value as Record<string, unknown>)) {
    deepFreeze(nestedValue);
  }

  return Object.freeze(value);
}

function formatIssuePath(path: readonly PropertyKey[]): string {
  if (path.length === 0) {
    return "entry";
  }

  return path.reduce<string>((formatted, segment) => {
    if (typeof segment === "number") {
      return `${formatted}[${segment}]`;
    }

    const key = String(segment);
    const nextSegment = /^[A-Za-z_$][\w$]*$/u.test(key) ? key : `[${JSON.stringify(key)}]`;

    if (formatted.length === 0 || nextSegment.startsWith("[")) {
      return `${formatted}${nextSegment}`;
    }

    return `${formatted}.${nextSegment}`;
  }, "");
}

function toImportIssue(issue: {
  readonly code: string;
  readonly message: string;
  readonly path: readonly PropertyKey[];
}): ImportIssue {
  const path = issue.path.map((segment) =>
    typeof segment === "number" ? segment : String(segment)
  );

  return Object.freeze({
    source: "schema",
    severity: "error",
    code: issue.code,
    path: Object.freeze(path),
    pathText: formatIssuePath(path),
    message: issue.message
  });
}

/** Validates one already-parsed top-level object against the versioned vocabulary contract. */
export function validateVocabularySchema(value: unknown): ValidateVocabularySchemaResult {
  const result = vocabularyEntrySchema.safeParse(value);

  if (result.success) {
    return Object.freeze({
      kind: "success",
      entry: deepFreeze(result.data),
      issues: [] as const
    });
  }

  const issues = result.error.issues.map(toImportIssue);

  return Object.freeze({
    kind: "failure",
    issues: Object.freeze(issues)
  });
}
