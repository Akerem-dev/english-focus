import type { GrammarTeachingContent } from "./grammarTeachingContent";
import { COMPARATIVES_TEACHING_CONTENT } from "./a2/comparativesTeachingContent";
import { GOING_TO_TEACHING_CONTENT } from "./a2/goingToTeachingContent";
import { PAST_CONTINUOUS_TEACHING_CONTENT } from "./a2/pastContinuousTeachingContent";
import { PAST_SIMPLE_TEACHING_CONTENT } from "./a2/pastSimpleTeachingContent";
import { PRESENT_PERFECT_TEACHING_CONTENT } from "./a2/presentPerfectTeachingContent";
import { USED_TO_TEACHING_CONTENT } from "./a2/usedToTeachingContent";
import { getB1GrammarTeachingContent } from "./grammarTeachingContentB1";

export const A2_GRAMMAR_TEACHING_CONTENT: readonly GrammarTeachingContent[] = Object.freeze([
  PAST_SIMPLE_TEACHING_CONTENT,
  USED_TO_TEACHING_CONTENT,
  PRESENT_PERFECT_TEACHING_CONTENT,
  PAST_CONTINUOUS_TEACHING_CONTENT,
  GOING_TO_TEACHING_CONTENT,
  COMPARATIVES_TEACHING_CONTENT
]);

const A2_CONTENT_BY_ID = new Map(
  A2_GRAMMAR_TEACHING_CONTENT.map((content) => [content.id, content])
);

export function getA2GrammarTeachingContent(lessonId: string): GrammarTeachingContent | undefined {
  return A2_CONTENT_BY_ID.get(lessonId) ?? getB1GrammarTeachingContent(lessonId);
}
