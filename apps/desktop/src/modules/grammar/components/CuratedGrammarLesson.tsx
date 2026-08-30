import { A2CuratedGrammarLesson } from "./A2CuratedGrammarLesson";
import type { GrammarLessonSelection } from "./GrammarCurriculumHome";
import { getGrammarTeachingContent } from "../knowledge/grammarTeachingContent";

interface CuratedGrammarLessonProps {
  readonly lesson: GrammarLessonSelection;
  readonly onBack: () => void;
  readonly onMasteryChange: (mastery: number) => void;
  readonly progress: number;
}

export function CuratedGrammarLesson({
  lesson,
  onBack,
  onMasteryChange,
  progress
}: CuratedGrammarLessonProps) {
  const teachingContent = getGrammarTeachingContent(lesson.id);
  if (teachingContent === undefined) return null;

  return (
    <A2CuratedGrammarLesson
      lesson={lesson}
      onBack={onBack}
      onMasteryChange={onMasteryChange}
      progress={progress}
      teachingContent={teachingContent}
    />
  );
}
