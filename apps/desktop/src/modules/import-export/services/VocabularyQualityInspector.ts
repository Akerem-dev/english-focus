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

/**
 * Non-blocking completeness heuristics. Warnings never fabricate content requirements and never
 * reject a structurally and semantically valid entry; they surface areas worth human review.
 */
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

    if (entry.wordFamily.length === 0) {
      issues.push(
        qualityIssue(
          "missing_word_family",
          ["wordFamily"],
          "No word-family items are included. Confirm whether useful derived forms exist."
        )
      );
    }

    if (entry.grammar.patterns.length === 0) {
      issues.push(
        qualityIssue(
          "missing_grammar_patterns",
          ["grammar", "patterns"],
          "No grammar patterns are included. This is acceptable only when the word has no useful pattern to teach."
        )
      );
    }

    if (entry.grammar.tenseExamples.length === 0 && entry.partsOfSpeech.includes("verb")) {
      issues.push(
        qualityIssue(
          "missing_tense_examples",
          ["grammar", "tenseExamples"],
          "This verb has no tense examples. Add only forms that are naturally useful."
        )
      );
    }

    if (entry.grammar.sentenceForms.length === 0) {
      issues.push(
        qualityIssue(
          "missing_sentence_forms",
          ["grammar", "sentenceForms"],
          "No sentence-form examples are included. Confirm whether affirmative, negative, question, or passive forms would add value."
        )
      );
    }

    if (entry.collocations.length < 3) {
      issues.push(
        qualityIssue(
          "limited_collocations",
          ["collocations"],
          `Only ${entry.collocations.length} collocation${entry.collocations.length === 1 ? " is" : "s are"} included. Review whether more common combinations exist.`
        )
      );
    }

    if (entry.relatedWords.length < 3) {
      issues.push(
        qualityIssue(
          "limited_related_words",
          ["relatedWords"],
          `Only ${entry.relatedWords.length} related word${entry.relatedWords.length === 1 ? " is" : "s are"} included. Confirm whether useful contrasts are missing.`
        )
      );
    }

    if (entry.commonMistakes.length === 0) {
      issues.push(
        qualityIssue(
          "missing_common_mistakes",
          ["commonMistakes"],
          "No common learner mistakes are included. An empty list is valid when no reliable mistake is known."
        )
      );
    }

    const missingGrammarLabels = entry.examples.filter(
      (example) => example.grammarLabel === undefined
    ).length;
    if (missingGrammarLabels >= 5) {
      issues.push(
        qualityIssue(
          "examples_lack_grammar_labels",
          ["examples"],
          `${missingGrammarLabels} of 10 primary examples have no grammar label, which limits guided review.`
        )
      );
    }

    const missingTargetForms = entry.examples.filter(
      (example) => example.targetForm === undefined
    ).length;
    if (missingTargetForms >= 5) {
      issues.push(
        qualityIssue(
          "examples_lack_target_forms",
          ["examples"],
          `${missingTargetForms} of 10 primary examples do not identify the demonstrated target form.`
        )
      );
    }

    const missingContexts = entry.examples.filter(
      (example) => example.context === undefined
    ).length;
    if (missingContexts >= 7) {
      issues.push(
        qualityIssue(
          "examples_lack_context",
          ["examples"],
          `${missingContexts} of 10 primary examples have no concise context label.`
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

    const collocationsWithoutExamples = entry.collocations.filter(
      (collocation) => collocation.exampleEn === undefined
    ).length;
    if (
      entry.collocations.length > 0 &&
      collocationsWithoutExamples >= Math.ceil(entry.collocations.length / 2)
    ) {
      issues.push(
        qualityIssue(
          "collocations_lack_examples",
          ["collocations"],
          `${collocationsWithoutExamples} collocations have no bilingual usage example.`
        )
      );
    }

    const relatedWordsWithoutDistinctions = entry.relatedWords.filter(
      (relatedWord) => relatedWord.distinctionEn === undefined
    ).length;
    if (
      entry.relatedWords.length > 0 &&
      relatedWordsWithoutDistinctions >= Math.ceil(entry.relatedWords.length / 2)
    ) {
      issues.push(
        qualityIssue(
          "related_words_lack_distinctions",
          ["relatedWords"],
          `${relatedWordsWithoutDistinctions} related words have no bilingual distinction note.`
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
