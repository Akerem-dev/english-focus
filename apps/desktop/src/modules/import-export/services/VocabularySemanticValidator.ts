import type { ImportIssue, VocabularyEntry } from "@platform/domain";

const APOSTROPHES = /[‘’‛`´]/gu;
const DASHES = /[‐‑‒–—―]/gu;

function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(APOSTROPHES, "'")
    .replace(DASHES, "-")
    .trim()
    .replace(/\s+/gu, " ")
    .toLocaleLowerCase("en-US");
}

function formatIssuePath(path: readonly (string | number)[]): string {
  if (path.length === 0) {
    return "entry";
  }

  return path.reduce<string>((formatted, segment) => {
    if (typeof segment === "number") {
      return `${formatted}[${segment}]`;
    }
    return formatted.length === 0 ? segment : `${formatted}.${segment}`;
  }, "");
}

function semanticIssue(
  code: string,
  path: readonly (string | number)[],
  message: string
): ImportIssue {
  return Object.freeze({
    source: "semantic",
    severity: "error",
    code,
    path: Object.freeze([...path]),
    pathText: formatIssuePath(path),
    message
  });
}

function hasPairedValues(first: string | undefined, second: string | undefined): boolean {
  return (first === undefined) === (second === undefined);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function textContainsRecognizedForm(text: string, recognizedForms: ReadonlySet<string>): boolean {
  const normalizedText = normalizeText(text);

  for (const form of recognizedForms) {
    const pattern = new RegExp(`(^|[^a-z'])${escapeRegExp(form)}($|[^a-z'])`, "u");
    if (pattern.test(normalizedText)) {
      return true;
    }
  }

  return false;
}

function collectRecognizedForms(entry: VocabularyEntry): ReadonlySet<string> {
  return new Set<string>([
    normalizeText(entry.word),
    normalizeText(entry.normalizedWord),
    ...entry.aliases.map(normalizeText),
    ...entry.morphology.inflectedForms.map((form) => normalizeText(form.normalizedForm))
  ]);
}

function pushDuplicateIssues(
  values: readonly string[],
  path: readonly (string | number)[],
  code: string,
  label: string,
  issues: ImportIssue[]
): void {
  const seen = new Set<string>();

  values.forEach((value, index) => {
    const normalized = normalizeText(value);
    if (seen.has(normalized)) {
      issues.push(semanticIssue(code, [...path, index], `${label} “${value}” is duplicated.`));
      return;
    }
    seen.add(normalized);
  });
}

export type VocabularySemanticValidationContext = "external-ai-import" | "vocabulary-pack-transfer";

/** Cross-field checks for the simplified canonical vocabulary record. */
export class VocabularySemanticValidator {
  validate(
    entry: VocabularyEntry,
    expectedWord: string,
    context: VocabularySemanticValidationContext = "external-ai-import"
  ): readonly ImportIssue[] {
    const issues: ImportIssue[] = [];
    const normalizedExpectedWord = normalizeText(expectedWord);
    const normalizedEntryWord = normalizeText(entry.word);
    const recognizedForms = collectRecognizedForms(entry);

    if (entry.normalizedWord !== normalizedExpectedWord) {
      issues.push(
        semanticIssue(
          "target_word_mismatch",
          ["normalizedWord"],
          `Expected “${normalizedExpectedWord}”, but the entry represents “${entry.normalizedWord}”.`
        )
      );
    }

    if (normalizedEntryWord !== entry.normalizedWord) {
      issues.push(
        semanticIssue(
          "word_normalization_mismatch",
          ["word"],
          `The word normalizes to “${normalizedEntryWord}”, not “${entry.normalizedWord}”.`
        )
      );
    }

    if (normalizeText(entry.morphology.baseForm) !== entry.normalizedWord) {
      issues.push(
        semanticIssue(
          "base_form_mismatch",
          ["morphology", "baseForm"],
          `The morphology base form must represent “${entry.normalizedWord}”.`
        )
      );
    }

    if (context === "external-ai-import") {
      if (entry.source.kind !== "user") {
        issues.push(
          semanticIssue(
            "external_import_source_kind",
            ["source", "kind"],
            'Generated JSON pasted by the user must use source.kind "user".'
          )
        );
      }

      if (entry.generation.method !== "external-ai") {
        issues.push(
          semanticIssue(
            "external_import_generation_method",
            ["generation", "method"],
            'Generated JSON pasted from an external AI must use generation.method "external-ai".'
          )
        );
      }

      if (entry.generation.validationStatus !== "unvalidated") {
        issues.push(
          semanticIssue(
            "premature_validation_status",
            ["generation", "validationStatus"],
            'Imported AI content must arrive as "unvalidated"; English Focus assigns later statuses.'
          )
        );
      }
    }

    const createdAt = Date.parse(entry.createdAt);
    const updatedAt = Date.parse(entry.updatedAt);
    const generatedAt = Date.parse(entry.generation.generatedAt);

    if (createdAt > updatedAt) {
      issues.push(
        semanticIssue(
          "timestamp_order",
          ["updatedAt"],
          "updatedAt must not be earlier than createdAt."
        )
      );
    }

    if (generatedAt > updatedAt) {
      issues.push(
        semanticIssue(
          "generation_timestamp_order",
          ["generation", "generatedAt"],
          "generatedAt must not be later than updatedAt."
        )
      );
    }

    pushDuplicateIssues(entry.aliases, ["aliases"], "duplicate_alias", "Alias", issues);

    entry.aliases.forEach((alias, index) => {
      if (normalizeText(alias) === entry.normalizedWord) {
        issues.push(
          semanticIssue(
            "alias_matches_base_word",
            ["aliases", index],
            "An alias must not duplicate the base normalized word."
          )
        );
      }
    });

    pushDuplicateIssues(
      entry.meanings.map((meaning) => meaning.id),
      ["meanings"],
      "duplicate_meaning_id",
      "Meaning identifier",
      issues
    );

    entry.meanings.forEach((meaning, index) => {
      if (!hasPairedValues(meaning.usageNoteEn, meaning.usageNoteTr)) {
        issues.push(
          semanticIssue(
            "unpaired_meaning_usage_note",
            ["meanings", index],
            "English and Turkish meaning usage notes must be provided together."
          )
        );
      }
    });

    const inflectedPairs = entry.morphology.inflectedForms.map(
      (form) => `${form.type}:${normalizeText(form.normalizedForm)}`
    );
    pushDuplicateIssues(
      inflectedPairs,
      ["morphology", "inflectedForms"],
      "duplicate_inflected_form",
      "Inflected form and type pair",
      issues
    );

    entry.morphology.inflectedForms.forEach((form, index) => {
      if (normalizeText(form.form) !== form.normalizedForm) {
        issues.push(
          semanticIssue(
            "inflected_form_normalization_mismatch",
            ["morphology", "inflectedForms", index, "normalizedForm"],
            `The form “${form.form}” does not normalize to “${form.normalizedForm}”.`
          )
        );
      }
    });

    pushDuplicateIssues(
      entry.examples.map((example) => example.sentenceEn),
      ["examples"],
      "duplicate_primary_example",
      "Primary English example",
      issues
    );

    entry.examples.forEach((example, index) => {
      if (!textContainsRecognizedForm(example.sentenceEn, recognizedForms)) {
        issues.push(
          semanticIssue(
            "primary_example_missing_target",
            ["examples", index, "sentenceEn"],
            `Every primary example must contain “${entry.normalizedWord}” or a declared form.`
          )
        );
      }
      if (
        example.targetForm !== undefined &&
        !textContainsRecognizedForm(example.targetForm, recognizedForms)
      ) {
        issues.push(
          semanticIssue(
            "unknown_example_target_form",
            ["examples", index, "targetForm"],
            "targetForm must contain the base word or one of its declared forms."
          )
        );
      }
    });

    return Object.freeze(issues);
  }
}
