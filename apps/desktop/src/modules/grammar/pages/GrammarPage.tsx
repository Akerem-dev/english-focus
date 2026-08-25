import { useEffect, useState } from "react";

import { useGrammar } from "../../../app/providers";
import grammarBackground from "../../../assets/collections/collections-background.png";
import { CompiledGrammarLesson } from "../components/CompiledGrammarLesson";
import { GrammarCurriculumHome } from "../components/GrammarCurriculumHome";
import { PresentPerfectReferenceLesson } from "../components/PresentPerfectReferenceLesson";
import {
  GRAMMAR_KNOWLEDGE_LESSONS,
  type GrammarKnowledgeLesson
} from "../knowledge/grammarKnowledgeIndex";

import "../../../styles/word-valley-grammar-reference-final.css";
import "../../../styles/word-valley-grammar-shell-final.css";
import "../../../styles/word-valley-grammar-responsive.css";
import "../../../styles/word-valley-grammar-v10-responsive.css";
import "../../../styles/word-valley-grammar-v10-state.css";
import "../../../styles/word-valley-grammar-v12.css";

const LAST_GRAMMAR_LESSON_KEY = "word-valley:grammar:last-lesson";

function readLastGrammarLesson(): GrammarKnowledgeLesson | undefined {
  try {
    const lessonId = window.localStorage.getItem(LAST_GRAMMAR_LESSON_KEY);
    if (lessonId === null) return undefined;
    return GRAMMAR_KNOWLEDGE_LESSONS.find((lesson) => lesson.id === lessonId);
  } catch {
    return undefined;
  }
}

function rememberGrammarLesson(lesson: GrammarKnowledgeLesson): void {
  try {
    window.localStorage.setItem(LAST_GRAMMAR_LESSON_KEY, lesson.id);
  } catch {
    // Storage can be unavailable in hardened/browser test contexts. The in-memory state still works.
  }
}

export function GrammarPage() {
  const { setLessonFocus } = useGrammar();
  const [lastLesson, setLastLesson] = useState<GrammarKnowledgeLesson | undefined>(() =>
    readLastGrammarLesson()
  );
  const [selectedLesson, setSelectedLesson] = useState<GrammarKnowledgeLesson | undefined>(() =>
    readLastGrammarLesson()
  );

  useEffect(() => {
    if (selectedLesson === undefined) {
      setLessonFocus(undefined);
      return () => setLessonFocus(undefined);
    }

    if (selectedLesson.id === "present-perfect") {
      setLessonFocus({
        id: selectedLesson.id,
        title: selectedLesson.title,
        category: selectedLesson.category,
        compareWith: "Past Simple"
      });
    } else {
      setLessonFocus({
        id: selectedLesson.id,
        title: selectedLesson.title,
        category: selectedLesson.category
      });
    }

    return () => setLessonFocus(undefined);
  }, [selectedLesson, setLessonFocus]);

  function openLesson(lesson: GrammarKnowledgeLesson) {
    rememberGrammarLesson(lesson);
    setLastLesson(lesson);
    setSelectedLesson(lesson);
  }

  function openCurriculum() {
    setSelectedLesson(undefined);
  }

  return (
    <div
      className="wvg-page"
      data-grammar-view={selectedLesson === undefined ? "curriculum" : "lesson"}
    >
      <div
        aria-hidden="true"
        className="wvg-scene"
        style={{ backgroundImage: `url("${grammarBackground}")` }}
      />
      <div aria-hidden="true" className="wvg-scene-veil" />

      {selectedLesson === undefined ? (
        <GrammarCurriculumHome lastLesson={lastLesson} onOpenLesson={openLesson} />
      ) : selectedLesson.id === "present-perfect" ? (
        <PresentPerfectReferenceLesson onBrowseLessons={openCurriculum} />
      ) : (
        <CompiledGrammarLesson lesson={selectedLesson} onBack={openCurriculum} />
      )}
    </div>
  );
}
