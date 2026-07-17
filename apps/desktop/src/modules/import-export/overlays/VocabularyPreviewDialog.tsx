import { useState } from "react";

import { Button, CefrBadge, Modal, StatusBadge, TagChip } from "../../../components";
import { AppIcon } from "../../../design-system";
import {
  formatPartOfSpeech,
  formatPronunciationVariant,
  formatRegister
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

type PreviewTab = "overview" | "meanings" | "examples" | "details";

const PREVIEW_TABS: readonly { readonly id: PreviewTab; readonly label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "meanings", label: "Meanings" },
  { id: "examples", label: "Examples" },
  { id: "details", label: "Details" }
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
          <CefrBadge level={entry.cefr} />
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
                  <dt>Pronunciations</dt>
                  <dd>{entry.pronunciations.length}</dd>
                </div>
                <div>
                  <dt>Word forms</dt>
                  <dd>{entry.morphology.inflectedForms.length}</dd>
                </div>
              </dl>

              <div className="vocabulary-preview__summary-copy">
                <h5>Usage overview</h5>
                <p>{entry.grammar.summaryTr}</p>
                <p lang="en">{entry.grammar.summaryEn}</p>
              </div>
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

        {activeTab === "details" ? (
          <div className="vocabulary-preview__supporting-grid">
            <section className="vocabulary-preview__panel">
              <h4>Pronunciation</h4>
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
            </section>

            <section className="vocabulary-preview__panel">
              <h4>Word forms</h4>
              <div className="vocabulary-preview__compact-list">
                <article>
                  <strong>{entry.morphology.baseForm}</strong>
                  <p>Base form</p>
                </article>
                {entry.morphology.inflectedForms.map((form) => (
                  <article key={`${form.type}-${form.normalizedForm}`}>
                    <strong>{form.form}</strong>
                    <p>{form.type}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="vocabulary-preview__panel vocabulary-preview__panel--wide">
              <h4>Etymology</h4>
              {entry.etymology === undefined ? (
                <p className="vocabulary-preview__empty">No reliable etymology supplied.</p>
              ) : (
                <>
                  <p>{entry.etymology.explanationTr}</p>
                  <small>{entry.etymology.explanationEn}</small>
                </>
              )}
            </section>

            <section className="vocabulary-preview__panel vocabulary-preview__panel--wide">
              <h4>Source and validation</h4>
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
                I checked the target word, primary meanings, Turkish translations, and all three
                example sentences. Quality warnings remain advisory.
              </small>
            </span>
          </label>
        )}
      </section>
    </Modal>
  );
}
