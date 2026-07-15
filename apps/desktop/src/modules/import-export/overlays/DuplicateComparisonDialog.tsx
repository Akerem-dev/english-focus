import { useState } from "react";

import type { DuplicateResolutionChoice } from "@platform/domain";

import { Button, Modal, StatusBadge } from "../../../components";
import { AppIcon } from "../../../design-system";
import type { DuplicateCheckResult, DuplicateResolutionPlan } from "../application";

export interface DuplicateComparisonDialogProps {
  readonly open: boolean;
  readonly result: DuplicateCheckResult;
  readonly resolution?: DuplicateResolutionPlan;
  readonly onBack: () => void;
  readonly onClose: () => void;
  readonly onEditJson: () => void;
  readonly onResolve: (choice: DuplicateResolutionChoice) => void;
  readonly onContinueToSave: () => void;
}

interface ResolutionOption {
  readonly choice: DuplicateResolutionChoice;
  readonly label: string;
  readonly detail: string;
}

const RESOLUTION_OPTIONS: readonly ResolutionOption[] = [
  {
    choice: "keep-existing",
    label: "Keep existing",
    detail: "Discard this imported content and leave the current entry unchanged."
  },
  {
    choice: "replace-with-imported",
    label: "Replace with imported",
    detail:
      "Use the reviewed imported content. Favorites, tags, notes, and study state remain separate and preserved."
  },
  {
    choice: "merge-compatible-content",
    label: "Merge compatible content",
    detail:
      "Keep imported meanings and examples, then fill only missing optional supporting sections from the existing entry."
  }
] as const;

function formatLayer(layer: "core" | "user" | "override"): string {
  switch (layer) {
    case "core":
      return "Core vocabulary";
    case "user":
      return "User vocabulary";
    case "override":
      return "User override";
  }
}

