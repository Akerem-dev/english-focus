import { useMemo, useState, type ReactNode } from "react";

import { GrammarPracticeExperience } from "./GrammarPracticeExperience";
import type { GrammarLessonSelection } from "./GrammarCurriculumHome";
import type {
  GrammarTeachingContent,
  GrammarTeachingSectionId
} from "../knowledge/grammarTeachingContent";
import { getA2GrammarTeachingContent } from "../knowledge/grammarTeachingContentA2";
import { getGrammarLessonArtwork } from "../knowledge/grammarLessonArtwork";

import "../../../styles/word-valley-grammar-v15-curated-lesson.css";

interface A2CuratedGrammarLessonProps {
  readonly lesson: GrammarLessonSelection;
  readonly onBack: () => void;
  readonly onMasteryChange: (mastery: number) => void;
  readonly progress: number;
  readonly teachingContent?: GrammarTeachingContent;
}

interface SectionDefinition {
  readonly id: GrammarTeachingSectionId;
  readonly number: number;
  readonly defaultTitle: string;
}

const SECTION_DEFINITIONS: readonly SectionDefinition[] = Object.freeze([
  { id: "formula", number: 1, defaultTitle: "Core Formula" },
  { id: "uses", number: 2, defaultTitle: "When to Use" },
  { id: "examples", number: 3, defaultTitle: "Examples" },
  { id: "comparison", number: 4, defaultTitle: "Compare & Contrast" },
  { id: "mistake", number: 5, defaultTitle: "Common Mistakes" },
  { id: "signals", number: 6, defaultTitle: "Useful Clues" },
  { id: "practice", number: 7, defaultTitle: "Practice" },
  { id: "quick-rule", number: 8, defaultTitle: "Quick Rule" }
]);

function lessonBand(lesson: GrammarLessonSelection): string {
  const [, band] = lesson.shelfTitle.split("·");
  return band?.trim() || "Building Confidence";
}

function sectionTitle(content: GrammarTeachingContent, section: SectionDefinition): string {
  return content.sectionTitles?.[section.id] ?? section.defaultTitle;
}

function SectionPreviewCard({
  children,
  number,
  onOpen,
  title
}: {
  readonly children: ReactNode;
  readonly number: number;
  readonly onOpen: () => void;
  readonly title: string;
}) {
  return (
    <article className="wvg-v15-overview-card">
      <button aria-label={`Open ${title} section`} onClick={onOpen} type="button">
        <span className="wvg-v15-overview-card__number">{number}</span>
        <h2 className="wvg-v15-overview-card__title">{title}</h2>
        <span aria-hidden="true" className="wvg-v15-overview-card__open">
          Open →
        </span>
      </button>
      <div className="wvg-v15-overview-card__body">{children}</div>
    </article>
  );
}

