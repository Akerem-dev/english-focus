import { useState } from "react";

import { getGrammarLessonArtwork } from "../knowledge/grammarLessonArtwork";

interface PresentPerfectReferenceLessonProps {
  readonly onBrowseLessons: () => void;
}

type LessonTab = "rule" | "examples" | "compare" | "mistakes" | "practice";

interface LessonTabDefinition {
  readonly id: LessonTab;
  readonly label: string;
}

const TABS: readonly LessonTabDefinition[] = Object.freeze([
  { id: "rule", label: "Rule" },
  { id: "examples", label: "Examples" },
  { id: "compare", label: "Compare" },
  { id: "mistakes", label: "Mistakes" },
  { id: "practice", label: "Practice" }
]);

const USE_CASES = Object.freeze([
  {
    mark: "★",
    title: "Life experience",
    body: "Hayatındaki bir deneyimi anlatırken."
  },
  {
    mark: "◷",
    title: "Unspecified time",
    body: "Kesin geçmiş zaman önemli değilse."
  },
  {
    mark: "✓",
    title: "Recent result / ongoing",
    body: "Sonuç ya da durum bugün sürüyorsa."
  }
]);

const SIGNAL_WORDS = Object.freeze([
  "just",
  "already",
  "yet",
  "ever",
  "never",
  "since",
  "for",
  "recently"
]);

const EXAMPLES = Object.freeze([
  {
    sentence: "I’ve lost my keys.",
    type: "Result now",
    note: "Anahtarlar hâlâ kayıp."
  },
  {
    sentence: "She has lived here for six years.",
    type: "Duration",
    note: "Durum hâlâ sürüyor."
  },
  {
    sentence: "Have you ever visited Rome?",
    type: "Life experience",
    note: "Kesin geçmiş zaman önemli değil."
  },
  {
    sentence: "I’ve just finished the report.",
    type: "Recent result",
    note: "Raporun şimdi hazır olması önemli."
  },
  {
    sentence: "They haven’t seen that movie yet.",
    type: "Unspecified time",
    note: "Eylemin tam zamanı belirtilmiyor."
  }
]);

const COMPARISONS = Object.freeze([
  {
    label: "RESULT NOW",
    perfect: "I’ve lost my keys.",
    perfectNote: "Sonuç şimdi önemli; anahtarlar hâlâ bende değil.",
    simple: "I lost my keys yesterday.",
    simpleNote: "Yesterday bitmiş bir geçmiş zaman verir."
  },
  {
    label: "LIFE EXPERIENCE",
    perfect: "Have you ever visited Rome?",
    perfectNote: "Bugüne kadarki deneyimi sorar.",
    simple: "Did you visit Rome in 2022?",
    simpleNote: "2022 bitmiş ve belirli bir zamandır."
  },
  {
    label: "STILL TRUE",
    perfect: "She has lived here for six years.",
    perfectNote: "Altı yıl önce başladı ve hâlâ burada yaşıyor.",
    simple: "She lived there for six years.",
    simpleNote: "O yaşam dönemi artık bitmiş olarak anlatılır."
  },
  {
    label: "UNFINISHED TIME",
    perfect: "I’ve had three meetings today.",
    perfectNote: "Today hâlâ devam eden zaman dilimi olarak görülüyor.",
    simple: "I had three meetings yesterday.",
    simpleNote: "Yesterday tamamen bitmiştir."
  }
]);

const MISTAKES = Object.freeze([
  {
    wrong: "I have seen him yesterday.",
    correct: "I saw him yesterday.",
    reason: "“Yesterday” bitmiş bir geçmiş zamanı gösterdiği için Past Simple kullanırız."
  },
  {
    wrong: "She has finished the report last night.",
    correct: "She finished the report last night.",
    reason: "“Last night” belirli ve bitmiş bir geçmiş zamandır."
  },
  {
    wrong: "I am here since 2021.",
    correct: "I have been here since 2021.",
    reason: "Geçmişte başlayıp şimdi süren bir durum için Present Perfect gerekir."
  }
]);

const PRACTICE_OPTIONS = Object.freeze(["lost", "have lost", "had lost", "am losing"]);
const PRACTICE_ANSWER = "have lost";

