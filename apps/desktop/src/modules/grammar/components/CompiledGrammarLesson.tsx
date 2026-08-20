import { useEffect, useMemo, useState } from "react";

import { useGrammar } from "../../../app/providers";
import type { GrammarKnowledgeLesson } from "../knowledge/grammarKnowledgeIndex";

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

function splitParagraphs(answerText: string): readonly string[] {
  return answerText
    .split("\n")
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function CompiledGrammarLesson({ lesson, onBack }: CompiledGrammarLessonProps) {
  const { answerGrammarQuestion } = useGrammar();

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

  const [points, setPoints] = useState<readonly LoadedGrammarPoint[]>(() =>
    requests.map((request) => ({ ...request, status: "loading" as const }))
  );

  useEffect(() => {
    let cancelled = false;
    setPoints(requests.map((request) => ({ ...request, status: "loading" as const })));

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
      if (!cancelled) setPoints(Object.freeze(loaded));
    });

    return () => {
      cancelled = true;
    };
  }, [answerGrammarQuestion, requests]);

  const readyPoints = points.filter(
    (point) => point.status === "ready" && point.answer !== undefined
  );
  const unavailablePoints = points.filter((point) => point.status === "unavailable");
  const loading = points.some((point) => point.status === "loading");

  return (
    <main className="wvg-topic" aria-labelledby="grammar-compiled-topic-title">
      <button className="wvg-topic__back" onClick={onBack} type="button">
        ← Grammar home
      </button>

      <section className="wvg-topic__paper">
        <header className="wvg-topic__hero">
          <div className="wvg-topic__intro">
            <p className="wvg-topic__eyebrow">
              {lesson.category.toUpperCase()} · {lesson.level}
            </p>
            <h1 id="grammar-compiled-topic-title">{lesson.title}</h1>
            <p>{lesson.description}</p>
          </div>
          <div className="wvg-topic__turkish">
            <span>BU DERSİN KAPSAMI</span>
            <p>
              {requests.length === 1
                ? "Bu ders tek bir temel grammar noktasını yerel bilgi tabanından açıklıyor."
                : `Bu ders ${requests.length} bağlantılı grammar noktasını aynı başlık altında topluyor. Alt konular ayrı dersler gibi şişirilmeden burada birlikte tutuluyor.`}
            </p>
          </div>
        </header>

        <div className="wvg-rule-layout">
          <article className="wvg-rule-main">
            {loading ? (
              <section className="wvg-rule-breakdown">
                <p className="wvg-rule-kicker">LOCAL KNOWLEDGE · YEREL BİLGİ</p>
                <h2>Ders hazırlanıyor…</h2>
                <p>
                  Onaylı grammar cache kartları cihazdan okunuyor. Bu işlem Gemini çağrısı yapmaz.
                </p>
              </section>
            ) : null}

            {readyPoints.map((point, index) => {
              const answer = point.answer;
              if (answer === undefined) return null;
              return (
                <section className="wvg-rule-breakdown" key={point.key}>
                  <p className="wvg-rule-kicker">
                    {String(index + 1).padStart(2, "0")} ·{" "}
                    {answer.source === "local-core-cache" ? "CORE RULE" : "GRAMMAR POINT"}
                  </p>
                  <h2>{point.title}</h2>
                  {splitParagraphs(answer.answerText).map((paragraph, paragraphIndex) => (
                    <p key={`${point.key}:${paragraphIndex}`}>{paragraph}</p>
                  ))}
                </section>
              );
            })}

            {!loading && readyPoints.length === 0 ? (
              <section className="wvg-rule-breakdown">
                <p className="wvg-rule-kicker">FAIL CLOSED · GÜVENLİ DURUŞ</p>
                <h2>Bu ders için henüz kullanıcıya açılmış yerel cevap yok.</h2>
                <p>
                  Konu katalogda kalıyor; fakat derlenmiş cevap manuel semantic kontrolden
                  geçmediyse Wordie onu doğruymuş gibi göstermiyor.
                </p>
              </section>
            ) : null}
          </article>

          <aside className="wvg-rule-notes" aria-label={`${lesson.title} reference notes`}>
            <section>
              <p>LESSON MAP · ALT BAŞLIKLAR</p>
              <ul>
                {points.map((point) => (
                  <li key={point.key}>
                    {point.title}
                    {point.status === "ready"
                      ? " ✓"
                      : point.status === "unavailable"
                        ? " · review pending"
                        : " · loading"}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <p>LOCAL FIRST · TOKEN DURUMU</p>
              <span className="wvg-note-explainer">
                Burada görünen açıklamalar onaylı yerel grammar cache’inden gelir. Cache hit
                olduğunda Gemini isteği ve Gemini token kullanımı sıfırdır.
              </span>
            </section>

            {unavailablePoints.length > 0 ? (
              <section className="wvg-common-mistake">
                <p>REVIEW QUEUE · İNCELEMEDE</p>
                <strong>{unavailablePoints.length} alt başlık fail-closed durumda.</strong>
                <span>
                  Bunlar eksik, hatalı veya yeterince güvenilir olmayan derlenmiş cevabı kullanıcıya
                  göstermemek için bilinçli olarak kapalı tutuluyor.
                </span>
              </section>
            ) : null}
          </aside>
        </div>
      </section>
    </main>
  );
}
