import { useMemo, useRef, useState, type ChangeEvent } from "react";

import type { SaveVocabularyEntryInput, VocabularyStorageLayer } from "@platform/domain";

import { useFileTransfer, useVocabularyRepository } from "../../../app/providers";
import { Button, Modal, StatusBadge } from "../../../components";
import { AppIcon } from "../../../design-system";
import {
  MAX_VOCABULARY_PACK_CHARACTERS,
  MAX_VOCABULARY_PACK_BYTES,
  parseVocabularyPackJson,
  type VocabularyPackAnalysis,
  type VocabularyPackEntryAnalysis
} from "../application";

type PackStage = "choose" | "review" | "importing" | "summary";
type InvalidEntryStrategy = "skip-invalid" | "block-on-invalid";
type ExistingEntryStrategy = "skip-existing" | "replace-existing";

interface SelectedPack {
  readonly fileName: string;
  readonly input: string;
  readonly analysis?: VocabularyPackAnalysis | undefined;
  readonly error?: string | undefined;
}

interface PackImportSummary {
  readonly added: number;
  readonly replaced: number;
  readonly skippedExisting: number;
  readonly skippedInvalid: number;
  readonly failed: number;
  readonly failures: readonly string[];
}

export interface VocabularyPackImportDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onOpenLibrary: () => void;
}