function FormulaSection({ content }: { readonly content: GrammarTeachingContent }) {
  return (
    <div className="wvg-v15-teaching-stack">
      <header className="wvg-v15-section-heading">
        <span>BUILD THE STRUCTURE</span>
        <h2>Understand the form before memorising examples</h2>
        <p>{content.formulaExplanation}</p>
      </header>

      <div className="wvg-v15-formula-banner">{content.formula}</div>

      <div className="wvg-v15-formula-parts">
        {content.formulaParts.map((part, index) => (
          <article key={`${part.label}-${part.value}`}>
            <span>{index + 1}</span>
            <small>{part.label}</small>
            <strong>{part.value}</strong>
            <p>{part.note}</p>
          </article>
        ))}
      </div>

      {content.table === undefined ? null : (
        <div className="wvg-v15-table-wrap">
          <table>
            <thead>
              <tr>
                {content.table.headers.map((header) => (
                  <th key={header} scope="col">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {content.table.rows.map((row, rowIndex) => (
                <tr key={`${rowIndex}-${row.join("-")}`}>
                  {row.map((cell, cellIndex) =>
                    cellIndex === 0 ? (
                      <th key={cell} scope="row">
                        {cell}
                      </th>
                    ) : (
                      <td key={`${cellIndex}-${cell}`}>{cell}</td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <aside className="wvg-v15-memory-callout">
        <strong>Memory hook</strong>
        <p>{content.memoryHook}</p>
      </aside>
    </div>
  );
}

function UsesSection({ content }: { readonly content: GrammarTeachingContent }) {
  return (
    <div className="wvg-v15-teaching-stack">
      <header className="wvg-v15-section-heading">
        <span>MEANING FIRST</span>
        <h2>Choose the structure because of the meaning</h2>
        <p>
          Do not select grammar from one keyword alone. Identify what the speaker wants to mean,
          then build the form.
        </p>
      </header>

      <div className="wvg-v15-use-grid">
        {content.uses.map((use, index) => (
          <article key={use.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h3>{use.title}</h3>
              <p>{use.explanation}</p>
              <blockquote>{use.example}</blockquote>
              {use.translationTr === undefined ? null : <small>TR · {use.translationTr}</small>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ExamplesSection({ content }: { readonly content: GrammarTeachingContent }) {
  return (
    <div className="wvg-v15-teaching-stack">
      <header className="wvg-v15-section-heading">
        <span>SEE THE PATTERN IN REAL SENTENCES</span>
        <h2>Natural examples with the reason underneath</h2>
        <p>Read the sentence, then check exactly what grammatical decision makes it correct.</p>
      </header>

      <div className="wvg-v15-example-list">
        {content.examples.map((example, index) => (
          <article key={`${example.label}-${example.sentence}`}>
            <span>{index + 1}</span>
            <div className="wvg-v15-example-list__sentence">
              <small>{example.label}</small>
              <strong>{example.sentence}</strong>
              {example.translationTr === undefined ? null : <em>{example.translationTr}</em>}
            </div>
            <p>{example.note}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function ComparisonSection({ content }: { readonly content: GrammarTeachingContent }) {
  return (
    <div className="wvg-v15-teaching-stack">
      <header className="wvg-v15-section-heading">
        <span>MAKE THE DECISION EXPLICIT</span>
        <h2>{content.comparison.title}</h2>
        <p>
          Compare meaning and sentence-building side by side instead of memorising isolated forms.
        </p>
      </header>

      <div className="wvg-v15-compare-grid">
        {[content.comparison.left, content.comparison.right].map((side) => (
          <article key={side.label}>
            <small>{side.label}</small>
            <h3>{side.rule}</h3>
            <blockquote>{side.example}</blockquote>
            {side.translationTr === undefined ? null : <p>TR · {side.translationTr}</p>}
          </article>
        ))}
        <span aria-hidden="true">VS</span>
      </div>

      <aside className="wvg-v15-takeaway">
        <strong>Decision rule</strong>
        <p>{content.comparison.takeaway}</p>
      </aside>
    </div>
  );
}

function MistakesSection({ content }: { readonly content: GrammarTeachingContent }) {
  return (
    <div className="wvg-v15-teaching-stack">
      <header className="wvg-v15-section-heading">
        <span>ERROR → REASON → CORRECTION</span>
        <h2>Learn the reason, not only the correction</h2>
        <p>Each error below points to a specific decision you should make differently next time.</p>
      </header>

      <div className="wvg-v15-mistake-list">
        {content.mistakes.map((mistake, index) => (
          <article key={mistake.wrong}>
            <span>{index + 1}</span>
            <div>
              <p className="wvg-v15-mistake-list__wrong">
                <b>×</b> {mistake.wrong}
              </p>
              <p className="wvg-v15-mistake-list__right">
                <b>✓</b> {mistake.right}
              </p>
            </div>
            <p>{mistake.why}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function SignalsSection({ content }: { readonly content: GrammarTeachingContent }) {
  return (
    <div className="wvg-v15-teaching-stack">
      <header className="wvg-v15-section-heading">
        <span>NOTICE RECURRING LANGUAGE</span>
        <h2>{content.signalsLabel}</h2>
        <p>{content.signalsNote}</p>
      </header>

      <div className="wvg-v15-pattern-cloud">
        {content.signals.map((signal) => (
          <span key={signal}>{signal}</span>
        ))}
      </div>

      <aside className="wvg-v15-warning-callout">
        <strong>Important</strong>
        <p>Patterns are clues. Always confirm the intended meaning and the sentence structure.</p>
      </aside>
    </div>
  );
}

function PracticeSection({
  content,
  mastery,
  onMasteryChange
}: {
  readonly content: GrammarTeachingContent;
  readonly mastery: number;
  readonly onMasteryChange: (mastery: number) => void;
}) {
  return (
    <div className="wvg-v15-teaching-stack">
      <header className="wvg-v15-section-heading">
        <span>TRAIN → TEST → PROVE</span>
        <h2>Turn the rule into usable skill</h2>
        <p>
          Guided Practice teaches with feedback, Quick Quiz gives you an objective 0–5 score, and
          Challenge tests whether you can explain why an error is wrong.
        </p>
      </header>

      <GrammarPracticeExperience
        content={content}
        mastery={mastery}
        onMasteryChange={onMasteryChange}
      />
    </div>
  );
}

function QuickRuleSection({ content }: { readonly content: GrammarTeachingContent }) {
  return (
    <div className="wvg-v15-teaching-stack">
      <header className="wvg-v15-section-heading">
        <span>COMPRESS THE LESSON</span>
        <h2>Keep these rules in working memory</h2>
        <p>Use this page as the fast recap after you have studied the earlier sections.</p>
      </header>

      <div className="wvg-v15-rule-list">
        {content.quickRules.map((rule, index) => (
          <article key={rule}>
            <span>{index + 1}</span>
            <p>{rule}</p>
          </article>
        ))}
      </div>

      <aside className="wvg-v15-memory-callout wvg-v15-memory-callout--large">
        <strong>One-line memory hook</strong>
        <p>{content.memoryHook}</p>
      </aside>
    </div>
  );
}

function SectionBody({
  content,
  mastery,
  onMasteryChange,
  sectionId
}: {
  readonly content: GrammarTeachingContent;
  readonly mastery: number;
  readonly onMasteryChange: (mastery: number) => void;
  readonly sectionId: GrammarTeachingSectionId;
}) {
  switch (sectionId) {
    case "formula":
      return <FormulaSection content={content} />;
    case "uses":
      return <UsesSection content={content} />;
    case "examples":
      return <ExamplesSection content={content} />;
    case "comparison":
      return <ComparisonSection content={content} />;
    case "mistake":
      return <MistakesSection content={content} />;
    case "signals":
      return <SignalsSection content={content} />;
    case "practice":
      return (
        <PracticeSection content={content} mastery={mastery} onMasteryChange={onMasteryChange} />
      );
    case "quick-rule":
      return <QuickRuleSection content={content} />;
  }
}

function previewForSection(content: GrammarTeachingContent, sectionId: GrammarTeachingSectionId) {
  switch (sectionId) {
    case "formula":
      return (
        <>
          <strong className="wvg-v15-preview-formula">{content.formula}</strong>
          <p>{content.formulaExplanation}</p>
        </>
      );
    case "uses":
      return (
        <ul>
          {content.uses.slice(0, 3).map((use) => (
            <li key={use.title}>{use.title}</li>
          ))}
        </ul>
      );
    case "examples":
      return (
        <div className="wvg-v15-preview-examples">
          {content.examples.slice(0, 2).map((example) => (
            <span key={example.sentence}>{example.sentence}</span>
          ))}
        </div>
      );
    case "comparison":
      return (
        <p>
          <b>{content.comparison.left.label}</b> vs <b>{content.comparison.right.label}</b>
          <br />
          {content.comparison.takeaway}
        </p>
      );
    case "mistake":
      return (
        <div className="wvg-v15-preview-mistake">
          <span>× {content.mistakes[0]?.wrong}</span>
          <span>✓ {content.mistakes[0]?.right}</span>
        </div>
      );
    case "signals":
      return (
        <div className="wvg-v15-preview-pills">
          {content.signals.slice(0, 6).map((signal) => (
            <span key={signal}>{signal}</span>
          ))}
        </div>
      );
    case "practice":
      return <p>Guided Practice · 5-question Quick Quiz · Challenge · saved mastery</p>;
    case "quick-rule":
      return <p>{content.quickRules[0]}</p>;
  }
}

export function A2CuratedGrammarLesson({
  lesson,
  onBack,
  onMasteryChange,
  progress,
  teachingContent
}: A2CuratedGrammarLessonProps) {
  const content = teachingContent ?? getA2GrammarTeachingContent(lesson.id);
  const artwork = getGrammarLessonArtwork(lesson.sourceLessonId);
  const [selectedSection, setSelectedSection] = useState<GrammarTeachingSectionId | undefined>(
    lesson.initialSection
  );
  const sections = useMemo(
    () =>
      SECTION_DEFINITIONS.map((section) => ({
        ...section,
        title: content === undefined ? section.defaultTitle : sectionTitle(content, section)
      })),
    [content]
  );

  if (content === undefined) return null;

  if (selectedSection !== undefined) {
    const sectionIndex = sections.findIndex((section) => section.id === selectedSection);
    const section = sections[sectionIndex];
    if (section === undefined) return null;

    const previous = sectionIndex > 0 ? sections[sectionIndex - 1] : undefined;
    const next = sectionIndex < sections.length - 1 ? sections[sectionIndex + 1] : undefined;

    return (
      <main
        className="wvg-v15-lesson wvg-v15-lesson--detail"
        aria-labelledby="grammar-section-title"
      >
        <section className="wvg-v15-paper">
          <nav aria-label="Grammar section breadcrumb" className="wvg-v15-breadcrumb">
            <button onClick={() => setSelectedSection(undefined)} type="button">
              ← Lesson overview
            </button>
            <span aria-hidden="true">›</span>
            <span>{lesson.title}</span>
            <span aria-hidden="true">›</span>
            <strong>{section.title}</strong>
          </nav>

          <header className="wvg-v15-detail-hero">
            <img alt="" aria-hidden="true" draggable={false} src={artwork} />
            <span aria-hidden="true" />
            <div>
              <small>
                SECTION {section.number} OF {sections.length}
              </small>
              <h1 id="grammar-section-title">{section.title}</h1>
              <p>{lesson.title}</p>
            </div>
          </header>

          <div className="wvg-v15-detail-layout">
            <aside className="wvg-v15-lesson-map" aria-label="Lesson sections">
              <header>
                <span>LESSON MAP</span>
                <small>
                  {section.number} / {sections.length}
                </small>
              </header>
              {sections.map((item) => (
                <button
                  aria-current={item.id === selectedSection ? "step" : undefined}
                  key={item.id}
                  onClick={() => setSelectedSection(item.id)}
                  type="button"
                >
                  <span>{item.number}</span>
                  <strong>{item.title}</strong>
                </button>
              ))}
            </aside>

            <article className="wvg-v15-section-content">
              <SectionBody
                content={content}
                mastery={progress}
                onMasteryChange={onMasteryChange}
                sectionId={selectedSection}
              />
            </article>
          </div>

          <footer className="wvg-v15-detail-footer">
            <button
              aria-label={previous === undefined ? "Start of lesson" : `← ${previous.title}`}
              disabled={previous === undefined}
              onClick={() => previous !== undefined && setSelectedSection(previous.id)}
              type="button"
            >
              <span>PREVIOUS</span>
              <strong>{previous?.title ?? "Start of lesson"}</strong>
            </button>
            <button onClick={() => setSelectedSection(undefined)} type="button">
              Lesson overview
            </button>
            <button
              aria-label={next === undefined ? "End of lesson" : `${next.title} →`}
              disabled={next === undefined}
              onClick={() => next !== undefined && setSelectedSection(next.id)}
              type="button"
            >
              <span>NEXT</span>
              <strong>{next?.title ?? "End of lesson"}</strong>
            </button>
          </footer>
        </section>
      </main>
    );
  }

  return (
    <main className="wvg-v15-lesson" aria-labelledby="grammar-topic-title">
      <section className="wvg-v15-paper wvg-v15-paper--overview">
        <nav aria-label="Grammar breadcrumb" className="wvg-v15-breadcrumb">
          <button onClick={onBack} type="button">
            ← Grammar
          </button>
          <span aria-hidden="true">›</span>
          <span>{lesson.category}</span>
          <span aria-hidden="true">›</span>
          <strong>{lesson.title}</strong>
        </nav>

        <header className="wvg-v15-overview-hero">
          <img alt="" aria-hidden="true" draggable={false} src={artwork} />
          <span aria-hidden="true" />
          <div>
            <small>{lesson.category.toLocaleUpperCase("en")}</small>
            <h1 id="grammar-topic-title">{lesson.title}</h1>
            <p>{content.intro}</p>
            <div>
              <button
                onClick={() => setSelectedSection(progress > 0 ? "practice" : "formula")}
                type="button"
              >
                {progress > 0 ? "Resume learning →" : "Start lesson →"}
              </button>
              <button onClick={() => setSelectedSection("practice")} type="button">
                {progress >= 5 ? "✓ Mastered · Review" : `Mastery ${progress}/5 · Practice`}
              </button>
            </div>
            <em>
              Level {lesson.level} · {lessonBand(lesson)} · ~15 min · 8 sections
            </em>
          </div>
        </header>

        <div className="wvg-v15-overview-intro">
          <div>
            <span>Lesson map</span>
            <h2>Study in order, or jump straight to what you need.</h2>
          </div>
          <p>
            These cards are short previews, not the full lesson. Open one for the full explanation,
            examples and reasoning.
          </p>
        </div>

        <div className="wvg-v15-overview-grid">
          {sections.map((section) => (
            <SectionPreviewCard
              key={section.id}
              number={section.number}
              onOpen={() => setSelectedSection(section.id)}
              title={section.title}
            >
              {previewForSection(content, section.id)}
            </SectionPreviewCard>
          ))}
        </div>

        <aside className="wvg-v15-overview-memory">
          <span>ONE-LINE MEMORY HOOK</span>
          <strong>{content.memoryHook}</strong>
        </aside>
      </section>
    </main>
  );
}
