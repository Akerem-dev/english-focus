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
import "../../../styles/word-valley-grammar-v19-stage2-geometry-guard.css";
import "../../../styles/word-valley-grammar-v20-stage3-pedagogy.css";
import "../../../styles/word-valley-grammar-v21-stage4-practice.css";
import "../../../styles/word-valley-grammar-v22-stage5-learning-state.css";

const GRAMMAR_PROGRESS_KEY = "word-valley:grammar:progress-v1";
const LEGACY_DEMO_PROGRESS_IDS = Object.freeze([
  "present-simple",
  "be-am-is-are",
  "present-continuous",
  "past-simple"
]);

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(5, Math.round(value)));
}

function createEmptyGrammarProgress(): Record<string, number> {
  return Object.fromEntries(LEGACY_DEMO_PROGRESS_IDS.map((lessonId) => [lessonId, 0]));
}

function readGrammarProgress(): GrammarProgressMap {
  try {
    const raw = window.localStorage.getItem(GRAMMAR_PROGRESS_KEY);
    if (raw === null) return Object.freeze(createEmptyGrammarProgress());

    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return Object.freeze(createEmptyGrammarProgress());
    }

    // Older Figma-backed catalog data carried non-zero showcase progress. Seed those
    // lessons at zero so only real persisted learning activity can raise mastery.
    const progress: Record<string, number> = createEmptyGrammarProgress();
    for (const [lessonId, value] of Object.entries(parsed)) {
      if (typeof value === "number") progress[lessonId] = clampProgress(value);
    }

    return Object.freeze(progress);
  } catch {
    return Object.freeze(createEmptyGrammarProgress());
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

  function openCurriculum() {
    setLessonFocus(undefined);
    setSelectedLesson(undefined);
  }

  function updateProgress(lessonId: string, value: number) {
    const nextValue = clampProgress(value);

    setProgress((current) => {
      if (current[lessonId] === nextValue) return current;
      const next = Object.freeze({ ...current, [lessonId]: nextValue });
      persistGrammarProgress(next);
      return next;
    });
  }

  function markComplete(lessonId: string) {
    updateProgress(lessonId, 5);
  }

  const selectedProgress =
    selectedLesson === undefined
      ? 0
      : clampProgress(progress[selectedLesson.id] ?? selectedLesson.initialProgress);
  const selectedUsesExpandedCuratedLesson =
    selectedLesson?.level === "A2" || selectedLesson?.level === "B1";
  const selectedHasCuratedContent =
    selectedLesson !== undefined && hasRenderableCuratedContent(selectedLesson.id);

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
        <GrammarCurriculumHome onOpenLesson={openLesson} progress={progress} />
      ) : selectedUsesExpandedCuratedLesson ? (
        <A2CuratedGrammarLesson
          key={`${selectedLesson.id}-${selectedLesson.initialSection ?? "overview"}`}
          lesson={selectedLesson}
          onBack={openCurriculum}
          onMasteryChange={(mastery) => updateProgress(selectedLesson.id, mastery)}
          progress={selectedProgress}
        />
      ) : selectedHasCuratedContent ? (
        <CuratedGrammarLesson
          key={`${selectedLesson.id}-${selectedLesson.initialSection ?? "overview"}`}
          lesson={selectedLesson}
          onBack={openCurriculum}
          onMasteryChange={(mastery) => updateProgress(selectedLesson.id, mastery)}
          progress={selectedProgress}
        />
      ) : (
        <CompiledGrammarLesson
          key={selectedLesson.id}
          lesson={selectedLesson}
          onBack={openCurriculum}
          onMarkComplete={() => markComplete(selectedLesson.id)}
          progress={selectedProgress}
        />
      )}
    </div>
  );
}
