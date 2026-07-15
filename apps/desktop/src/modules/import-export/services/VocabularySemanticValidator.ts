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
  const forms = new Set<string>([
    normalizeText(entry.word),
    normalizeText(entry.normalizedWord),
    ...entry.aliases.map(normalizeText),
    ...entry.morphology.inflectedForms.map((form) => normalizeText(form.normalizedForm))
  ]);

  return forms;
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

/**
 * Cross-field and target-specific checks that cannot be expressed by the structural Zod schema.
 * This validator never evaluates whether a language claim is factually true; it checks internal
 * consistency, import provenance, target alignment, and bilingual pairing.
 */
export class VocabularySemanticValidator {
  validate(entry: VocabularyEntry, expectedWord: string): readonly ImportIssue[] {
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
      entry.wordFamily.map((item) => item.normalizedWord),
      ["wordFamily"],
      "duplicate_word_family_item",
      "Word-family item",
      issues
    );

    entry.wordFamily.forEach((item, index) => {
      if (normalizeText(item.word) !== item.normalizedWord) {
        issues.push(
          semanticIssue(
            "word_family_normalization_mismatch",
            ["wordFamily", index, "normalizedWord"],
            `The word-family item “${item.word}” does not normalize to “${item.normalizedWord}”.`
          )
        );
      }
      if (item.normalizedWord === entry.normalizedWord) {
        issues.push(
          semanticIssue(
            "word_family_self_reference",
            ["wordFamily", index],
            "The base word must not be listed as its own word-family item."
          )
        );
      }
    });

    pushDuplicateIssues(
      entry.relatedWords.map((item) => item.normalizedWord),
      ["relatedWords"],
      "duplicate_related_word",
      "Related word",
      issues
    );

    entry.relatedWords.forEach((item, index) => {
      if (normalizeText(item.word) !== item.normalizedWord) {
        issues.push(
          semanticIssue(
            "related_word_normalization_mismatch",
            ["relatedWords", index, "normalizedWord"],
            `The related word “${item.word}” does not normalize to “${item.normalizedWord}”.`
          )
        );
      }
      if (item.normalizedWord === entry.normalizedWord) {
        issues.push(
          semanticIssue(
            "related_word_self_reference",
            ["relatedWords", index],
            "The base word must not be listed as a related word."
          )
        );
      }
      if (!hasPairedValues(item.distinctionEn, item.distinctionTr)) {
        issues.push(
          semanticIssue(
            "unpaired_related_word_distinction",
            ["relatedWords", index],
            "English and Turkish related-word distinctions must be provided together."
          )
        );
      }
    });

    entry.grammar.tenseExamples.forEach((example, index) => {
      if (!hasPairedValues(example.usageNoteEn, example.usageNoteTr)) {
        issues.push(
          semanticIssue(
            "unpaired_tense_usage_note",
            ["grammar", "tenseExamples", index],
            "English and Turkish tense usage notes must be provided together."
          )
        );
      }
      if (!textContainsRecognizedForm(example.sentenceEn, recognizedForms)) {
        issues.push(
          semanticIssue(
            "tense_example_missing_target",
            ["grammar", "tenseExamples", index, "sentenceEn"],
            `The tense example must contain “${entry.normalizedWord}” or a declared form.`
          )
        );
      }
    });

    entry.grammar.patterns.forEach((pattern, patternIndex) => {
      pattern.examples.forEach((example, exampleIndex) => {
        if (!textContainsRecognizedForm(example.sentenceEn, recognizedForms)) {
          issues.push(
            semanticIssue(
              "grammar_example_missing_target",
              ["grammar", "patterns", patternIndex, "examples", exampleIndex, "sentenceEn"],
              `The grammar example must contain “${entry.normalizedWord}” or a declared form.`
            )
          );
        }
      });
    });

    entry.grammar.sentenceForms.forEach((example, index) => {
      if (!textContainsRecognizedForm(example.sentenceEn, recognizedForms)) {
        issues.push(
          semanticIssue(
            "sentence_form_missing_target",
            ["grammar", "sentenceForms", index, "sentenceEn"],
            `The sentence-form example must contain “${entry.normalizedWord}” or a declared form.`
          )
        );
      }
    });

