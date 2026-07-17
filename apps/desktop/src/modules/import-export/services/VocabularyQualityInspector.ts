import type { ImportIssue, VocabularyEntry } from "@platform/domain";

function qualityIssue(
  code: string,
  path: readonly (string | number)[],
  message: string
): ImportIssue {
  const pathText = path.reduce<string>((formatted, segment) => {
    if (typeof segment === "number") {
      return `${formatted}[${segment}]`;
    }
    return formatted.length === 0 ? segment : `${formatted}.${segment}`;
  }, "");

  return Object.freeze({
    source: "quality",
    severity: "warning",
    code,
    path: Object.freeze([...path]),
    pathText: pathText.length === 0 ? "entry" : pathText,
    message
  });
}

/** Non-blocking completeness heuristics for the simplified vocabulary model. */
export class VocabularyQualityInspector {
  inspect(entry: VocabularyEntry): readonly ImportIssue[] {
    const issues: ImportIssue[] = [];

    if (entry.meanings.length === 1) {
      issues.push(
        qualityIssue(
          "single_meaning_only",
          ["meanings"],
          "Only one meaning is documented. Confirm that no common sense of the word is missing."
        )
      );
    }

    if (entry.etymology === undefined) {
      issues.push(
        qualityIssue(
          "missing_etymology",
          ["etymology"],
          "No reliable etymology is included. Leaving this absent is preferable to inventing one."
        )
      );
    }

    if (entry.pronunciations.length === 1 && entry.pronunciations[0]?.variant === "general") {
      issues.push(
        qualityIssue(
          "general_pronunciation_only",
          ["pronunciations"],
          "Only a general pronunciation is supplied. Confirm whether a reliable regional variant is useful."
        )
      );
    }

    if (entry.morphology.inflectedForms.length === 0) {
      issues.push(
        qualityIssue(
          "missing_word_forms",
          ["morphology", "inflectedForms"],
          "No inflected word forms are included. Confirm that the headword has no useful forms to list."
        )
      );
    }

    if (entry.grammar.summaryEn.length < 24 || entry.grammar.summaryTr.length < 24) {
      issues.push(
        qualityIssue(
          "brief_usage_overview",
          ["grammar"],
          "The bilingual usage overview is very brief. Confirm that it still explains the main construction clearly."
        )
      );
    }

    const missingGrammarLabels = entry.examples.filter(
      (example) => example.grammarLabel === undefined
    ).length;
    if (missingGrammarLabels >= 2) {
      issues.push(
        qualityIssue(
          "examples_lack_grammar_labels",
          ["examples"],
          `${missingGrammarLabels} of ${entry.examples.length} primary examples have no grammar label, which limits guided review.`
        )
      );
    }

    const missingTargetForms = entry.examples.filter(
      (example) => example.targetForm === undefined
    ).length;
    if (missingTargetForms >= 2) {
      issues.push(
        qualityIssue(
          "examples_lack_target_forms",
          ["examples"],
          `${missingTargetForms} of ${entry.examples.length} primary examples do not identify the demonstrated target form.`
        )
      );
    }

    const missingContexts = entry.examples.filter(
      (example) => example.context === undefined
    ).length;
    if (missingContexts >= 2) {
      issues.push(
        qualityIssue(
          "examples_lack_context",
          ["examples"],
          `${missingContexts} of ${entry.examples.length} primary examples have no concise context label.`
        )
      );
    }

    const exampleRegisters = new Set(entry.examples.flatMap((example) => example.registers));
    if (exampleRegisters.size <= 1 && entry.registers.length > 1) {
      issues.push(
        qualityIssue(
          "limited_example_register_variety",
          ["examples"],
          "Primary examples use one register even though the entry declares multiple registers."
        )
      );
    }

    entry.generation.warnings.forEach((warning, index) => {
      issues.push(
        qualityIssue(
          "generator_warning",
          ["generation", "warnings", index],
          `Generator warning: ${warning}`
        )
      );
    });

    return Object.freeze(issues);
  }
}
