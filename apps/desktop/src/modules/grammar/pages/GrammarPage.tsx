import { useMemo, useRef, useState } from "react";

import grammarBackground from "../../../assets/collections/collections-background.png";
import { AppIcon } from "../../../design-system";

import "../../../styles/word-valley-grammar-phase1-home.css";
import "../../../styles/word-valley-grammar-phase2-topic.css";
import "../../../styles/word-valley-grammar-phase3-examples.css";

interface GrammarArea {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly level: string;
  readonly accent: "gold" | "forest";
}

interface GrammarLesson {
  readonly title: string;
  readonly category: string;
  readonly level: string;
  readonly description: string;
  readonly keywords: readonly string[];
  readonly implemented?: boolean;
}

type GrammarView = "home" | "present-perfect";
type PresentPerfectTab = "rule" | "examples";

const GRAMMAR_AREAS: readonly GrammarArea[] = Object.freeze([
  {
    eyebrow: "TENSES & TIME",
    title: "Tenses & Time",
    description: "Present, past, perfect forms, aspect, and time reference.",
    level: "A1–C1",
    accent: "gold"
  },
  {
    eyebrow: "NOUN SYSTEM",
    title: "Nouns & Articles",
    description: "Articles, countability, determiners, pronouns, and possession.",
    level: "A1–C1",
    accent: "forest"
  },
  {
    eyebrow: "VERB SYSTEM",
    title: "Modals & Verb Patterns",
    description: "Ability, obligation, advice, infinitives, gerunds, and verb patterns.",
    level: "A2–C1",
    accent: "gold"
  },
  {
    eyebrow: "SENTENCE LOGIC",
    title: "Clauses & Conditionals",
    description: "Conditionals, relative clauses, reported speech, and linking ideas.",
    level: "A2–C1",
    accent: "forest"
  },
  {
    eyebrow: "RELATIONSHIPS",
    title: "Prepositions & Linkers",
    description: "Time, place, movement, dependent prepositions, and connectors.",
    level: "A1–C1",
    accent: "gold"
  },
  {
    eyebrow: "DESCRIPTION",
    title: "Adjectives & Adverbs",
    description: "Comparison, degree, order, modifiers, and natural emphasis.",
    level: "A1–C1",
    accent: "forest"
  }
]);

const GRAMMAR_LESSONS: readonly GrammarLesson[] = Object.freeze([
  {
    title: "Present Perfect",
    category: "Tenses & Time",
    level: "B1",
    description: "Connect a past event, result, duration, or life experience to the present.",
    keywords: ["present", "perfect", "have", "has", "since", "for"],
    implemented: true
  },
  {
    title: "Present Perfect Continuous",
    category: "Tenses & Time",
    level: "B1–B2",
    description: "Focus on an activity continuing, or recently continuing, up to now.",
    keywords: ["present", "perfect", "continuous", "have been", "has been"]
  },
  {
    title: "Past Perfect",
    category: "Tenses & Time",
    level: "B2",
    description: "Place one past event before another past reference point.",
    keywords: ["past", "perfect", "had", "before"]
  },
  {
    title: "Perfect Infinitive",
    category: "Modals & Verb Patterns",
    level: "C1",
    description: "Use “to have + past participle” to look back from another viewpoint.",
    keywords: ["perfect", "infinitive", "to have", "participle"]
  },
  {
    title: "Articles: a, an, the",
    category: "Nouns & Articles",
    level: "A1–B2",
    description: "Choose articles by reference, specificity, countability, and shared knowledge.",
    keywords: ["article", "articles", "a", "an", "the", "noun"]
  },
  {
    title: "For vs Since",
    category: "Tenses & Time",
    level: "B1",
    description: "Choose “for” for a duration and “since” for the starting point of that duration.",
    keywords: ["for", "vs", "since", "duration", "starting point", "present perfect"]
  },
  {
    title: "In, On, At: Time",
    category: "Prepositions & Linkers",
    level: "A1–A2",
    description: "Choose the natural preposition for clock times, days, dates, months, and longer periods.",
    keywords: ["preposition", "prepositions", "in", "on", "at", "time"]
  },
  {
    title: "Used to vs Be used to",
    category: "Modals & Verb Patterns",
    level: "B1",
    description: "Separate past habits and states from the meaning of being accustomed to something.",
    keywords: ["used", "to", "vs", "be", "used to", "habit", "accustomed"]
  },
  {
    title: "Much vs Many",
    category: "Nouns & Articles",
    level: "A1–A2",
    description: "Choose the natural quantity word by whether the noun is countable or uncountable.",
    keywords: ["much", "vs", "many", "countable", "uncountable", "quantity"]
  }
]);

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

