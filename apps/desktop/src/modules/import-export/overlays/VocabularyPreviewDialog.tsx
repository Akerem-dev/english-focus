import { useState } from "react";

import { Button, Modal, StatusBadge, TagChip } from "../../../components";
import { AppIcon } from "../../../design-system";
import {
  formatPartOfSpeech,
  formatPronunciationVariant,
  formatRegister,
  formatSentenceForm
} from "../../vocabulary/presenters/VocabularyEntryPresenter";
import type { VocabularyImportPreview } from "../application";
import type { PreviewApprovalState } from "../state";

export interface VocabularyPreviewDialogProps {
  readonly open: boolean;
  readonly preview: VocabularyImportPreview;
  readonly approvalState: PreviewApprovalState;
  readonly onApprove: () => void;
  readonly onBack: () => void;
  readonly onClose: () => void;
  readonly onContinue: () => void;
  readonly onEditJson: () => void;
}

type PreviewTab = "overview" | "meanings" | "grammar" | "examples" | "supporting";

const PREVIEW_TABS: readonly { readonly id: PreviewTab; readonly label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "meanings", label: "Meanings" },
  { id: "grammar", label: "Grammar" },
  { id: "examples", label: "Examples" },
  { id: "supporting", label: "Supporting content" }
] as const;

