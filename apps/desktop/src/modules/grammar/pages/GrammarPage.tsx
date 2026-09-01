import { useEffect, useState } from "react";

import { useGrammar } from "../../../app/providers";
import grammarBackground from "../../../assets/collections/collections-background.png";
import { A2CuratedGrammarLesson } from "../components/A2CuratedGrammarLesson";
import { CompiledGrammarLesson } from "../components/CompiledGrammarLesson";
import { CuratedGrammarLesson } from "../components/CuratedGrammarLesson";
import {
  GrammarCurriculumHome,
  type GrammarLessonSelection,
  type GrammarProgressMap
} from "../components/GrammarCurriculumHome";
import {
  getGrammarTeachingContent,
  type GrammarTeachingComparisonSide,
  type GrammarTeachingExample,
  type GrammarTeachingMistake,
  type GrammarTeachingUse
} from "../knowledge/grammarTeachingContent";

import "../../../styles/word-valley-grammar-reference-final.css";
import "../../../styles/word-valley-grammar-shell-final.css";
import "../../../styles/word-valley-grammar-responsive.css";
import "../../../styles/word-valley-grammar-v10-responsive.css";
import "../../../styles/word-valley-grammar-v10-state.css";
import "../../../styles/word-valley-grammar-v12.css";
import "../../../styles/word-valley-grammar-v12-layout-guard.css";
import "../../../styles/word-valley-grammar-v13-shell-override.css";
import "../../../styles/word-valley-grammar-v13-large-desktop.css";
import "../../../styles/word-valley-grammar-v15-curated-fixes.css";
import "../../../styles/word-valley-grammar-v17-navigation.css";
import "../../../styles/word-valley-grammar-v18-final-polish.css";
import "../../../styles/word-valley-grammar-v18-stage1-guards.css";
import "../../../styles/word-valley-grammar-v19-stage2-readability.css";

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

function hasRenderableCuratedContent(lessonId: string): boolean {
  const content = getGrammarTeachingContent(lessonId);
  if (content === undefined) return false;

  const firstUse: GrammarTeachingUse | undefined = content.uses[0];
  const firstExample: GrammarTeachingExample | undefined = content.examples[0];
  const comparisonSide: GrammarTeachingComparisonSide = content.comparison.left;
  const firstMistake: GrammarTeachingMistake | undefined = content.mistakes[0];

  return (
    content.formulaParts.length > 0 &&
    firstUse !== undefined &&
    firstExample !== undefined &&
    comparisonSide.label.trim().length > 0 &&
    firstMistake !== undefined &&
    content.practiceChecks.length > 0 &&
    content.quickRules.length > 0
  );
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
    setLessonFocus({
      id: lesson.id,
      title: lesson.title,
      category: lesson.category,
      ...(lesson.id === "present-perfect" ? { compareWith: "Past Simple" } : {})
    });
    setSelectedLesson(lesson);
  }

  function updateProgress(lessonId: string, nextProgress: number) {
    setProgress((current) => {
      const normalizedProgress = clampProgress(nextProgress);
      const previousProgress = current[lessonId] ?? 0;
      if (normalizedProgress <= previousProgress) return current;

      const updatedProgress = Object.freeze({ ...current, [lessonId]: normalizedProgress });
      persistGrammarProgress(updatedProgress);
      return updatedProgress;
    });
  }

  if (selectedLesson !== undefined) {
    const lessonProgress = progress[selectedLesson.id] ?? selectedLesson.progress;
    const sharedProps = {
      lesson: selectedLesson,
      onBack: () => setSelectedLesson(undefined),
      onMasteryChange: (mastery: number) => updateProgress(selectedLesson.id, mastery),
      progress: lessonProgress
    };

    if (hasRenderableCuratedContent(selectedLesson.id)) {
      return (
        <div
          className="grammar-route-scope"
          style={{ "--grammar-background": `url(${grammarBackground})` } as React.CSSProperties}
        >
          <CuratedGrammarLesson {...sharedProps} />
        </div>
      );
    }

    if (getA2GrammarTeachingContent(selectedLesson.id) !== undefined) {
      return (
        <div
          className="grammar-route-scope"
          style={{ "--grammar-background": `url(${grammarBackground})` } as React.CSSProperties}
        >
          <A2CuratedGrammarLesson {...sharedProps} />
        </div>
      );
    }

    return (
      <div
        className="grammar-route-scope"
        style={{ "--grammar-background": `url(${grammarBackground})` } as React.CSSProperties}
      >
        <CompiledGrammarLesson {...sharedProps} />
      </div>
    );
  }

  return (
    <div
      className="grammar-route-scope"
      style={{ "--grammar-background": `url(${grammarBackground})` } as React.CSSProperties}
    >
      <GrammarCurriculumHome onOpenLesson={openLesson} progress={progress} />
    </div>
  );
}
