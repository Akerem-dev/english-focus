import { getA2GrammarTeachingContent } from "./grammarTeachingContentA2";
import {
  getGrammarTeachingContent as getCoreGrammarTeachingContent,
  type GrammarTeachingContent
} from "./grammarTeachingContent";

export function getGrammarTeachingContent(
  lessonId: string
): GrammarTeachingContent | undefined {
  return getA2GrammarTeachingContent(lessonId) ?? getCoreGrammarTeachingContent(lessonId);
}