export function VocabularyPreviewDialog({
  approvalState,
  onApprove,
  onBack,
  onClose,
  onContinue,
  onEditJson,
  open,
  preview
}: VocabularyPreviewDialogProps) {
  const [activeTab, setActiveTab] = useState<PreviewTab>("overview");
  const [reviewAcknowledged, setReviewAcknowledged] = useState(false);
  const { entry } = preview;
  const isApproved = approvalState === "approved";

  return (
    <Modal
      description={`Review the validated entry for “${preview.expectedWord}” before it can continue to duplicate handling and local saving.`}
      footer={
        <>
          <Button onClick={onClose} variant="ghost">
            Close import
          </Button>
          <Button onClick={onEditJson} variant="secondary">
            Edit JSON
          </Button>
          <Button onClick={onBack} variant="secondary">
            Back to content checks
          </Button>
          {isApproved ? (
            <>
              <Button disabled leadingIcon={<AppIcon name="check" size={17} />} variant="secondary">
                Preview approved
              </Button>
              <Button onClick={onContinue} variant="primary">
                Continue to duplicate check
              </Button>
            </>
          ) : (
            <Button
              disabled={!reviewAcknowledged}
              leadingIcon={<AppIcon name="check" size={17} />}
              onClick={onApprove}
              variant="primary"
            >
              Approve preview
            </Button>
          )}
        </>
      }
      onClose={onClose}
      open={open}
      size="large"
      title="Review vocabulary entry"
    >
      <div className="vocabulary-preview__metadata" aria-label="Preview metadata">
        <StatusBadge tone="accent">Expected word: {preview.expectedWord}</StatusBadge>
        <StatusBadge>Schema {entry.schemaVersion}</StatusBadge>
        <StatusBadge tone="success">Semantic checks passed</StatusBadge>
        <StatusBadge tone={preview.qualityWarnings.length === 0 ? "success" : "warning"}>
          {preview.qualityWarnings.length === 0
            ? "Quality review clean"
            : `${preview.qualityWarnings.length} advisory warnings`}
        </StatusBadge>
      </div>

      <header className="vocabulary-preview__header">
        <div>
          <p className="route-page__eyebrow">User vocabulary preview</p>
          <h3 className="vocabulary-preview__word">{entry.word}</h3>
          <p className="vocabulary-preview__translation">{preview.primaryTranslation}</p>
        </div>
        <div className="vocabulary-preview__header-badges">
          <StatusBadge tone="accent">CEFR {entry.cefr}</StatusBadge>
          {entry.partsOfSpeech.map((partOfSpeech) => (
            <StatusBadge key={partOfSpeech}>{formatPartOfSpeech(partOfSpeech)}</StatusBadge>
          ))}
          {entry.registers.map((register) => (
            <TagChip key={register}>{formatRegister(register)}</TagChip>
          ))}
        </div>
      </header>

      <nav className="vocabulary-preview__tabs" aria-label="Preview sections">
        {PREVIEW_TABS.map((tab) => (
          <button
            aria-pressed={activeTab === tab.id}
            className="vocabulary-preview__tab"
            data-active={activeTab === tab.id || undefined}
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
            }}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="vocabulary-preview__content">
        {activeTab === "overview" ? (
          <div className="vocabulary-preview__overview">
            <section className="vocabulary-preview__panel">
              <h4>Import readiness</h4>
              <ul className="vocabulary-preview__checklist">
                {preview.checklist.map((item) => (
                  <li key={item.id}>
                    <span aria-hidden="true">
                      <AppIcon name="check" size={16} />
                    </span>
                    <div>
                      <strong>{item.label}</strong>
                      <p>{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="vocabulary-preview__panel">
              <h4>Content summary</h4>
              <dl className="vocabulary-preview__stats">
                <div>
                  <dt>Meanings</dt>
                  <dd>{preview.counts.meanings}</dd>
                </div>
                <div>
                  <dt>Primary examples</dt>
                  <dd>{preview.counts.examples}</dd>
                </div>
                <div>
                  <dt>Grammar patterns</dt>
                  <dd>{preview.counts.grammarPatterns}</dd>
                </div>
                <div>
                  <dt>Collocations</dt>
                  <dd>{preview.counts.collocations}</dd>
                </div>
              </dl>

              <div className="vocabulary-preview__summary-copy">
                <h5>Grammar overview</h5>
                <p>{entry.grammar.summaryTr}</p>
                <p lang="en">{entry.grammar.summaryEn}</p>
              </div>
            </section>

            <section className="vocabulary-preview__panel vocabulary-preview__panel--wide">
              <h4>Pronunciation and provenance</h4>
              <div className="vocabulary-preview__pronunciations">
                {entry.pronunciations.map((pronunciation) => (
                  <article key={`${pronunciation.variant}-${pronunciation.ipa}`}>
                    <StatusBadge>{formatPronunciationVariant(pronunciation.variant)}</StatusBadge>
                    <strong>{pronunciation.ipa}</strong>
                    {pronunciation.syllableBreakdown === undefined ? null : (
                      <span>{pronunciation.syllableBreakdown}</span>
                    )}
                  </article>
                ))}
              </div>
              <dl className="vocabulary-preview__provenance">
                <div>
                  <dt>Source</dt>
                  <dd>{entry.source.sourceLabel ?? entry.source.kind}</dd>
                </div>
                <div>
                  <dt>Generation</dt>
                  <dd>{entry.generation.generatorLabel ?? entry.generation.method}</dd>
                </div>
                <div>
                  <dt>Validation status</dt>
                  <dd>{entry.generation.validationStatus}</dd>
                </div>
                <div>
                  <dt>Generated at</dt>
                  <dd>{entry.generation.generatedAt}</dd>
                </div>
              </dl>
            </section>
          </div>
        ) : null}

        {activeTab === "meanings" ? (
          <ol className="vocabulary-preview__meaning-list">
            {entry.meanings.map((meaning, index) => (
              <li key={meaning.id}>
                <span className="vocabulary-preview__number" aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <div className="vocabulary-preview__row-meta">
                    <strong>{formatPartOfSpeech(meaning.partOfSpeech)}</strong>
                    {meaning.registers.map((register) => (
                      <TagChip key={register}>{formatRegister(register)}</TagChip>
                    ))}
                  </div>
                  <p className="vocabulary-preview__english">{meaning.definitionEn}</p>
                  <p className="vocabulary-preview__turkish">
                    {meaning.translationsTr.join(" · ")}
                  </p>
                  {meaning.usageNoteTr === undefined ? null : <small>{meaning.usageNoteTr}</small>}
                </div>
              </li>
            ))}
          </ol>
        ) : null}

        {activeTab === "grammar" ? (
          <div className="vocabulary-preview__grammar-grid">
            <section className="vocabulary-preview__panel">
              <h4>Grammar patterns</h4>
              {entry.grammar.patterns.length === 0 ? (
                <p className="vocabulary-preview__empty">No reliable grammar pattern supplied.</p>
              ) : (
                <div className="vocabulary-preview__compact-list">
                  {entry.grammar.patterns.map((pattern) => (
                    <article key={pattern.pattern}>
                      <strong>{pattern.pattern}</strong>
                      <p>{pattern.explanationTr}</p>
                      <small>{pattern.explanationEn}</small>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="vocabulary-preview__panel">
              <h4>Tense examples</h4>
              {entry.grammar.tenseExamples.length === 0 ? (
                <p className="vocabulary-preview__empty">No reliable tense examples supplied.</p>
              ) : (
                <div className="vocabulary-preview__compact-list">
                  {entry.grammar.tenseExamples.map((example) => (
                    <article key={`${example.tense}-${example.sentenceEn}`}>
                      <strong>{example.tense}</strong>
                      <p>{example.sentenceEn}</p>
                      <small>{example.translationTr}</small>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="vocabulary-preview__panel">
              <h4>Sentence forms</h4>
              {entry.grammar.sentenceForms.length === 0 ? (
                <p className="vocabulary-preview__empty">No sentence-form examples supplied.</p>
              ) : (
                <div className="vocabulary-preview__compact-list">
                  {entry.grammar.sentenceForms.map((example) => (
                    <article key={`${example.form}-${example.sentenceEn}`}>
                      <strong>{formatSentenceForm(example.form)}</strong>
                      <p>{example.sentenceEn}</p>
                      <small>{example.translationTr}</small>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="vocabulary-preview__panel">
              <h4>Preposition patterns</h4>
              {entry.grammar.prepositionPatterns.length === 0 ? (
                <p className="vocabulary-preview__empty">No preposition pattern supplied.</p>
              ) : (
                <div className="vocabulary-preview__compact-list">
                  {entry.grammar.prepositionPatterns.map((pattern) => (
                    <article key={pattern.pattern}>
                      <strong>{pattern.pattern}</strong>
                      <p>{pattern.explanationTr}</p>
                      <small>{pattern.explanationEn}</small>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}

        {activeTab === "examples" ? (
          <ol className="vocabulary-preview__example-list">
            {entry.examples.map((example, index) => (
              <li key={example.id}>
                <span className="vocabulary-preview__number" aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <p className="vocabulary-preview__english">{example.sentenceEn}</p>
                  <p className="vocabulary-preview__turkish">{example.translationTr}</p>
                  <div className="vocabulary-preview__row-meta">
                    {example.grammarLabel === undefined ? null : (
                      <StatusBadge tone="accent">{example.grammarLabel}</StatusBadge>
                    )}
                    {example.targetForm === undefined ? null : (
                      <StatusBadge>{example.targetForm}</StatusBadge>
                    )}
                    {example.context === undefined ? null : <TagChip>{example.context}</TagChip>}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        ) : null}

        {activeTab === "supporting" ? (
          <div className="vocabulary-preview__supporting-grid">
            <section className="vocabulary-preview__panel">
              <h4>Word family</h4>
              {entry.wordFamily.length === 0 ? (
                <p className="vocabulary-preview__empty">No reliable word-family item supplied.</p>
              ) : (
                <div className="vocabulary-preview__compact-list">
                  {entry.wordFamily.map((item) => (
                    <article key={`${item.normalizedWord}-${item.partOfSpeech}`}>
                      <strong>{item.word}</strong>
                      <p>{item.translationTr ?? item.relation}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="vocabulary-preview__panel">
              <h4>Collocations</h4>
              {entry.collocations.length === 0 ? (
                <p className="vocabulary-preview__empty">No reliable collocation supplied.</p>
              ) : (
                <div className="vocabulary-preview__compact-list">
                  {entry.collocations.map((collocation) => (
                    <article key={collocation.phrase}>
                      <strong>{collocation.phrase}</strong>
                      <p>{collocation.translationTr}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="vocabulary-preview__panel">
              <h4>Related words</h4>
              {entry.relatedWords.length === 0 ? (
                <p className="vocabulary-preview__empty">No reliable related word supplied.</p>
              ) : (
                <div className="vocabulary-preview__compact-list">
                  {entry.relatedWords.map((relatedWord) => (
                    <article key={relatedWord.normalizedWord}>
                      <strong>{relatedWord.word}</strong>
                      <p>{relatedWord.distinctionTr ?? relatedWord.relationship}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="vocabulary-preview__panel">
              <h4>Common mistakes</h4>
              {entry.commonMistakes.length === 0 ? (
                <p className="vocabulary-preview__empty">No reliable common mistake supplied.</p>
              ) : (
                <div className="vocabulary-preview__compact-list">
                  {entry.commonMistakes.map((mistake) => (
                    <article key={mistake.incorrect}>
                      <strong>{mistake.incorrect}</strong>
                      <p>{mistake.correct}</p>
                      <small>{mistake.explanationTr}</small>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="vocabulary-preview__panel vocabulary-preview__panel--wide">
              <h4>Etymology</h4>
              {entry.etymology === undefined ? (
                <p className="vocabulary-preview__empty">
                  No reliable etymology supplied. Leaving it empty is preferred over invention.
                </p>
              ) : (
                <>
                  <p>{entry.etymology.explanationTr}</p>
                  <small>{entry.etymology.explanationEn}</small>
                </>
              )}
            </section>
          </div>
        ) : null}
      </div>

      <section
        className="vocabulary-preview__approval"
        data-approved={isApproved || undefined}
        aria-live="polite"
      >
        {isApproved ? (
          <>
            <span aria-hidden="true">
              <AppIcon name="check" size={20} />
            </span>
            <div>
              <h4>Preview approved</h4>
              <p>
                Approval is recorded only for this in-memory import session. Nothing has been saved
                yet. Continue to the local duplicate check before persistence.
              </p>
            </div>
          </>
        ) : (
          <label className="vocabulary-preview__acknowledgement">
            <input
              checked={reviewAcknowledged}
              onChange={(event) => {
                setReviewAcknowledged(event.currentTarget.checked);
              }}
              type="checkbox"
            />
            <span>
              <strong>I reviewed this vocabulary entry.</strong>
              <small>
                I checked the target word, primary meanings, Turkish translations, and all ten
                example sentences. Quality warnings remain advisory.
              </small>
            </span>
          </label>
        )}
      </section>
    </Modal>
  );
}
