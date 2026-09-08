import valleyBackground from "../../../assets/background/home-background-static.png";

/**
 * Stage 1 foundation for the Practice feature.
 *
 * The shared Word Valley shell (top bar + sidebar + Wordie) is intentionally NOT
 * duplicated here. AppLayout + SearchCleanShell own that chrome, so every Practice
 * screen can focus only on its center content and stay visually identical to the
 * existing Search / Grammar / Collections sections.
 */
export function PracticePage() {
  return (
    <div className="wvp-page">
      <div
        aria-hidden="true"
        className="wvp-page__scene"
        style={{ backgroundImage: `url("${valleyBackground}")` }}
      />
      <div aria-hidden="true" className="wvp-page__mist" />

      <main aria-label="Practice" className="wvp-shell">
        <section className="wvp-foundation-card">
          <p className="wvp-eyebrow">PRACTICE · WORD VALLEY EXPEDITIONS</p>
          <h1>Practice</h1>
          <p>
            The Practice foundation is ready. The Figma-authored home experience
            will be implemented on top of this shared shell in the next stage.
          </p>
        </section>
      </main>
    </div>
  );
}