export function GrammarPage() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<GrammarView>("home");
  const searchRef = useRef<HTMLInputElement>(null);
  const tokens = useMemo(() => normalizeSearch(query), [query]);
  const searching = tokens.length > 0;

  const visibleAreas = useMemo(() => {
    if (!searching) {
      return GRAMMAR_AREAS;
    }

    return GRAMMAR_AREAS.filter((area) =>
      includesEveryToken(`${area.eyebrow} ${area.title} ${area.description} ${area.level}`, tokens)
    );
  }, [searching, tokens]);

  const visibleLessons = useMemo(() => {
    if (!searching) {
      return [];
    }

    return GRAMMAR_LESSONS.filter((lesson) =>
      includesEveryToken(
        `${lesson.title} ${lesson.category} ${lesson.level} ${lesson.description} ${lesson.keywords.join(" ")}`,
        tokens
      )
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
              <div aria-hidden="true" className="wvg-progress-track">
                <span />
              </div>
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
                    key={lesson.title}
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
                  <button className="wvg-result-row wvg-result-row--area" key={area.title} onClick={() => searchFor(area.title)} type="button">
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
                  <article className="wvg-area" data-accent={area.accent} key={area.title}>
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
      <button className="wvg-topic__back" onClick={onBack} type="button">
        ← Grammar home
      </button>

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
          <button
            aria-current={tab === "rule" ? "page" : undefined}
            className={tab === "rule" ? "is-active" : undefined}
            onClick={() => setTab("rule")}
            type="button"
          >
            Rule
          </button>
          <button
            aria-current={tab === "examples" ? "page" : undefined}
            className={tab === "examples" ? "is-active" : undefined}
            onClick={() => setTab("examples")}
            type="button"
          >
            Examples
          </button>
          <button disabled type="button">Compare</button>
          <button disabled type="button">Practice</button>
        </nav>

        {tab === "rule" ? <PresentPerfectRuleContent /> : <PresentPerfectExamples />}
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
            <span>I have finished.</span>
            <span>She has arrived.</span>
            <span>They have never seen it.</span>
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
          <div>
            <strong>I’ve lost my keys.</strong>
            <span><b>Şu anki sonuç:</b> Anahtarlar hâlâ bende değil; kapıyı açamıyorum.</span>
          </div>
          <div>
            <strong>We’ve lived here for six years.</strong>
            <span><b>Devam eden durum:</b> Altı yıl önce başladık ve hâlâ burada yaşıyoruz.</span>
          </div>
          <div>
            <strong>Have you ever tried skiing?</strong>
            <span><b>Hayat deneyimi:</b> Tam olarak ne zaman yaptığın önemli değil; bugüne kadarki deneyimin soruluyor.</span>
          </div>
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
        <p className="wvg-examples-intro__guide">
          Her örnekte önce İngilizce cümleyi oku, sonra Türkçesine bak ve en son “neden Present Perfect?” açıklamasını kontrol et.
        </p>
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
        <p>
          Present Perfect’i yalnızca <strong>have/has + V3</strong> formülü olarak ezberlersen karışır. Önce anlamı seç: <strong>bugünle bağlantı</strong> var mı?
          Sonra formülü kur. Böyle düşünürsen Past Simple ile farkı çok daha kolay oturur.
        </p>
      </aside>
    </section>
  );
}