export function PresentPerfectReferenceLesson({
  onBrowseLessons
}: PresentPerfectReferenceLessonProps) {
  const [activeTab, setActiveTab] = useState<LessonTab>("rule");
  const [practiceChoice, setPracticeChoice] = useState<string | undefined>();
  const grammarHero = getGrammarLessonArtwork("present-perfect");
  const practiceCorrect = practiceChoice === PRACTICE_ANSWER;

  return (
    <main className="wvg-v12-lesson" aria-labelledby="grammar-topic-title">
      <section className="wvg-v12-lesson__surface">
        <header className="wvg-v12-lesson__hero">
          <div className="wvg-v12-lesson__hero-copy">
            <button className="wvg-v12-lesson__back" onClick={onBrowseLessons} type="button">
              ← B1 · TENSES &amp; TIME
            </button>
            <h1 id="grammar-topic-title">Present Perfect</h1>
            <p>
              Geçmişte başlayan ya da gerçekleşen bir şeyin sonucu, deneyimi veya devamı bugün hâlâ
              önemliyse Present Perfect kullanırız.
            </p>
          </div>
          <img
            alt=""
            aria-hidden="true"
            className="wvg-v12-lesson__hero-art"
            draggable={false}
            src={grammarHero}
          />
        </header>

        <nav aria-label="Present Perfect lesson sections" className="wvg-v12-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              aria-controls={`grammar-panel-${tab.id}`}
              aria-selected={activeTab === tab.id}
              className={activeTab === tab.id ? "is-active" : undefined}
              id={`grammar-tab-${tab.id}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <section
          aria-labelledby={`grammar-tab-${activeTab}`}
          className="wvg-v12-panel"
          id={`grammar-panel-${activeTab}`}
          role="tabpanel"
        >
          {activeTab === "rule" ? (
            <div className="wvg-v12-rule">
              <div className="wvg-v12-rule__top">
                <section className="wvg-v12-section wvg-v12-formula-section">
                  <p className="wvg-v12-label">CORE FORMULA</p>
                  <div className="wvg-v12-formula-card">
                    <h2>have / has&nbsp; + &nbsp;past participle (V₃)</h2>
                    <strong>I / you / we / they&nbsp; → &nbsp;have + V₃</strong>
                    <strong>he / she / it&nbsp; → &nbsp;has + V₃</strong>
                    <p>I have finished.&nbsp;&nbsp;&nbsp;&nbsp; She has arrived.</p>
                  </div>
                </section>

                <section className="wvg-v12-section wvg-v12-uses-section">
                  <p className="wvg-v12-label">WHEN TO USE</p>
                  <div className="wvg-v12-use-list">
                    {USE_CASES.map((useCase) => (
                      <div className="wvg-v12-use" key={useCase.title}>
                        <span aria-hidden="true">{useCase.mark}</span>
                        <div>
                          <strong>{useCase.title}</strong>
                          <p>{useCase.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="wvg-v12-rule__middle">
                <section className="wvg-v12-section">
                  <p className="wvg-v12-label">SIGNAL WORDS</p>
                  <div className="wvg-v12-signal-list">
                    {SIGNAL_WORDS.map((word) => (
                      <span key={word}>{word}</span>
                    ))}
                  </div>
                </section>

                <section className="wvg-v12-section">
                  <p className="wvg-v12-label">QUICK DECISION</p>
                  <div className="wvg-v12-quick-decision">
                    Bitmiş geçmiş zamanı söylüyorsan → <strong>Past Simple.</strong> Bugünle bağlantı
                    önemliyse → <strong>Present Perfect.</strong>
                  </div>
                </section>
              </div>

              <section className="wvg-v12-section wvg-v12-rule__examples">
                <p className="wvg-v12-label">EXAMPLES</p>
                <div className="wvg-v12-example-table">
                  {EXAMPLES.slice(0, 3).map((example) => (
                    <div className="wvg-v12-example-row" key={example.sentence}>
                      <strong>{example.sentence}</strong>
                      <b>{example.type}</b>
                      <p>{example.note}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : null}

          {activeTab === "examples" ? (
            <div className="wvg-v12-state-view">
              <header className="wvg-v12-state-view__heading">
                <div>
                  <p className="wvg-v12-label">EXAMPLES · ÖRNEKLER</p>
                  <h2>Cümleyi ezberleme; neden bu zamanı seçtiğimizi gör.</h2>
                </div>
                <p>Önce İngilizce cümleyi oku, sonra bugünkü bağlantının ne olduğunu kontrol et.</p>
              </header>
              <div className="wvg-v12-example-cards">
                {EXAMPLES.map((example, index) => (
                  <article key={example.sentence}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h3>{example.sentence}</h3>
                      <p>{example.note}</p>
                    </div>
                    <aside>
                      <small>{example.type}</small>
                      <strong>Neden?</strong>
                      <p>{example.note} Bu yüzden cümlenin geçmişle bugünü bağlaması önemlidir.</p>
                    </aside>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "compare" ? (
            <div className="wvg-v12-state-view">
              <header className="wvg-v12-state-view__heading">
                <div>
                  <p className="wvg-v12-label">COMPARE · KARŞILAŞTIR</p>
                  <h2>Present Perfect mı, Past Simple mı?</h2>
                </div>
                <div className="wvg-v12-mini-rule">
                  <strong>En hızlı karar</strong>
                  <p>Bitmiş zaman varsa Past Simple; bugünle bağlantı varsa Present Perfect.</p>
                </div>
              </header>

              <div className="wvg-v12-compare-head">
                <section>
                  <small>PAST → NOW</small>
                  <h3>Present Perfect</h3>
                  <strong>have / has + V₃</strong>
                  <p>Geçmişte olan şeye bugünden bakar; sonuç, deneyim ya da devam önemlidir.</p>
                </section>
                <section>
                  <small>FINISHED PAST</small>
                  <h3>Past Simple</h3>
                  <strong>V₂ / did + base verb</strong>
                  <p>Olayı bitmiş geçmiş zamanın içine yerleştirir.</p>
                </section>
              </div>

              <div className="wvg-v12-comparison-list">
                {COMPARISONS.map((comparison, index) => (
                  <article key={comparison.label}>
                    <span>
                      {String(index + 1).padStart(2, "0")}
                      <small>{comparison.label}</small>
                    </span>
                    <div>
                      <small>PRESENT PERFECT</small>
                      <strong>{comparison.perfect}</strong>
                      <p>{comparison.perfectNote}</p>
                    </div>
                    <div>
                      <small>PAST SIMPLE</small>
                      <strong>{comparison.simple}</strong>
                      <p>{comparison.simpleNote}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "mistakes" ? (
            <div className="wvg-v12-state-view">
              <header className="wvg-v12-state-view__heading">
                <div>
                  <p className="wvg-v12-label">COMMON MISTAKES · SIK HATALAR</p>
                  <h2>Yanlışı sadece düzeltme; neden yanlış olduğunu gör.</h2>
                </div>
                <p>En sık hata, bitmiş geçmiş zaman ifadesini Present Perfect ile kullanmaktır.</p>
              </header>
              <div className="wvg-v12-mistake-list">
                {MISTAKES.map((mistake, index) => (
                  <article key={mistake.wrong}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div className="wvg-v12-mistake-list__wrong">
                      <small>YANLIŞ</small>
                      <s>{mistake.wrong}</s>
                    </div>
                    <div className="wvg-v12-mistake-list__correct">
                      <small>DOĞRU</small>
                      <strong>{mistake.correct}</strong>
                    </div>
                    <p>{mistake.reason}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "practice" ? (
            <div className="wvg-v12-state-view wvg-v12-practice">
              <header className="wvg-v12-state-view__heading">
                <div>
                  <p className="wvg-v12-label">PRACTICE · ALIŞTIRMA</p>
                  <h2>Önce anlamı seç, sonra zamanı.</h2>
                </div>
                <span>1 / 5</span>
              </header>

              <section className="wvg-v12-practice__question">
                <small>RESULT NOW · ŞİMDİKİ SONUÇ</small>
                <h3>I _____ my keys. Can you help me look for them?</h3>
                <p>İpucu: Anahtarlar şu anda hâlâ kayıp. Geçmişteki olayın sonucu bugün devam ediyor.</p>
              </section>

              <div className="wvg-v12-practice__options">
                {PRACTICE_OPTIONS.map((option, index) => {
                  const selected = practiceChoice === option;
                  const correct = selected && option === PRACTICE_ANSWER;
                  const wrong = selected && option !== PRACTICE_ANSWER;
                  return (
                    <button
                      className={correct ? "is-correct" : wrong ? "is-wrong" : undefined}
                      key={option}
                      onClick={() => setPracticeChoice(option)}
                      type="button"
                    >
                      <span>{String.fromCharCode(65 + index)}</span>
                      <strong>{option}</strong>
                      {correct ? <b aria-label="Correct">✓</b> : null}
                      {wrong ? <b aria-label="Incorrect">×</b> : null}
                    </button>
                  );
                })}
              </div>

              {practiceChoice === undefined ? null : (
                <aside
                  aria-live="polite"
                  className={practiceCorrect ? "wvg-v12-feedback is-correct" : "wvg-v12-feedback is-wrong"}
                >
                  <strong>{practiceCorrect ? "DOĞRU · Mantığı doğru kurdun." : "TEKRAR DÜŞÜN"}</strong>
                  <p>
                    {practiceCorrect
                      ? "Doğru cevap “have lost”. Anahtarları kaybetme olayı geçmişte oldu ama sonuç şimdi devam ediyor; anahtarlar hâlâ kayıp."
                      : "Cümlenin odağı kaybetme anı değil, anahtarların şu anda bulunamaması. Bugünle bağlantıyı gösteren yapıyı seç."}
                  </p>
                </aside>
              )}
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
