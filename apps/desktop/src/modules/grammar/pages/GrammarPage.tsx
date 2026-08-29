import { useEffect, useState } from "react";

import { useGrammar } from "../../../app/providers";
import grammarBackground from "../../../assets/collections/collections-background.png";
import { CompiledGrammarLesson } from "../components/CompiledGrammarLesson";
import {
  GrammarCurriculumHome,
  type GrammarLessonSelection,
  type GrammarProgressMap
} from "../components/GrammarCurriculumHome";

import "../../../styles/word-valley-grammar-reference-final.css";
import "../../../styles/word-valley-grammar-shell-final.css";
import "../../../styles/word-valley-grammar-responsive.css";
import "../../../styles/word-valley-grammar-v10-responsive.css";
import "../../../styles/word-valley-grammar-v10-state.css";
import "../../../styles/word-valley-grammar-v12.css";
import "../../../styles/word-valley-grammar-v12-layout-guard.css";
import "../../../styles/word-valley-grammar-v13-shell-override.css";
import "../../../styles/word-valley-grammar-v13-large-desktop.css";

const GRAMMAR_PROGRESS_KEY = "word-valley:grammar:progress-v1";

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(5, Math.round(value)));
}

function readGrammarProgress(): GrammarProgressMap {
  try {
    const raw = window.localStorage.getItem(GRAMMAR_PROGRESS_KEY);
    if (raw === null) return Object.freeze({});

    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return Object.freeze({});
    }

    const progress: Record<string, number> = {};
    for (const [lessonId, value] of Object.entries(parsed)) {
      if (typeof value === "number") progress[lessonId] = clampProgress(value);
    }

    return Object.freeze(progress);
  } catch {
    return Object.freeze({});
  }
}

function persistGrammarProgress(progress: GrammarProgressMap): void {
  try {
    window.localStorage.setItem(GRAMMAR_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Hardened/browser test contexts can disable storage. In-memory state still works.
  }
}

export function GrammarPage() {
  const { setLessonFocus } = useGrammar();
  const [selectedLesson, setSelectedLesson] = useState<GrammarLessonSelection | undefined>();
  const [progress, setProgress] = useState<GrammarProgressMap>(() => readGrammarProgress());

  useEffect(() => {
    if (selectedLesson === undefined) {
      setLessonFocus(undefined);
      return () => setLessonFocus(undefined);
    }

    setLessonFocus({
      id: selectedLesson.id,
      title: selectedLesson.title,
      category: selectedLesson.category,
      ...(selectedLesson.id === "present-perfect" ? { compareWith: "Past Simple" } : {})
    });

    return () => setLessonFocus(undefined);
  }, [selectedLesson, setLessonFocus]);

  function openLesson(lesson: GrammarLessonSelection) {
    setSelectedLesson(lesson);
  }

  function openCurriculum() {
    setSelectedLesson(undefined);
  }

  function markComplete(lessonId: string) {
    setProgress((current) => {
      if (current[lessonId] === 5) return current;
      const next = Object.freeze({ ...current, [lessonId]: 5 });
      persistGrammarProgress(next);
      return next;
    });
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
        <GrammarCurriculumHome
          onMarkComplete={markComplete}
          onOpenLesson={openLesson}
          progress={progress}
        />
      ) : (
        <CompiledGrammarLesson
          key={selectedLesson.id}
          lesson={selectedLesson}
          onBack={openCurriculum}
          onMarkComplete={() => markComplete(selectedLesson.id)}
          progress={progress[selectedLesson.id] ?? selectedLesson.initialProgress}
        />
      )}
    </div>
  );
}
