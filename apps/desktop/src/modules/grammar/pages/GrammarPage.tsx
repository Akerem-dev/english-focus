import { useMemo, useRef, useState } from "react";

import grammarBackground from "../../../assets/collections/collections-background.png";
import { AppIcon } from "../../../design-system";
import { PresentPerfectPractice } from "../components/PresentPerfectPractice";
import {
  GRAMMAR_KNOWLEDGE_AREAS,
  GRAMMAR_KNOWLEDGE_LESSONS
} from "../knowledge/grammarKnowledgeIndex";

import "../../../styles/word-valley-grammar-phase1-home.css";
import "../../../styles/word-valley-grammar-phase2-topic.css";
import "../../../styles/word-valley-grammar-phase3-examples.css";
import "../../../styles/word-valley-grammar-phase4-compare.css";
import "../../../styles/word-valley-grammar-phase5-practice.css";

type GrammarView = "home" | "present-perfect";
type PresentPerfectTab = "rule" | "examples" | "compare" | "practice";

const TROUBLE_SPOTS = Object.freeze([
  "for vs since",
  "in · on · at",
  "used to vs be used to",
  "much vs many"
]);

function normalizeSearch(value: string): string[] {
  return value
    .trim()
    .toLocaleLowerCase("en")
    .split(/\s+/)
    .filter(Boolean);
}

function includesEveryToken(haystack: string, tokens: readonly string[]): boolean {
  const normalized = haystack.toLocaleLowerCase("en");
  return tokens.every((token) => normalized.includes(token));
}

function lessonSearchText(lesson: (typeof GRAMMAR_KNOWLEDGE_LESSONS)[number]): string {
  const subtopicTitles = lesson.subtopics.map((subtopic) => subtopic.title).join(" ");
  return `${lesson.title} ${lesson.category} ${lesson.level} ${lesson.description} ${lesson.keywords.join(" ")} ${lesson.coreTopics.join(" ")} ${subtopicTitles}`;
}

