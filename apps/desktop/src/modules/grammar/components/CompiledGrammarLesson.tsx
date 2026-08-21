import { useEffect, useMemo, useState } from "react";

import { useGrammar } from "../../../app/providers";
import { AppIcon } from "../../../design-system";
import type { GrammarKnowledgeLesson } from "../knowledge/grammarKnowledgeIndex";
import { getGrammarLessonArtwork } from "../knowledge/grammarLessonArtwork";

import "../../../styles/word-valley-grammar-reference-compiled.css";

interface CompiledGrammarLessonProps {
  readonly lesson: GrammarKnowledgeLesson;
  readonly onBack: () => void;
}

interface LoadedGrammarAnswer {
  readonly source: string;
  readonly answerText: string;
}

interface LoadedGrammarPoint {
  readonly key: string;
  readonly title: string;
  readonly cardId?: string;
  readonly answer?: LoadedGrammarAnswer;
  readonly status: "loading" | "ready" | "unavailable";
}

interface LoadedGrammarState {
  readonly requestKey: string;
  readonly points: readonly LoadedGrammarPoint[];
}

function splitParagraphs(answerText: string): readonly string[] {
  return answerText
    .split("\n")
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function compactText(value: string, maxLength = 170): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  const shortened = normalized.slice(0, Math.max(0, maxLength - 1));
  const boundary = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, boundary > 80 ? boundary : shortened.length).trim()}…`;
}

function pointSummary(point: LoadedGrammarPoint, fallback: string): string {
  const paragraph = point.answer === undefined ? undefined : splitParagraphs(point.answer.answerText)[0];
  return paragraph === undefined ? fallback : compactText(paragraph);
}

export function CompiledGrammarLesson({ lesson, onBack }: CompiledGrammarLessonProps) {
  const { answerGrammarQuestion } = useGrammar();
  const artwork = getGrammarLessonArtwork(lesson.id);

  const requests = useMemo(
    () => [
      ...lesson.coreTopics.map((topic) => ({ key: `core:${topic}`, title: topic })),
      ...lesson.subtopics.map((subtopic) => ({
        key: subtopic.cardId,
        title: subtopic.title,
        cardId: subtopic.cardId
      }))
    ],
    [lesson]
  );
  const requestKey = useMemo(
    () => requests.map((request) => `${request.key}:${request.title}`).join("\u001f"),
    [requests]
  );
  const loadingPoints = useMemo<readonly LoadedGrammarPoint[]>(
    () => requests.map((request) => ({ ...request, status: "loading" as const })),
    [requests]
  );
  const [loadedState, setLoadedState] = useState<LoadedGrammarState>(() => ({
    requestKey,
    points: loadingPoints
  }));

  useEffect(() => {
    let cancelled = false;

    void Promise.all(
      requests.map(async (request): Promise<LoadedGrammarPoint> => {
        try {
          const result = await answerGrammarQuestion(request.title);
          if (result.kind === "local") {
            return { ...request, answer: result.answer, status: "ready" };
          }
          return { ...request, status: "unavailable" };
        } catch {
          return { ...request, status: "unavailable" };
        }
      })
    ).then((loaded) => {
      if (!cancelled) {
        setLoadedState({ requestKey, points: Object.freeze(loaded) });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [answerGrammarQuestion, requestKey, requests]);

  const points = loadedState.requestKey === requestKey ? loadedState.points : loadingPoints;
  const readyPoints = points.filter(
    (point) => point.status === "ready" && point.answer !== undefined
  );
  const loading = points.some((point) => point.status === "loading");
  const focusPoint = readyPoints[0] ?? points[0];
  const keyPoints = (readyPoints.length > 0 ? readyPoints : points).slice(0, 3);
  const rowPoints = (readyPoints.length > 0 ? readyPoints : points).slice(0, 5);
  const topicLabels = lesson.subtopics.length > 0
    ? lesson.subtopics.map((subtopic) => subtopic.title)
    : lesson.coreTopics;

  return (
    <main
      className="wvg-reference-lesson wvg-reference-lesson--compiled"
      aria-labelledby="grammar-compiled-topic-title"
    >
      <header className="wvg-reference-hero">
        <div className="wvg-reference-hero__copy">
          <nav aria-label="Grammar breadcrumb" className="wvg-reference-breadcrumbs">
            <button onClick={onBack} type="button">
              Grammar
            </button>
            <span aria-hidden="true">›</span>
            <span>{lesson.category}</span>
            <span aria-hidden="true">›</span>
            <strong>{lesson.title}</strong>
          </nav>
          <h1 id="grammar-compiled-topic-title">{lesson.title}</h1>
          <p>{lesson.description}</p>
        </div>
        <img
          alt=""
          aria-hidden="true"
          className="wvg-reference-hero__art"
          draggable={false}
          src={artwork}
        />
      </header>

      <section className="wvg-reference-grid" aria-label={`${lesson.title} lesson overview`}>
        <article className="wvg-reference-card wvg-reference-card--formula wvg-compiled-focus">
          <p className="wvg-reference-label">LESSON FOCUS · DERSİN ODAĞI</p>
          <h2>{focusPoint?.title ?? lesson.title}</h2>
          <p className="wvg-compiled-focus__summary">
            {loading
              ? "Dersin ana noktaları hazırlanıyor…"
              : focusPoint === undefined
                ? lesson.description
                : pointSummary(focusPoint, lesson.description)}
          </p>
          <div className="wvg-compiled-focus__rule">
            <span aria-hidden="true">
              <AppIcon name="book-open" size={17} />
            </span>
            <p>Önce anlamı ve kullanım bağlamını seç; ardından doğru yapıyı kur.</p>
          </div>
        </article>

        <article className="wvg-reference-card wvg-reference-card--uses wvg-compiled-points">
          <p className="wvg-reference-label">KEY POINTS · ANA NOKTALAR</p>
          <div className="wvg-reference-use-list">
            {keyPoints.map((point, index) => (
              <div className="wvg-reference-use" key={point.key}>
                <span className="wvg-reference-use__icon" aria-hidden="true">
                  <AppIcon name={index === 0 ? "star" : index === 1 ? "clock" : "check"} size={17} />
                </span>
                <div>
                  <strong>{point.title}</strong>
                  <p>
                    {point.status === "loading"
                      ? "Açıklama hazırlanıyor…"
                      : pointSummary(point, "Bu noktanın açıklaması yakında eklenecek.")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="wvg-reference-card wvg-reference-card--signals wvg-compiled-topics">
          <p className="wvg-reference-label">TOPICS IN THIS LESSON · ALT BAŞLIKLAR</p>
          <div className="wvg-reference-signals">
            {topicLabels.slice(0, 10).map((topic) => (
              <span key={topic}>{topic}</span>
            ))}
          </div>
        </article>

        <article className="wvg-reference-card wvg-reference-card--compare wvg-compiled-guide">
          <p className="wvg-reference-label">HOW TO STUDY · NASIL ÇALIŞ?</p>
          <div className="wvg-compiled-guide__steps">
            <section>
              <strong>1</strong>
              <p>Önce yapının ne anlattığını kavra.</p>
            </section>
            <section>
              <strong>2</strong>
              <p>Benzer yapılarla farkını örnek üzerinden gör.</p>
            </section>
            <section>
              <strong>3</strong>
              <p>Kendi cümleni kurup Wordie ile kontrol et.</p>
            </section>
          </div>
        </article>

        <article className="wvg-reference-card wvg-reference-card--examples wvg-compiled-explanations">
          <p className="wvg-reference-label">KEY EXPLANATIONS · ANA AÇIKLAMALAR</p>
          <div className="wvg-reference-example-list">
            {rowPoints.map((point, index) => (
              <div className="wvg-reference-example" key={point.key}>
                <span aria-hidden="true">
                  <AppIcon name={index % 2 === 0 ? "book-open" : "check"} size={14} />
                </span>
                <strong>{point.title}</strong>
                <b>{lesson.level}</b>
                <p>
                  {point.status === "loading"
                    ? "Açıklama hazırlanıyor…"
                    : pointSummary(point, "Açıklama yakında eklenecek.")}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <aside className="wvg-reference-tip" aria-label={`${lesson.title} study tip`}>
        <span aria-hidden="true">●</span>
        <strong>KISA KURAL</strong>
        <p>Formülü ezberlemeden önce anlamı seç; doğru yapı anlamdan sonra daha kolay oturur.</p>
      </aside>
    </main>
  );
}