export function DuplicateComparisonDialog({
  onBack,
  onClose,
  onEditJson,
  onResolve,
  onContinueToSave,
  open,
  resolution,
  result
}: DuplicateComparisonDialogProps) {
  const [selectedChoice, setSelectedChoice] = useState<DuplicateResolutionChoice | undefined>();

  if (result.kind === "new-entry") {
    return (
      <Modal
        description={`No local entry currently uses “${result.imported.entry.normalizedWord}”. The reviewed content can continue to the persistence checkpoint.`}
        footer={
          <>
            <Button onClick={onClose} variant="ghost">
              Close import
            </Button>
            <Button onClick={onEditJson} variant="secondary">
              Edit JSON
            </Button>
            <Button onClick={onBack} variant="secondary">
              Back to preview
            </Button>
            <Button onClick={onContinueToSave} variant="primary">
              Continue to save
            </Button>
          </>
        }
        onClose={onClose}
        open={open}
        size="large"
        title="No duplicate found"
      >
        <div className="duplicate-check__metadata">
          <StatusBadge tone="accent">Word: {result.imported.entry.word}</StatusBadge>
          <StatusBadge tone="success">New local entry</StatusBadge>
          <StatusBadge>{result.imported.examples} examples</StatusBadge>
        </div>

        <section className="duplicate-check__new-entry">
          <span aria-hidden="true">
            <AppIcon name="check" size={22} />
          </span>
          <div>
            <h3>Ready to save as a new entry</h3>
            <p>
              No normalized-word collision was found in the current read-only core vocabulary
              source. Nothing has been written yet.
            </p>
          </div>
        </section>

        <dl className="duplicate-check__new-summary">
          <div>
            <dt>Primary translation</dt>
            <dd>{result.imported.primaryTranslation}</dd>
          </div>
          <div>
            <dt>CEFR</dt>
            <dd>{result.imported.entry.cefr}</dd>
          </div>
          <div>
            <dt>Meanings</dt>
            <dd>{result.imported.meanings}</dd>
          </div>
          <div>
            <dt>Quality state</dt>
            <dd>Reviewed in this import session</dd>
          </div>
        </dl>
      </Modal>
    );
  }

  const { comparison } = result;
  const selectedOption = RESOLUTION_OPTIONS.find((option) => option.choice === selectedChoice);

  return (
    <Modal
      description={`A local entry for “${comparison.normalizedWord}” already exists. Compare the content and explicitly choose how the later save step should proceed.`}
      footer={
        <>
          <Button onClick={onClose} variant="ghost">
            Close import
          </Button>
          <Button onClick={onEditJson} variant="secondary">
            Edit JSON
          </Button>
          <Button onClick={onBack} variant="secondary">
            Back to preview
          </Button>
          {resolution === undefined ? (
            <Button
              disabled={selectedChoice === undefined}
              leadingIcon={<AppIcon name="check" size={17} />}
              onClick={() => {
                if (selectedChoice !== undefined) {
                  onResolve(selectedChoice);
                }
              }}
              variant="primary"
            >
              Confirm decision
            </Button>
          ) : (
            <Button onClick={onContinueToSave} variant="primary">
              {resolution.shouldPersist ? "Continue to save" : "Finish import"}
            </Button>
          )}
        </>
      }
      onClose={onClose}
      open={open}
      size="large"
      title="Duplicate found"
    >
      <div className="duplicate-check__metadata">
        <StatusBadge tone="accent">Word: {comparison.normalizedWord}</StatusBadge>
        <StatusBadge tone="warning">Existing entry detected</StatusBadge>
        <StatusBadge>{comparison.differingFieldCount} comparison fields differ</StatusBadge>
      </div>

      {resolution === undefined ? (
        <>
          <div className="duplicate-check__columns">
            <section className="duplicate-check__entry-card">
              <div className="duplicate-check__entry-heading">
                <div>
                  <p className="route-page__eyebrow">Existing entry</p>
                  <h3>{comparison.existing.entry.word}</h3>
                  <p>{comparison.existing.primaryTranslation}</p>
                </div>
                <StatusBadge>{formatLayer(comparison.existing.layer)}</StatusBadge>
              </div>
              <dl className="duplicate-check__entry-stats">
                <div>
                  <dt>CEFR</dt>
                  <dd>{comparison.existing.entry.cefr}</dd>
                </div>
                <div>
                  <dt>Meanings</dt>
                  <dd>{comparison.existing.meanings}</dd>
                </div>
                <div>
                  <dt>Examples</dt>
                  <dd>{comparison.existing.examples}</dd>
                </div>
                <div>
                  <dt>Grammar</dt>
                  <dd>{comparison.existing.grammarPatterns}</dd>
                </div>
                <div>
                  <dt>Collocations</dt>
                  <dd>{comparison.existing.collocations}</dd>
                </div>
                <div>
                  <dt>Updated</dt>
                  <dd>{comparison.existing.entry.updatedAt.slice(0, 10)}</dd>
                </div>
              </dl>
            </section>

            <section className="duplicate-check__entry-card" data-imported>
              <div className="duplicate-check__entry-heading">
                <div>
                  <p className="route-page__eyebrow">Imported entry</p>
                  <h3>{comparison.imported.entry.word}</h3>
                  <p>{comparison.imported.primaryTranslation}</p>
                </div>
                <StatusBadge tone="accent">Reviewed import</StatusBadge>
              </div>
              <dl className="duplicate-check__entry-stats">
                <div>
                  <dt>CEFR</dt>
                  <dd>{comparison.imported.entry.cefr}</dd>
                </div>
                <div>
                  <dt>Meanings</dt>
                  <dd>{comparison.imported.meanings}</dd>
                </div>
                <div>
                  <dt>Examples</dt>
                  <dd>{comparison.imported.examples}</dd>
                </div>
                <div>
                  <dt>Grammar</dt>
                  <dd>{comparison.imported.grammarPatterns}</dd>
                </div>
                <div>
                  <dt>Collocations</dt>
                  <dd>{comparison.imported.collocations}</dd>
                </div>
                <div>
                  <dt>Generated</dt>
                  <dd>{comparison.imported.entry.generation.generatedAt.slice(0, 10)}</dd>
                </div>
              </dl>
            </section>
          </div>

          <section className="duplicate-check__field-table" aria-label="Entry comparison">
            <div className="duplicate-check__field-header">
              <span>Field</span>
              <span>Existing</span>
              <span>Imported</span>
              <span>Status</span>
            </div>
            {comparison.fields.map((comparisonField) => (
              <div className="duplicate-check__field-row" key={comparisonField.id}>
                <strong>{comparisonField.label}</strong>
                <span>{comparisonField.existingValue}</span>
                <span>{comparisonField.importedValue}</span>
                <StatusBadge tone={comparisonField.status === "same" ? "success" : "warning"}>
                  {comparisonField.status === "same" ? "Same" : "Different"}
                </StatusBadge>
              </div>
            ))}
          </section>

          <fieldset className="duplicate-check__choices">
            <legend>Choose the duplicate strategy</legend>
            <p>
              Recommendation: <strong>{comparison.recommendation.replaceAll("-", " ")}</strong>. The
              recommendation is advisory; your explicit choice controls the later save plan.
            </p>
            <div className="duplicate-check__choice-grid">
              {RESOLUTION_OPTIONS.map((option) => (
                <label
                  className="duplicate-check__choice"
                  data-selected={selectedChoice === option.choice || undefined}
                  key={option.choice}
                >
                  <input
                    checked={selectedChoice === option.choice}
                    name="duplicate-resolution"
                    onChange={() => {
                      setSelectedChoice(option.choice);
                    }}
                    type="radio"
                    value={option.choice}
                  />
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.detail}</small>
                  </span>
                </label>
              ))}
            </div>
            {selectedOption === undefined ? null : (
              <p className="duplicate-check__selection-note" aria-live="polite">
                Selected: <strong>{selectedOption.label}</strong>
              </p>
            )}
          </fieldset>
        </>
      ) : (
        <section className="duplicate-check__resolved" aria-live="polite">
          <span aria-hidden="true">
            <AppIcon name="check" size={22} />
          </span>
          <div>
            <h3>Duplicate decision recorded</h3>
            <p>{resolution.summary}</p>
            <dl>
              <div>
                <dt>Decision</dt>
                <dd>{resolution.decision.choice.replaceAll("-", " ")}</dd>
              </div>
              <div>
                <dt>Persistence mode</dt>
                <dd>{resolution.persistenceMode}</dd>
              </div>
              <div>
                <dt>User metadata</dt>
                <dd>Preserved separately</dd>
              </div>
              <div>
                <dt>Saved now</dt>
                <dd>No — continue to save confirmation</dd>
              </div>
            </dl>
          </div>
        </section>
      )}
    </Modal>
  );
}