function describeFileSize(size: number): string {
  if (size < 1024) {
    return `${size} bytes`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function issueSummary(entry: VocabularyPackEntryAnalysis): string {
  const firstIssue = entry.issues[0];
  return firstIssue === undefined
    ? "Unknown validation issue"
    : `${firstIssue.pathText}: ${firstIssue.message}`;
}

export function VocabularyPackImportDialog({
  onClose,
  onOpenLibrary,
  open
}: VocabularyPackImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { reader } = useFileTransfer();
  const { contentSource, saveEntries, storedEntries } = useVocabularyRepository();
  const [stage, setStage] = useState<PackStage>("choose");
  const [selectedPack, setSelectedPack] = useState<SelectedPack | undefined>();
  const [isReading, setIsReading] = useState(false);
  const [invalidStrategy, setInvalidStrategy] = useState<InvalidEntryStrategy>("skip-invalid");
  const [existingStrategy, setExistingStrategy] = useState<ExistingEntryStrategy>("skip-existing");
  const [confirmed, setConfirmed] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0, currentWord: "" });
  const [summary, setSummary] = useState<PackImportSummary | undefined>();

  const analysis = selectedPack?.analysis;
  const existingCount = useMemo(() => {
    if (analysis === undefined) {
      return 0;
    }

    return analysis.entries.filter(
      (item) =>
        item.status === "valid" &&
        item.entry !== undefined &&
        contentSource.getEntryByNormalizedWord(item.entry.normalizedWord) !== undefined
    ).length;
  }, [analysis, contentSource]);

  const canImport =
    analysis !== undefined &&
    analysis.validCount > 0 &&
    confirmed &&
    !(invalidStrategy === "block-on-invalid" && analysis.invalidCount > 0);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (file === undefined) {
      return;
    }

    setIsReading(true);

    try {
      const readResult = await reader.readText(file, {
        allowedExtensions: [".json"],
        allowedMediaTypes: ["application/json"],
        maxBytes: MAX_VOCABULARY_PACK_BYTES
      });

      if (readResult.kind === "failure") {
        setSelectedPack({
          fileName: readResult.fileName,
          input: "",
          error:
            readResult.code === "unsupported-type"
              ? "Choose a .json file exported as an English Focus vocabulary pack."
              : readResult.code === "too-large"
                ? `The file exceeds the ${MAX_VOCABULARY_PACK_BYTES.toLocaleString("en-US")} byte safety limit.`
                : (readResult.message ?? "The selected pack could not be read.")
        });
        return;
      }

      const { fileName, text: input } = readResult.file;
      const result = parseVocabularyPackJson(input);

      if (result.kind === "failure") {
        setSelectedPack({ fileName, input, error: result.message });
        return;
      }

      setSelectedPack({ fileName, input, analysis: result.analysis });
      setStage("review");
    } catch (cause) {
      setSelectedPack({
        fileName: "Unknown file",
        input: "",
        error: cause instanceof Error ? cause.message : "The selected pack could not be read."
      });
    } finally {
      setIsReading(false);
    }
  }

  async function importPack() {
    if (!canImport || analysis === undefined) {
      return;
    }

    setStage("importing");
    setProgress({ completed: 0, total: analysis.entries.length, currentWord: "" });

    let added = 0;
    let replaced = 0;
    let skippedExisting = 0;
    let skippedInvalid = 0;
    let failed = 0;
    const failures: string[] = [];
    const inputs: SaveVocabularyEntryInput[] = [];
    let plannedAdded = 0;
    let plannedReplaced = 0;

    for (const item of analysis.entries) {
      if (item.status === "invalid" || item.entry === undefined) {
        skippedInvalid += 1;
        continue;
      }

      const existingEntry = contentSource.getEntryByNormalizedWord(item.entry.normalizedWord);

      if (existingEntry !== undefined && existingStrategy === "skip-existing") {
        skippedExisting += 1;
        continue;
      }

      const storedRecord = storedEntries.find(
        (record) => record.entry.normalizedWord === item.entry?.normalizedWord
      );
      const layer: VocabularyStorageLayer =
        existingEntry === undefined ? "user" : (storedRecord?.layer ?? "override");
      inputs.push({ entry: item.entry, layer });

      if (existingEntry === undefined) {
        plannedAdded += 1;
      } else {
        plannedReplaced += 1;
      }
    }

    if (inputs.length > 0) {
      setProgress({
        completed: 0,
        total: inputs.length,
        currentWord: `Saving ${inputs.length.toLocaleString("en-US")} validated entries`
      });

      try {
        await saveEntries(inputs);
        added = plannedAdded;
        replaced = plannedReplaced;
      } catch (cause) {
        failed = inputs.length;
        failures.push(
          cause instanceof Error
            ? cause.message
            : "The vocabulary pack transaction could not be saved."
        );
      }
    }

    setProgress({
      completed: inputs.length,
      total: inputs.length,
      currentWord: "Complete"
    });
    setSummary({
      added,
      replaced,
      skippedExisting,
      skippedInvalid,
      failed,
      failures: Object.freeze(failures)
    });
    setStage("summary");
  }

  const closeDisabled = stage === "importing";

  return (
    <Modal
      description="Import a multi-entry English Focus vocabulary pack. Every entry is checked locally before any SQLite write begins."
      footer={
        stage === "choose" ? (
          <Button onClick={onClose} variant="ghost">
            Cancel
          </Button>
        ) : stage === "review" ? (
          <>
            <Button
              onClick={() => {
                setStage("choose");
                setConfirmed(false);
              }}
              variant="ghost"
            >
              Choose another file
            </Button>
            <Button
              disabled={!canImport}
              leadingIcon={<AppIcon name="upload" size={17} />}
              onClick={() => {
                void importPack();
              }}
              variant="primary"
            >
              Import vocabulary pack
            </Button>
          </>
        ) : stage === "summary" ? (
          <>
            <Button onClick={onClose} variant="ghost">
              Close
            </Button>
            <Button onClick={onOpenLibrary} variant="primary">
              Open Library
            </Button>
          </>
        ) : null
      }
      onClose={() => {
        if (!closeDisabled) {
          onClose();
        }
      }}
      open={open}
      size="large"
      title="Import vocabulary pack"
    >
      {stage === "choose" ? (
        <>
          <input
            ref={inputRef}
            accept="application/json,.json"
            className="single-entry-file-import__input"
            onChange={(event) => {
              void handleFileChange(event);
            }}
            type="file"
          />
          <button
            className="single-entry-file-import__dropzone"
            onClick={() => {
              inputRef.current?.click();
            }}
            type="button"
          >
            <span aria-hidden="true">
              <AppIcon name="books" size={30} />
            </span>
            <strong>Choose a vocabulary pack JSON file</strong>
            <small>
              Up to 500 entries · maximum {MAX_VOCABULARY_PACK_CHARACTERS.toLocaleString("en-US")}{" "}
              characters · local processing
            </small>
          </button>
          {isReading ? <p role="status">Reading and analyzing the selected pack…</p> : null}
          {selectedPack?.error === undefined ? null : (
            <section className="vocabulary-pack__error" role="alert">
              <strong>Pack needs attention</strong>
              <p>{selectedPack.error}</p>
            </section>
          )}
        </>
      ) : null}

      {stage === "review" && analysis !== undefined && selectedPack !== undefined ? (
        <div className="vocabulary-pack__review">
          <section className="vocabulary-pack__file-summary">
            <div>
              <p className="route-page__eyebrow">Selected pack</p>
              <h3>{selectedPack.fileName}</h3>
              <p>
                {describeFileSize(selectedPack.input.length)} · created{" "}
                {analysis.document.createdAt}
              </p>
            </div>
            <StatusBadge tone={analysis.invalidCount === 0 ? "success" : "warning"}>
              {analysis.document.entryCount} entries
            </StatusBadge>
          </section>

          <div className="vocabulary-pack__stats">
            <article>
              <span>Structurally valid</span>
              <strong>{analysis.validCount}</strong>
            </article>
            <article>
              <span>Invalid</span>
              <strong>{analysis.invalidCount}</strong>
            </article>
            <article>
              <span>Existing locally</span>
              <strong>{existingCount}</strong>
            </article>
            <article>
              <span>Quality warnings</span>
              <strong>{analysis.warningCount}</strong>
            </article>
          </div>

          {analysis.invalidCount === 0 ? null : (
            <section className="vocabulary-pack__issues">
              <header>
                <h3>Entries needing attention</h3>
                <StatusBadge tone="warning">{analysis.invalidCount}</StatusBadge>
              </header>
              <ul>
                {analysis.entries
                  .filter((item) => item.status === "invalid")
                  .slice(0, 12)
                  .map((item) => (
                    <li key={`${item.index}:${item.detectedWord}`}>
                      <strong>{item.detectedWord}</strong>
                      <span>{issueSummary(item)}</span>
                    </li>
                  ))}
              </ul>
            </section>
          )}

          <div className="vocabulary-pack__strategy-grid">
            <fieldset>
              <legend>Invalid-entry strategy</legend>
              <label>
                <input
                  checked={invalidStrategy === "skip-invalid"}
                  name="pack-invalid-strategy"
                  onChange={() => {
                    setInvalidStrategy("skip-invalid");
                  }}
                  type="radio"
                />
                <span>
                  <strong>Skip invalid entries</strong>
                  <small>
                    Import valid entries and report every skipped record in the summary.
                  </small>
                </span>
              </label>
              <label>
                <input
                  checked={invalidStrategy === "block-on-invalid"}
                  name="pack-invalid-strategy"
                  onChange={() => {
                    setInvalidStrategy("block-on-invalid");
                  }}
                  type="radio"
                />
                <span>
                  <strong>Block the entire import</strong>
                  <small>Require a completely valid pack before any entry can be saved.</small>
                </span>
              </label>
            </fieldset>

            <fieldset>
              <legend>Existing-entry strategy</legend>
              <label>
                <input
                  checked={existingStrategy === "skip-existing"}
                  name="pack-existing-strategy"
                  onChange={() => {
                    setExistingStrategy("skip-existing");
                  }}
                  type="radio"
                />
                <span>
                  <strong>Keep existing entries</strong>
                  <small>
                    Skip matching normalized words already available in the layered library.
                  </small>
                </span>
              </label>
              <label>
                <input
                  checked={existingStrategy === "replace-existing"}
                  name="pack-existing-strategy"
                  onChange={() => {
                    setExistingStrategy("replace-existing");
                  }}
                  type="radio"
                />
                <span>
                  <strong>Replace with pack entries</strong>
                  <small>
                    Save reviewed pack content while user metadata remains stored separately.
                  </small>
                </span>
              </label>
            </fieldset>
          </div>

          <label className="vocabulary-pack__confirmation">
            <input
              checked={confirmed}
              onChange={(event) => {
                setConfirmed(event.currentTarget.checked);
              }}
              type="checkbox"
            />
            <span>
              <strong>I reviewed the pack summary and import strategies.</strong>
              <small>
                No network request will be made. The selected strategy controls local SQLite writes.
              </small>
            </span>
          </label>

          {invalidStrategy === "block-on-invalid" && analysis.invalidCount > 0 ? (
            <p className="vocabulary-pack__blocked-note">
              This strategy blocks import because {analysis.invalidCount} invalid entries remain.
            </p>
          ) : null}
        </div>
      ) : null}

      {stage === "importing" ? (
        <section className="vocabulary-pack__progress" aria-live="polite">
          <span aria-hidden="true">
            <AppIcon name="books" size={30} />
          </span>
          <div>
            <h3>Saving vocabulary pack locally</h3>
            <p>
              {progress.currentWord.length === 0
                ? "Preparing…"
                : `Processing ${progress.currentWord}`}
            </p>
            <progress max={Math.max(progress.total, 1)} value={progress.completed} />
            <small>
              {progress.completed} of {progress.total} analyzed
            </small>
          </div>
        </section>
      ) : null}

      {stage === "summary" && summary !== undefined ? (
        <div className="vocabulary-pack__summary">
          <section className="vocabulary-pack__summary-hero">
            <span aria-hidden="true">
              <AppIcon name={summary.failed === 0 ? "check" : "warning"} size={28} />
            </span>
            <div>
              <h3>
                {summary.failed === 0
                  ? "Vocabulary pack import complete"
                  : "Import completed with save errors"}
              </h3>
              <p>Every result below reflects a completed local decision. No data was uploaded.</p>
            </div>
          </section>
          <dl>
            <div>
              <dt>Added:</dt>
              <dd>{summary.added}</dd>
            </div>
            <div>
              <dt>Replaced:</dt>
              <dd>{summary.replaced}</dd>
            </div>
            <div>
              <dt>Skipped existing:</dt>
              <dd>{summary.skippedExisting}</dd>
            </div>
            <div>
              <dt>Skipped invalid:</dt>
              <dd>{summary.skippedInvalid}</dd>
            </div>
            <div>
              <dt>Save failures:</dt>
              <dd>{summary.failed}</dd>
            </div>
          </dl>
          {summary.failures.length === 0 ? null : (
            <ul className="vocabulary-pack__failure-list">
              {summary.failures.map((failure) => (
                <li key={failure}>{failure}</li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