export function GrammarPage() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<GrammarView>("home");
  const searchRef = useRef<HTMLInputElement>(null);
  const tokens = useMemo(() => normalizeSearch(query), [query]);
  const searching = tokens.length > 0;

  const visibleAreas = useMemo(() => {
    if (!searching) return GRAMMAR_KNOWLEDGE_AREAS;
    return GRAMMAR_KNOWLEDGE_AREAS.filter((area) =>
      includesEveryToken(`${area.eyebrow} ${area.title} ${area.description} ${area.level}`, tokens)
    );
  }, [searching, tokens]);

  const visibleLessons = useMemo(() => {
    if (!searching) return [];
    return GRAMMAR_KNOWLEDGE_LESSONS.filter((lesson) =>
      includesEveryToken(lessonSearchText(lesson), tokens)
    );
  }, [searching, tokens]);

  function searchFor(value: string) {
    setQuery(value);
    window.requestAnimationFrame(() => {
      searchRef.current?.focus();
      searchRef.current?.select();
    });
  }

  function openPresentPerfect() {
    setQuery("");
    setView("present-perfect");
  }

  function returnHome() {
    setQuery("");
    setView("home");
  }

  const resultCount = visibleLessons.length + visibleAreas.length;

  return (
    <div className="wvg-page">
      <div
        aria-hidden="true"
        className="wvg-scene"
        style={{ backgroundImage: `url("${grammarBackground}")` }}
      />
      <div aria-hidden="true" className="wvg-scene-veil" />

      {view === "present-perfect" ? (
        <PresentPerfectLesson onBack={returnHome} />
      ) : (
        <main className="wvg-home" aria-labelledby="grammar-home-title">
          <header className="wvg-home__header">
            <div className="wvg-home__intro">
              <p className="wvg-eyebrow">YOUR GRAMMAR STUDIO</p>
              <h1 id="grammar-home-title">English Grammar</h1>
              <p>Understand the patterns behind natural English — one clear lesson at a time.</p>
            </div>

            <label className="wvg-search">
              <AppIcon name="search" size={17} />
              <input
                aria-label="Search grammar topics"
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder="Search grammar topics…"
                ref={searchRef}
                type="search"
                value={query}
              />
            </label>
          </header>

          <section aria-label="Continue learning" className="wvg-continue">
            <div className="wvg-continue__copy">
              <p className="wvg-section-label">CONTINUE LEARNING</p>
              <h2>Present Perfect</h2>
              <p>B1 · Tenses &amp; Time · Rule 2 of 4</p>
              <div aria-hidden="true" className="wvg-progress-track"><span /></div>
            </div>
            <button className="wvg-primary-button" onClick={openPresentPerfect} type="button">
              Continue lesson
            </button>
          </section>

          <section className={`wvg-browse${searching ? " wvg-browse--searching" : ""}`} aria-labelledby="grammar-browse-title">
            <header className="wvg-browse__header">
              <div>
                <h2 id="grammar-browse-title">{searching ? "Search results" : "Browse grammar"}</h2>
                <p>
                  {searching
                    ? `${resultCount} ${resultCount === 1 ? "result" : "results"} for “${query.trim()}”.`
                    : "Organized by the way English actually works."}
                </p>
              </div>
              <span>{searching ? "GRAMMAR INDEX" : "ALL LEVELS  A1 — C1"}</span>
            </header>

            {searching ? (
              <div className="wvg-search-results" role="status">
                {visibleLessons.map((lesson) => (
                  <button
                    className="wvg-result-row"
                    data-implemented={lesson.implemented ? "true" : "false"}
                    disabled={!lesson.implemented}
                    key={lesson.id}
                    onClick={lesson.implemented ? openPresentPerfect : undefined}
                    type="button"
                  >
                    <span className="wvg-result-row__copy">
                      <strong>{lesson.title}</strong>
                      <small>{lesson.description}</small>
                    </span>
                    <span className="wvg-result-row__meta">
                      <small>{lesson.level} · {lesson.category}</small>
                      {lesson.implemented ? <b aria-hidden="true">→</b> : null}
                    </span>
                  </button>
                ))}

                {visibleAreas.map((area) => (
                  <button className="wvg-result-row wvg-result-row--area" key={area.id} onClick={() => searchFor(area.title)} type="button">
                    <span className="wvg-result-row__copy">
                      <strong>{area.title}</strong>
                      <small>{area.description}</small>
                    </span>
                    <span className="wvg-result-row__meta">
                      <small>{area.level} · Grammar area</small>
                      <b aria-hidden="true">→</b>
                    </span>
                  </button>
                ))}

                {resultCount === 0 ? (
                  <div className="wvg-empty-search">
                    <strong>No matching grammar topic</strong>
                    <span>Try a broader word such as “tense”, “article”, or “preposition”.</span>
                    <button onClick={() => setQuery("")} type="button">Browse all grammar</button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="wvg-area-grid">
                {visibleAreas.map((area) => (
                  <article className="wvg-area" data-accent={area.accent} key={area.id}>
                    <i aria-hidden="true" />
                    <p>{area.eyebrow}</p>
                    <h3>{area.title}</h3>
                    <span>{area.description}</span>
                    <small>{area.level}</small>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section aria-label="Common trouble spots" className="wvg-trouble-spots">
            <strong>COMMON TROUBLE SPOTS</strong>
            <div>
              {TROUBLE_SPOTS.map((spot) => (
                <button key={spot} onClick={() => searchFor(spot.replace(/\s*·\s*/g, " "))} type="button">
                  {spot}
                </button>
              ))}
            </div>
          </section>
        </main>
      )}
    </div>
  );
}

interface PresentPerfectLessonProps {
  readonly onBack: () => void;
}

function PresentPerfectLesson({ onBack }: PresentPerfectLessonProps) {
  const [tab, setTab] = useState<PresentPerfectTab>("rule");

  return (
    <main className="wvg-topic" aria-labelledby="grammar-topic-title">
      <button className="wvg-topic__back" onClick={onBack} type="button">← Grammar home</button>

      <section className="wvg-topic__paper">
        <header className="wvg-topic__hero">
          <div className="wvg-topic__intro">
            <p className="wvg-topic__eyebrow">TENSES &amp; TIME · B1</p>
            <h1 id="grammar-topic-title">Present Perfect</h1>
            <p>Past tense gibi yalnızca “ne oldu?” demez. Geçmişte olan şeyin bugünle bağlantısına odaklanır.</p>
          </div>
          <div className="wvg-topic__turkish">
            <span>EN KISA TÜRKÇE MANTIĞI</span>
            <p>Geçmişte bir şey oldu; ama cümlenin asıl derdi o olayın tam olarak ne zaman olduğu değil, bugün sonucu var mı, deneyim mi, yoksa hâlâ devam mı ediyor sorusudur.</p>
          </div>
        </header>

        <nav className="wvg-topic-tabs" aria-label="Present Perfect lesson sections">
          <button aria-current={tab === "rule" ? "page" : undefined} className={tab === "rule" ? "is-active" : undefined} onClick={() => setTab("rule")} type="button">Rule</button>
          <button aria-current={tab === "examples" ? "page" : undefined} className={tab === "examples" ? "is-active" : undefined} onClick={() => setTab("examples")} type="button">Examples</button>
          <button aria-current={tab === "compare" ? "page" : undefined} className={tab === "compare" ? "is-active" : undefined} onClick={() => setTab("compare")} type="button">Compare</button>
          <button aria-current={tab === "practice" ? "page" : undefined} className={tab === "practice" ? "is-active" : undefined} onClick={() => setTab("practice")} type="button">Practice</button>
        </nav>

        {tab === "rule" ? <PresentPerfectRuleContent /> : null}
        {tab === "examples" ? <PresentPerfectExamples /> : null}
        {tab === "compare" ? <PresentPerfectCompare /> : null}
        {tab === "practice" ? <PresentPerfectPractice /> : null}
      </section>
    </main>
  );
}

function PresentPerfectRuleContent() {
  return (
    <div className="wvg-rule-layout">
      <article className="wvg-rule-main">
        <section className="wvg-pattern" aria-labelledby="present-perfect-pattern-title">
          <p>CORE PATTERN · TEMEL FORMÜL</p>
          <h2 id="present-perfect-pattern-title">have / has + past participle (V3)</h2>
          <div className="wvg-pattern__steps">
            <span><strong>I / you / we / they</strong> → have</span>
            <span><strong>he / she / it</strong> → has</span>
            <span><strong>main verb</strong> → V3: done, gone, seen, eaten…</span>
          </div>
          <div className="wvg-pattern__examples">
            <span>I have finished.</span><span>She has arrived.</span><span>They have never seen it.</span>
          </div>
        </section>

        <section className="wvg-rule-breakdown">
          <p className="wvg-rule-kicker">EN BASİT MANTIK</p>
          <h2>Geçmişe bakıyoruz, ama cümlenin ayağı bugünde.</h2>
          <p>
            Present Perfect’i öğrenirken önce “Türkçede hangi zamana denk geliyor?” diye düşünme. Çünkü tek bir Türkçe zaman karşılığı yok.
            Onun yerine şunu sor: <strong>Geçmişte olan bu olayın şimdiyle bağlantısı var mı?</strong> Cevap evetse Present Perfect güçlü bir adaydır.
          </p>
          <ol>
            <li><strong>Olay geçmişte oldu.</strong><span>Ama geçmişteki kesin saat veya tarih çoğu zaman önemli değil.</span></li>
            <li><strong>Şimdiyle bağlantı var.</strong><span>Sonuç şimdi devam ediyor, deneyim bugün için önemli ya da durum hâlâ sürüyor.</span></li>
            <li><strong>Bitmiş geçmiş zamanı söylemiyoruz.</strong><span>“Yesterday”, “last year”, “in 2020” gibi bitmiş zaman verirsek genellikle Past Simple kullanırız.</span></li>
          </ol>
        </section>

        <section className="wvg-rule-copy">
          <p className="wvg-rule-kicker">THE IDEA BEHIND THE FORM</p>
          <h2>Look backward from now.</h2>
          <p>
            The Present Perfect does not simply describe “the past”. It looks backward from the present moment.
            The exact past time is usually not the focus. What matters is the result we can see now, the experience a person has up to now,
            the duration of a situation that continues now, or an event inside a time period that has not finished yet.
          </p>
          <p className="wvg-rule-copy__tr">
            Yani “Ne zaman oldu?” sorusundan çok “Bunun şu anla ne ilgisi var?” sorusuna cevap verir. Bu yüzden Türkçede bazen “yaptım”, bazen
            “hiç yaptın mı?”, bazen de “...den beri yapıyorum” diye çevrilir. İngilizce aynı yapıyı kullanır; Türkçe çeviri bağlama göre değişir.
          </p>
        </section>

        <section className="wvg-rule-check" aria-label="Present Perfect decision check">
          <p className="wvg-rule-kicker">KAFANDA ŞU 3 SORUYU SOR</p>
          <div><strong>1.</strong><span>Kesin ve bitmiş bir geçmiş zaman söylüyor muyum? <b>Evetse:</b> büyük ihtimalle Past Simple.</span></div>
          <div><strong>2.</strong><span>Sonuç şu anda önemli mi, deneyimden mi söz ediyorum, yoksa durum hâlâ sürüyor mu? <b>Evetse:</b> Present Perfect olabilir.</span></div>
          <div><strong>3.</strong><span>Cümlede since, for, ever, never, just, already, yet gibi ipuçları var mı? Bunlar tek başına kural değildir ama güçlü işaretlerdir.</span></div>
        </section>

        <section className="wvg-rule-examples" aria-label="Present Perfect quick examples">
          <div><strong>I’ve lost my keys.</strong><span><b>Şu anki sonuç:</b> Anahtarlar hâlâ bende değil; kapıyı açamıyorum.</span></div>
          <div><strong>We’ve lived here for six years.</strong><span><b>Devam eden durum:</b> Altı yıl önce başladık ve hâlâ burada yaşıyoruz.</span></div>
          <div><strong>Have you ever tried skiing?</strong><span><b>Hayat deneyimi:</b> Tam olarak ne zaman yaptığın önemli değil; bugüne kadarki deneyimin soruluyor.</span></div>
        </section>
      </article>

      <aside className="wvg-rule-notes" aria-label="Present Perfect reference notes">
        <section>
          <p>USE IT WHEN · NE ZAMAN?</p>
          <ul>
            <li>geçmişteki bir olayın sonucu şu anda önemliyse</li>
            <li>hayatında bir şeyi yapıp yapmadığın deneyim olarak soruluyorsa</li>
            <li>geçmişte başlayan bir durum hâlâ devam ediyorsa</li>
            <li>this week / today gibi henüz bitmemiş bir zaman diliminden söz ediliyorsa</li>
          </ul>
        </section>
        <section>
          <p>SIGNAL WORDS · İPUÇLARI</p>
          <div className="wvg-signal-words">just · already · yet · ever · never · since · for · recently</div>
          <span className="wvg-note-explainer">Bunları görünce otomatik Present Perfect seçme. Önce cümlenin anlamına ve zamanın bitip bitmediğine bak.</span>
        </section>
        <section className="wvg-common-mistake">
          <p>COMMON MISTAKE · SIK HATA</p>
          <del>I have seen him yesterday.</del>
          <strong>I saw him yesterday.</strong>
          <span>“Yesterday” tamamen bitmiş bir geçmiş zamanı gösterir. Bu yüzden burada Present Perfect değil Past Simple doğal seçimdir.</span>
        </section>
      </aside>
    </div>
  );
}

function PresentPerfectExamples() {
  const examples = [
    {
      label: "RECENT RESULT",
      sentence: "I’ve just finished the report.",
      translation: "Raporu az önce bitirdim.",
      why: "Eylem geçmişte, hatta birkaç saniye önce bitti. Ama cümlenin amacı saati söylemek değil; raporun şu anda hazır olduğunu anlatmak. “Just” da yakın geçmiş + bugünkü sonuç bağlantısını güçlendiriyor."
    },
    {
      label: "DURATION UNTIL NOW",
      sentence: "She has lived in Ankara since 2021.",
      translation: "2021’den beri Ankara’da yaşıyor.",
      why: "Yaşama durumu 2021’de başladı ve şimdi de devam ediyor. “Since 2021” başlangıç noktasını verir. Eğer artık Ankara’da yaşamıyor olsaydı, bağlama göre Past Simple kullanmamız gerekebilirdi."
    },
    {
      label: "LIFE EXPERIENCE",
      sentence: "Have you ever worked abroad?",
      translation: "Hiç yurt dışında çalıştın mı?",
      why: "Burada “hangi yıl?” diye sormuyoruz. Kişinin bugüne kadarki hayat deneyimini soruyoruz. Bu yüzden kesin bir geçmiş zaman yok ve Present Perfect doğal seçim oluyor."
    },
    {
      label: "UNFINISHED TIME",
      sentence: "I’ve had three meetings today.",
      translation: "Bugün üç toplantı yaptım.",
      why: "“Today” henüz bitmemişse bugün hâlâ devam eden bir zaman dilimidir. Konuşan kişi günün şu ana kadarki bölümünü özetliyor. Gün tamamen bittikten sonra aynı olay geçmiş hikâyesi olarak anlatılırsa Past Simple daha doğal olabilir."
    }
  ] as const;

  return (
    <section className="wvg-examples-view" aria-labelledby="present-perfect-examples-title">
      <header className="wvg-examples-intro">
        <div className="wvg-examples-intro__copy">
          <p>EXAMPLES · ÖRNEKLER</p>
          <h2 id="present-perfect-examples-title">Cümleyi ezberleme; neden bu zamanı seçtiğimizi gör.</h2>
        </div>
        <p className="wvg-examples-intro__guide">Her örnekte önce İngilizce cümleyi oku, sonra Türkçesine bak ve en son “neden Present Perfect?” açıklamasını kontrol et.</p>
      </header>

      <div className="wvg-example-list">
        {examples.map((example, index) => (
          <article className="wvg-example-row" key={example.sentence}>
            <span className="wvg-example-row__number">{String(index + 1).padStart(2, "0")}</span>
            <div className="wvg-example-row__sentence">
              <strong>{example.sentence}</strong>
              <em>{example.translation}</em>
            </div>
            <div className="wvg-example-row__why">
              <span>{example.label}</span>
              <p><strong>Neden?</strong> {example.why}</p>
            </div>
          </article>
        ))}
      </div>

      <aside className="wvg-examples-note">
        <span>AKLINDA KALSIN</span>
        <p>Present Perfect’i yalnızca <strong>have/has + V3</strong> formülü olarak ezberlersen karışır. Önce anlamı seç: <strong>bugünle bağlantı</strong> var mı? Sonra formülü kur. Böyle düşünürsen Past Simple ile farkı çok daha kolay oturur.</p>
      </aside>
    </section>
  );
}

function PresentPerfectCompare() {
  const pairs = [
    {
      label: "RESULT NOW",
      perfect: "I’ve lost my keys.",
      simple: "I lost my keys yesterday.",
      perfectTr: "Anahtarlarımı kaybettim; şu anda hâlâ bende değiller.",
      simpleTr: "Anahtarlarımı dün kaybettim; olay bitmiş geçmiş zamanın içinde anlatılıyor."
    },
    {
      label: "LIFE EXPERIENCE VS FINISHED EVENT",
      perfect: "Have you ever visited Rome?",
      simple: "Did you visit Rome in 2022?",
      perfectTr: "Bugüne kadarki hayat deneyimini soruyoruz; ne zaman olduğu önemli değil.",
      simpleTr: "2022 bitmiş bir zaman. Belirli geçmiş olayı soruyoruz."
    },
    {
      label: "STILL TRUE VS FINISHED",
      perfect: "She has lived here for six years.",
      simple: "She lived there for six years.",
      perfectTr: "Altı yıl önce başladı ve hâlâ burada yaşıyor.",
      simpleTr: "Orada altı yıl yaşadı ama artık o dönem bitmiş durumda."
    },
    {
      label: "UNFINISHED VS FINISHED TIME",
      perfect: "I’ve had three meetings today.",
      simple: "I had three meetings yesterday.",
      perfectTr: "Bugün henüz bitmedi; şu ana kadarki kısmı özetliyoruz.",
      simpleTr: "Dün tamamen bitti; bu yüzden Past Simple kullanıyoruz."
    }
  ] as const;

  return (
    <section className="wvg-compare-view" aria-labelledby="present-perfect-compare-title">
      <header className="wvg-compare-intro">
        <div>
          <p>COMPARE · KARŞILAŞTIR</p>
          <h2 id="present-perfect-compare-title">Present Perfect mı, Past Simple mı?</h2>
          <span>Formülden önce zamanın nasıl görüldüğüne bak. İki yapı da geçmişten söz edebilir; fark, konuşanın geçmişi bugünden mi gördüğü yoksa bitmiş bir geçmiş zamanın içine mi yerleştirdiğidir.</span>
        </div>
        <aside>
          <strong>EN HIZLI KARAR</strong>
          <p><b>Bitmiş zaman söylüyorsan:</b> Past Simple.</p>
          <p><b>Bitmiş zaman yok ve bugünle bağlantı varsa:</b> Present Perfect.</p>
        </aside>
      </header>

      <div className="wvg-compare-columns">
        <article data-side="perfect">
          <span>PAST → NOW</span>
          <h3>Present Perfect</h3>
          <p className="wvg-compare-formula">have / has + V3</p>
          <p>Geçmişte olan şeye <strong>bugünden bakar.</strong> Sonuç şimdi önemli olabilir, deneyim bugüne kadar sürebilir veya durum hâlâ devam ediyor olabilir.</p>
          <ul>
            <li>Kesin bitmiş geçmiş zamanı genellikle söylemez.</li>
            <li>“Ne zaman?” yerine “şimdiyle bağlantısı ne?” önemlidir.</li>
            <li>ever, never, since, for, just, already, yet sık görülür.</li>
          </ul>
        </article>

        <article data-side="simple">
          <span>FINISHED PAST</span>
          <h3>Past Simple</h3>
          <p className="wvg-compare-formula">V2 / did + base verb</p>
          <p>Olayı <strong>bitmiş geçmiş zamanın içinde</strong> anlatır. Olayın bugün sonucu olup olmaması gramer seçiminde asıl mesele değildir.</p>
          <ul>
            <li>yesterday, last week, in 2020 gibi bitmiş zamanlarla doğaldır.</li>
            <li>Belirli bir geçmiş olay veya hikâye anlatılır.</li>
            <li>“Ne zaman oldu?” sorusuna cevap verebilir.</li>
          </ul>
        </article>
      </div>

      <section className="wvg-compare-pairs" aria-label="Present Perfect and Past Simple paired examples">
        {pairs.map((pair, index) => (
          <article className="wvg-compare-pair" key={pair.label}>
            <header>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{pair.label}</strong>
            </header>
            <div className="wvg-compare-pair__sentence" data-side="perfect">
              <b>Present Perfect</b>
              <strong>{pair.perfect}</strong>
              <p>{pair.perfectTr}</p>
            </div>
            <div className="wvg-compare-pair__sentence" data-side="simple">
              <b>Past Simple</b>
              <strong>{pair.simple}</strong>
              <p>{pair.simpleTr}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="wvg-compare-decision">
        <p>3 ADIMDA SEÇ</p>
        <div><strong>1</strong><span>Cümlede yesterday, last..., ago, in 2020 gibi <b>bitmiş geçmiş zaman</b> var mı? → <b>Past Simple.</b></span></div>
        <div><strong>2</strong><span>Yoksa olayın <b>şu anki sonucu, bugüne kadarki deneyimi veya hâlâ süren durumu</b> mu önemli? → <b>Present Perfect.</b></span></div>
        <div><strong>3</strong><span>Hâlâ emin değilsen “Ne zaman oldu?” diye sor. Cevap belirli ve bitmiş bir geçmiş zamansa Past Simple tarafına yaklaş.</span></div>
      </section>

      <aside className="wvg-compare-warning">
        <strong>EN SIK TUZAK</strong>
        <p><del>I have seen her yesterday.</del> <b>I saw her yesterday.</b> “Yesterday” bitmiş bir zaman olduğu için Present Perfect kullanamayız.</p>
      </aside>
    </section>
  );
}
