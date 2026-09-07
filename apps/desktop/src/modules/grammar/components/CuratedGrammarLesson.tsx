import { A2CuratedGrammarLesson } from "./A2CuratedGrammarLesson";
import type { GrammarLessonSelection } from "./GrammarCurriculumHome";
import { getGrammarTeachingContent } from "../knowledge/grammarTeachingContent";

interface CuratedGrammarLessonProps {
  readonly completed: boolean;
  readonly lesson: GrammarLessonSelection;
  readonly onBack: () => void;
  readonly onCompletionChange: (completed: boolean) => void;
  readonly onMasteryChange: (mastery: number) => void;
  readonly progress: number;
}

export function CuratedGrammarLesson({
  completed,
  lesson,
  onBack,
  onCompletionChange,
  onMasteryChange,
  progress
}: CuratedGrammarLessonProps) {
  const teachingContent = getGrammarTeachingContent(lesson.id);
  if (teachingContent === undefined) return null;

  return (
    <A2CuratedGrammarLesson
      completed={completed}
      lesson={lesson}
      onBack={onBack}
      onCompletionChange={onCompletionChange}
      onMasteryChange={onMasteryChange}
      progress={progress}
      teachingContent={teachingContent}
    />
  );
}
