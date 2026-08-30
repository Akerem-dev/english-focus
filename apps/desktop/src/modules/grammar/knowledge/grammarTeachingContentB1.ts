import type { GrammarTeachingContent } from "./grammarTeachingContent";
import { FUTURE_CONTINUOUS_TEACHING_CONTENT } from "./b1/futureContinuousTeachingContent";
import { MODAL_PERFECTS_TEACHING_CONTENT } from "./b1/modalPerfectsTeachingContent";
import { PASSIVE_VOICE_TEACHING_CONTENT } from "./b1/passiveVoiceTeachingContent";
import { PRESENT_PERFECT_CONTINUOUS_TEACHING_CONTENT } from "./b1/presentPerfectContinuousTeachingContent";
import { RELATIVE_CLAUSES_TEACHING_CONTENT } from "./b1/relativeClausesTeachingContent";
import { REPORTED_SPEECH_TEACHING_CONTENT } from "./b1/reportedSpeechTeachingContent";

export const B1_GRAMMAR_TEACHING_CONTENT: readonly GrammarTeachingContent[] = Object.freeze([
  FUTURE_CONTINUOUS_TEACHING_CONTENT,
  PRESENT_PERFECT_CONTINUOUS_TEACHING_CONTENT,
  MODAL_PERFECTS_TEACHING_CONTENT,
  RELATIVE_CLAUSES_TEACHING_CONTENT,
  PASSIVE_VOICE_TEACHING_CONTENT,
  REPORTED_SPEECH_TEACHING_CONTENT
]);

const B1_CONTENT_BY_ID = new Map(
  B1_GRAMMAR_TEACHING_CONTENT.map((content) => [content.id, content])
);

export function getB1GrammarTeachingContent(lessonId: string): GrammarTeachingContent | undefined {
  return B1_CONTENT_BY_ID.get(lessonId);
}
