import { AppIcon } from "../../../design-system";
import { getGrammarLessonArtwork } from "../knowledge/grammarLessonArtwork";

interface PresentPerfectReferenceLessonProps {
  readonly onBack: () => void;
}

const USE_CASES = Object.freeze([
  {
    icon: "star" as const,
    title: "Life experience",
    body: "Hayatında bir kez bile yaptığın deneyimleri anlatır.",
    example: "I have travelled to Japan."
  },
  {
    icon: "clock" as const,
    title: "Unspecified time",
    body: "Ne zaman olduğu önemli değilse veya bilinmiyorsa.",
    example: "They have seen that movie."
  },
  {
    icon: "check" as const,
    title: "Recent result / ongoing",
    body: "Geçmişte başladı; etkisi ya da durum bugün sürüyor.",
    example: "She has lived here since 2018."
  }
]);

const SIGNAL_WORDS = Object.freeze([
  "already",
  "yet",
  "just",
  "ever",
  "never",
  "so far",
  "recently",
  "since",
  "for",
  "up to now"
]);

const EXAMPLES = Object.freeze([
  {
    icon: "star" as const,
    sentence: "We have visited many countries.",
    type: "Life experience",
    note: "Bugüne kadarki deneyim."
  },
  {
    icon: "clock" as const,
    sentence: "She has already eaten lunch.",
    type: "Recent result",
    note: "Kısa süre önce bitti; sonucu şimdi ilgili."
  },
  {
    icon: "check" as const,
    sentence: "They haven’t seen that movie yet.",
    type: "Unspecified time",
    note: "Zaman belirsiz; “yet” henüz olmadığını gösterir."
  },
  {
    icon: "star" as const,
    sentence: "I’ve known him for five years.",
    type: "Duration",
    note: "Geçmişte başladı ve hâlâ sürüyor."
  },
  {
    icon: "book-open" as const,
    sentence: "You’ve just won a prize!",
    type: "Very recent",
    note: "Az önce gerçekleşti; etkisi şu anda önemli."
  }
]);

export function PresentPerfectReferenceLesson({ onBack }: PresentPerfectReferenceLessonProps) {
  const grammarHero = getGrammarLessonArtwork("present-perfect");

  return (
    <main className="wvg-reference-lesson" aria-labelledby="grammar-topic-title">
      <header className="wvg-reference-hero">
        <div className="wvg-reference-hero__copy">
          <nav aria-label="Grammar breadcrumb" className="wvg-reference-breadcrumbs">
            <button onClick={onBack} type="button">
              Grammar
            </button>
            <span aria-hidden="true">›</span>
            <span>Tenses &amp; Time</span>
            <span aria-hidden="true">›</span>
            <strong>Present Perfect</strong>
          </nav>
          <h1 id="grammar-topic-title">Present Perfect</h1>
          <p>
            Geçmişte olan bir şeyin sonucu, deneyimi ya da devamı bugün hâlâ önemliyse Present
            Perfect kullanırız.
          </p>
        </div>
        <img
          alt=""
          aria-hidden="true"
          className="wvg-reference-hero__art"
          draggable={false}
          src={grammarHero}
        />
      </header>

      <section className="wvg-reference-grid" aria-label="Present Perfect lesson overview">
        <article className="wvg-reference-card wvg-reference-card--formula">
          <p className="wvg-reference-label">CORE FORMULA · TEMEL YAPI</p>
          <div className="wvg-reference-formula" aria-label="have or has plus past participle V3">
            <strong>have&nbsp; / &nbsp;has</strong>
            <span>+</span>
            <strong>past participle (V<sub>3</sub>)</strong>
          </div>

          <div className="wvg-reference-subjects">
            <div>
              <span className="wvg-reference-subjects__icon" aria-hidden="true">
                <AppIcon name="bookmark" size={16} />
              </span>
              <span>I / You / We / They</span>
              <b>→</b>
              <strong>have + V<sub>3</sub></strong>
            </div>
            <div>
              <span className="wvg-reference-subjects__icon" aria-hidden="true">
                <AppIcon name="bookmark" size={16} />
              </span>
              <span>He / She / It</span>
              <b>→</b>
              <strong>has + V<sub>3</sub></strong>
            </div>
          </div>

          <div className="wvg-reference-mini-examples">
            <span>
              I <strong>have visited</strong> Paris.
            </span>
            <span>
              She has <strong>finished</strong> her homework.
            </span>
          </div>
        </article>

        <article className="wvg-reference-card wvg-reference-card--uses">
          <p className="wvg-reference-label">WHEN TO USE · NE ZAMAN?</p>
          <div className="wvg-reference-use-list">
            {USE_CASES.map((useCase) => (
              <div className="wvg-reference-use" key={useCase.title}>
                <span className="wvg-reference-use__icon" aria-hidden="true">
                  <AppIcon name={useCase.icon} size={17} />
                </span>
                <div>
                  <strong>{useCase.title}</strong>
                  <p>{useCase.body}</p>
                  <small>{useCase.example}</small>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="wvg-reference-card wvg-reference-card--signals">
          <p className="wvg-reference-label">COMMON SIGNAL WORDS · İPUÇLARI</p>
          <div className="wvg-reference-signals">
            {SIGNAL_WORDS.map((word) => (
              <span key={word}>{word}</span>
            ))}
          </div>
        </article>

        <article className="wvg-reference-card wvg-reference-card--compare">
          <p className="wvg-reference-label">PRESENT PERFECT vs. PAST SIMPLE</p>
          <div className="wvg-reference-compare">
            <section className="wvg-reference-compare__side wvg-reference-compare__side--perfect">
              <strong>Present Perfect</strong>
              <p>Bugünle bağlantıya odaklanır.</p>
              <small>I’ve lost my keys.<br />(Sonuç şimdi önemli.)</small>
            </section>
            <span className="wvg-reference-compare__vs" aria-hidden="true">VS.</span>
            <section className="wvg-reference-compare__side wvg-reference-compare__side--simple">
              <strong>Past Simple</strong>
              <p>Bitmiş bir geçmiş zamana odaklanır.</p>
              <small>I lost my keys yesterday.<br />(Zaman belli.)</small>
            </section>
          </div>
        </article>

        <article className="wvg-reference-card wvg-reference-card--examples">
          <p className="wvg-reference-label">EXAMPLES · ÖRNEKLER</p>
          <div className="wvg-reference-example-list">
            {EXAMPLES.map((example) => (
              <div className="wvg-reference-example" key={example.sentence}>
                <span aria-hidden="true">
                  <AppIcon name={example.icon} size={14} />
                </span>
                <strong>{example.sentence}</strong>
                <b>{example.type}</b>
                <p>{example.note}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <aside className="wvg-reference-tip" aria-label="Present Perfect quick rule">
        <span aria-hidden="true">●</span>
        <strong>KISA KURAL</strong>
        <p>Bitmiş bir zaman söylüyorsan Past Simple; cümlenin ayağı bugündeyse Present Perfect.</p>
      </aside>
    </main>
  );
}
