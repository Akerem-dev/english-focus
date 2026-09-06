import {
  getGrammarTeachingContent,
  type GrammarTeachingContent
} from "../grammar/knowledge/grammarTeachingContent";
import { getA2GrammarTeachingContent } from "../grammar/knowledge/grammarTeachingContentA2";

export interface GrammarAssistantLocalAnswer {
  readonly answerText: string;
  readonly message: string;
}

function teachingContentForLesson(lessonId: string): GrammarTeachingContent | undefined {
  return getGrammarTeachingContent(lessonId) ?? getA2GrammarTeachingContent(lessonId);
}

function examplesAnswer(content: GrammarTeachingContent): string {
  const examples = content.examples.slice(0, 3).map((example, index) => {
    const translation =
      example.translationTr === undefined ? "" : `\nTR: ${example.translationTr}`;
    return `${index + 1}. ${example.sentence}${translation}\nWhy: ${example.note}`;
  });

  return ["Here are three lesson-grounded examples:", ...examples, `Memory hook: ${content.memoryHook}`].join(
    "\n\n"
  );
}

function comparisonAnswer(content: GrammarTeachingContent): string {
  const { comparison } = content;
  return [
    comparison.title,
    `${comparison.left.label}: ${comparison.left.rule}`,
    `Example: ${comparison.left.example}`,
    `${comparison.right.label}: ${comparison.right.rule}`,
    `Example: ${comparison.right.example}`,
    `Decision rule: ${comparison.takeaway}`
  ].join("\n\n");
}

function mistakeAnswer(content: GrammarTeachingContent): string {
  const mistake = content.mistakes[0];
  if (mistake === undefined) return content.formulaExplanation;

  return [
    `WRONG: ${mistake.wrong}`,
    `CORRECT: ${mistake.right}`,
    `WHY: ${mistake.why}`,
    `Remember: ${content.memoryHook}`
  ].join("\n\n");
}

function quizAnswer(content: GrammarTeachingContent): string {
  const check = content.practiceChecks[0];
  if (check === undefined) return `Quick rule: ${content.quickRules[0] ?? content.memoryHook}`;

  return [
    "Quick quiz — answer before checking the lesson:",
    check.prompt,
    "Type your answer in the box and I can help you reason through it.",
    `Hint: ${content.memoryHook}`
  ].join("\n\n");
}

function templateAnswer(content: GrammarTeachingContent): string {
  const uses = content.uses
    .slice(0, 3)
    .map((use) => `• ${use.title}: ${use.explanation}`)
    .join("\n");
  const examples = content.examples
    .slice(0, 3)
    .map((example) => `• ${example.sentence} — ${example.note}`)
    .join("\n");
  const mistakes = content.mistakes
    .slice(0, 3)
    .map((mistake) => `• ${mistake.wrong} → ${mistake.right} — ${mistake.why}`)
    .join("\n");

  return [
    `1) Meaning first\n${content.intro}`,
    `2) Core formula\n${content.formula}\n${content.formulaExplanation}`,
    `3) When to use\n${uses}`,
    `4) Examples\n${examples}`,
    `5) Compare & contrast\n${content.comparison.left.label}: ${content.comparison.left.rule}\n${content.comparison.right.label}: ${content.comparison.right.rule}\nDecision: ${content.comparison.takeaway}`,
    `6) Common mistakes\n${mistakes}`,
    `7) Clues\n${content.signals.slice(0, 8).join(", ")}\n${content.signalsNote}`,
    `8) Quick rule\n${content.quickRules.map((rule) => `• ${rule}`).join("\n")}\nMemory hook: ${content.memoryHook}`
  ].join("\n\n");
}

function explainAnswer(content: GrammarTeachingContent): string {
  return [
    content.intro,
    `Formula: ${content.formula}`,
    `Why it works: ${content.formulaExplanation}`,
    `Memory hook: ${content.memoryHook}`
  ].join("\n\n");
}

export function buildGrammarAssistantLocalAnswer(
  prompt: string,
  lessonId: string | undefined,
  lessonTitle: string | undefined
): GrammarAssistantLocalAnswer | undefined {
  if (lessonId === undefined || lessonTitle === undefined) return undefined;

  const content = teachingContentForLesson(lessonId);
  if (content === undefined) return undefined;

  const normalized = prompt.toLocaleLowerCase("tr-TR");
  let answerText: string | undefined;

  if (/şablon|template|8 bölüm|lesson note/u.test(normalized)) {
    answerText = templateAnswer(content);
  } else if (/karşılaştır|compare|fark|difference/u.test(normalized)) {
    answerText = comparisonAnswer(content);
  } else if (/örnek|example|cümle|sentence/u.test(normalized)) {
    answerText = examplesAnswer(content);
  } else if (/quiz|test|soru sor/u.test(normalized)) {
    answerText = quizAnswer(content);
  } else if (/yanlış|wrong|hata|mistake|error/u.test(normalized)) {
    answerText = mistakeAnswer(content);
  } else if (/açıkla|explain|kural|rule|formula|mantık/u.test(normalized)) {
    answerText = explainAnswer(content);
  }

  if (answerText === undefined) return undefined;

  return Object.freeze({
    answerText,
    message: `Here’s a lesson-grounded answer for ${lessonTitle}.`
  });
}