    entry.grammar.prepositionPatterns.forEach((pattern, patternIndex) => {
      if (!normalizeText(pattern.pattern).includes(normalizeText(pattern.preposition))) {
        issues.push(
          semanticIssue(
            "preposition_not_in_pattern",
            ["grammar", "prepositionPatterns", patternIndex, "pattern"],
            `The pattern must visibly include the declared preposition “${pattern.preposition}”.`
          )
        );
      }
      pattern.examples.forEach((example, exampleIndex) => {
        if (!textContainsRecognizedForm(example.sentenceEn, recognizedForms)) {
          issues.push(
            semanticIssue(
              "preposition_example_missing_target",
              [
                "grammar",
                "prepositionPatterns",
                patternIndex,
                "examples",
                exampleIndex,
                "sentenceEn"
              ],
              `The preposition example must contain “${entry.normalizedWord}” or a declared form.`
            )
          );
        }
      });
    });

    entry.collocations.forEach((collocation, index) => {
      if (!textContainsRecognizedForm(collocation.phrase, recognizedForms)) {
        issues.push(
          semanticIssue(
            "collocation_missing_target",
            ["collocations", index, "phrase"],
            `The collocation must contain “${entry.normalizedWord}” or a declared form.`
          )
        );
      }
      if (!hasPairedValues(collocation.explanationEn, collocation.explanationTr)) {
        issues.push(
          semanticIssue(
            "unpaired_collocation_explanation",
            ["collocations", index],
            "English and Turkish collocation explanations must be provided together."
          )
        );
      }
      if (!hasPairedValues(collocation.exampleEn, collocation.exampleTr)) {
        issues.push(
          semanticIssue(
            "unpaired_collocation_example",
            ["collocations", index],
            "English and Turkish collocation examples must be provided together."
          )
        );
      }
      if (
        collocation.exampleEn !== undefined &&
        !textContainsRecognizedForm(collocation.exampleEn, recognizedForms)
      ) {
        issues.push(
          semanticIssue(
            "collocation_example_missing_target",
            ["collocations", index, "exampleEn"],
            `The collocation example must contain “${entry.normalizedWord}” or a declared form.`
          )
        );
      }
    });

    entry.phrasalVerbs.forEach((item, itemIndex) => {
      if (!textContainsRecognizedForm(item.phrase, recognizedForms)) {
        issues.push(
          semanticIssue(
            "phrasal_verb_missing_target",
            ["phrasalVerbs", itemIndex, "phrase"],
            `The phrasal verb phrase must contain “${entry.normalizedWord}” or a declared form.`
          )
        );
      }
      item.examples.forEach((example, exampleIndex) => {
        if (!textContainsRecognizedForm(example.sentenceEn, recognizedForms)) {
          issues.push(
            semanticIssue(
              "phrasal_verb_example_missing_target",
              ["phrasalVerbs", itemIndex, "examples", exampleIndex, "sentenceEn"],
              `The phrasal-verb example must contain “${entry.normalizedWord}” or a declared form.`
            )
          );
        }
      });
    });

    entry.idioms.forEach((item, itemIndex) => {
      if (!textContainsRecognizedForm(item.phrase, recognizedForms)) {
        issues.push(
          semanticIssue(
            "idiom_missing_target",
            ["idioms", itemIndex, "phrase"],
            `The idiom phrase must contain “${entry.normalizedWord}” or a declared form.`
          )
        );
      }
      item.examples.forEach((example, exampleIndex) => {
        if (!textContainsRecognizedForm(example.sentenceEn, recognizedForms)) {
          issues.push(
            semanticIssue(
              "idiom_example_missing_target",
              ["idioms", itemIndex, "examples", exampleIndex, "sentenceEn"],
              `The idiom example must contain “${entry.normalizedWord}” or a declared form.`
            )
          );
        }
      });
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

    entry.commonMistakes.forEach((mistake, index) => {
      if (normalizeText(mistake.incorrect) === normalizeText(mistake.correct)) {
        issues.push(
          semanticIssue(
            "identical_mistake_forms",
            ["commonMistakes", index],
            "A common mistake must show a meaningful difference between incorrect and correct text."
          )
        );
      }
    });

    return Object.freeze(issues);
  }
}
