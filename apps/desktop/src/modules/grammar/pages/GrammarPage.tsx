import { useEffect, useMemo, useState } from "react";

import { useGrammar } from "../../../app/providers";
import grammarBackground from "../../../assets/collections/collections-background.png";
import { AppIcon } from "../../../design-system";
import { CompiledGrammarLesson } from "../components/CompiledGrammarLesson";
import { PresentPerfectReferenceLesson } from "../components/PresentPerfectReferenceLesson";
import {
  GRAMMAR_KNOWLEDGE_LESSONS,
  type GrammarKnowledgeLesson
} from "../knowledge/grammarKnowledgeIndex";

import "../../../styles/word-valley-grammar-reference-final.css";
import "../../../styles/word-valley-grammar-shell-final.css";
import "../../../styles/word-valley-grammar-responsive.css";

function normalizeSearch(value: string): readonly string[] {
  return value.trim().toLocaleLowerCase("en").split(/\s+/).filter(Boolean);
}

function lessonSearchText(lesson: GrammarKnowledgeLesson): string {
  return [
    lesson.title,
    lesson.category,
    lesson.level,
    lesson.description,
    ...lesson.keywords,
    ...lesson.coreTopics,
    ...lesson.subtopics.map((subtopic) => subtopic.title)
  ]
    .join(" ")
    .toLocaleLowerCase("en");
}

export function GrammarPage() {
  const { setLessonFocus } = useGrammar();
  const [selectedLesson, setSelectedLesson] = useState<GrammarKnowledgeLesson | undefined>();
  const [lessonPickerOpen, setLessonPickerOpen] = useState(false);
  const [lessonQuery, setLessonQuery] = useState("");

  const visibleLessons = useMemo(() => {
    const tokens = normalizeSearch(lessonQuery);
    if (tokens.length === 0) return GRAMMAR_KNOWLEDGE_LESSONS;

    return GRAMMAR_KNOWLEDGE_LESSONS.filter((lesson) => {
      const haystack = lessonSearchText(lesson);
      return tokens.every((token) => haystack.includes(token));
    });
  }, [lessonQuery]);

  useEffect(() => {
    if (selectedLesson === undefined) {
      setLessonFocus({
        id: "present-perfect",
        title: "Present Perfect",
        category: "Tenses & Time",
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

  useEffect(() => {
    if (!lessonPickerOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLessonPickerOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lessonPickerOpen]);

  function openLessonPicker() {
    setLessonQuery("");
    setLessonPickerOpen(true);
  }

  function chooseLesson(lesson: GrammarKnowledgeLesson) {
    setSelectedLesson(lesson.id === "present-perfect" ? undefined : lesson);
    setLessonPickerOpen(false);
    setLessonQuery("");
  }

  return (
    <div className="wvg-page">
      <div
        aria-hidden="true"
        className="wvg-scene"
        style={{ backgroundImage: `url("${grammarBackground}")` }}
      />
      <div aria-hidden="true" className="wvg-scene-veil" />

      {selectedLesson === undefined ? (
        <PresentPerfectReferenceLesson onBrowseLessons={openLessonPicker} />
      ) : (
        <CompiledGrammarLesson lesson={selectedLesson} onBack={openLessonPicker} />
      )}

      {lessonPickerOpen ? (
        <div
          aria-label="Choose a grammar lesson"
          aria-modal="true"
          className="wvg-lesson-picker"
          role="dialog"
        >
          <button
            aria-label="Close grammar lesson picker"
            className="wvg-lesson-picker__backdrop"
            onClick={() => setLessonPickerOpen(false)}
            type="button"
          />
          <section className="wvg-lesson-picker__panel">
            <header className="wvg-lesson-picker__header">
              <div>
                <p>GRAMMAR LIBRARY</p>
                <h2>Choose a lesson</h2>
                <span>Switch topics without leaving the final lesson layout.</span>
              </div>
              <button
                aria-label="Close"
                className="wvg-lesson-picker__close"
                onClick={() => setLessonPickerOpen(false)}
                type="button"
              >
                <AppIcon name="close" size={18} />
              </button>
            </header>

            <label className="wvg-lesson-picker__search">
              <AppIcon name="search" size={17} />
              <input
                autoFocus
                onChange={(event) => setLessonQuery(event.currentTarget.value)}
                placeholder="Search grammar lessons…"
                type="search"
                value={lessonQuery}
              />
            </label>

            <div className="wvg-lesson-picker__list">
              {visibleLessons.map((lesson) => (
                <button key={lesson.id} onClick={() => chooseLesson(lesson)} type="button">
                  <span>
                    <strong>{lesson.title}</strong>
                    <small>{lesson.description}</small>
                  </span>
                  <b>
                    {lesson.level} · {lesson.category}
                  </b>
                  <AppIcon name="chevron-right" size={17} />
                </button>
              ))}

              {visibleLessons.length === 0 ? (
                <div className="wvg-lesson-picker__empty">
                  <strong>No matching lesson</strong>
                  <span>Try a broader term such as tense, article, modal, or conditional.</span>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
