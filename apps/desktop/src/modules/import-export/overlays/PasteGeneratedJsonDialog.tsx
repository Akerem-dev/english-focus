import { useState } from "react";

import { useVocabularyRepository } from "../../../app/providers";
import { Button, Modal, StatusBadge, TextAreaField } from "../../../components";
import { AppIcon } from "../../../design-system";
import { CorrectionInstructionDialog } from "../../instruction";
import {
  MAX_PASTED_JSON_CHARACTERS,
  compareDuplicateEntries,
  inspectVocabularyContent,
  parseVocabularyJson,
  previewVocabularyImport,
  prepareVocabularyPersistence,
  resolveDuplicateEntry,
  validateVocabularySchema,
  type DuplicateCheckResult,
  type DuplicateResolutionPlan,
  type InspectVocabularyContentResult,
  type ParseVocabularyJsonResult,
  type ValidateVocabularySchemaResult,
  type VocabularyImportPreview,
  type VocabularyPersistenceOutcome,
  type VocabularyPersistencePlan
} from "../application";
import type { CorrectionReturnStage, ImportWizardStage, PreviewApprovalState } from "../state";
import { ContentValidationResultDialog } from "./ContentValidationResultDialog";
import { DuplicateComparisonDialog } from "./DuplicateComparisonDialog";
import { ValidationResultDialog } from "./ValidationResultDialog";
import { VocabularyPreviewDialog } from "./VocabularyPreviewDialog";
import {
  VocabularyPersistenceDialog,
  type VocabularyPersistenceStatus
} from "./VocabularyPersistenceDialog";

export interface PasteGeneratedJsonDialogProps {
  readonly open: boolean;
  readonly expectedWord: string;
  readonly initialInput?: string | undefined;
  readonly sourceFileName?: string | undefined;
  readonly onClose: () => void;
  readonly onOpenSavedEntry?: ((word: string) => void) | undefined;
}

function describeTransformation(transformation: string): string {
  switch (transformation) {
    case "trimmed-whitespace":
      return "trimmed whitespace";
    case "removed-byte-order-mark":
      return "removed file marker";
    case "removed-markdown-fence":
      return "removed Markdown fence";
    case "removed-leading-text":
      return "removed text before JSON";
    case "removed-trailing-text":
      return "removed text after JSON";
    case "normalized-line-endings":
      return "normalized line endings";
    case "normalized-smart-quotes":
      return "normalized smart quotes";
    case "repaired-mojibake-text":
      return "repaired broken UTF-8 text";
    default:
      return transformation;
  }
}

export function PasteGeneratedJsonDialog({
  expectedWord,
  initialInput,
  onClose,
  onOpenSavedEntry,
  open,
  sourceFileName
}: PasteGeneratedJsonDialogProps) {
  const { contentSource, saveEntry } = useVocabularyRepository();
  const [input, setInput] = useState(initialInput ?? "");
  const [parseResult, setParseResult] = useState<ParseVocabularyJsonResult | undefined>();
  const [validationResult, setValidationResult] = useState<
    ValidateVocabularySchemaResult | undefined
  >();
  const [contentResult, setContentResult] = useState<InspectVocabularyContentResult | undefined>();
  const [preview, setPreview] = useState<VocabularyImportPreview | undefined>();
  const [previewApproval, setPreviewApproval] = useState<PreviewApprovalState>("pending");
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult | undefined>();
  const [duplicateResolution, setDuplicateResolution] = useState<
    DuplicateResolutionPlan | undefined
  >();
  const [persistencePlan, setPersistencePlan] = useState<VocabularyPersistencePlan | undefined>();
  const [persistenceStatus, setPersistenceStatus] = useState<VocabularyPersistenceStatus>("ready");
  const [persistenceOutcome, setPersistenceOutcome] = useState<
    VocabularyPersistenceOutcome | undefined
  >();
  const [persistenceError, setPersistenceError] = useState<string | undefined>();
  const [stage, setStage] = useState<ImportWizardStage>("paste");
  const [correctionReturnStage, setCorrectionReturnStage] =
    useState<CorrectionReturnStage>("validation");
  const isOverLimit = input.length > MAX_PASTED_JSON_CHARACTERS;
  const parsedJson = parseResult?.kind === "success" ? parseResult.parsed : undefined;
  const detectedWord = parsedJson?.detectedWord;
  const inputError = isOverLimit
    ? `The pasted text exceeds the ${MAX_PASTED_JSON_CHARACTERS.toLocaleString("en-US")} character safety limit.`
    : parseResult?.kind === "failure"
      ? parseResult.message
      : undefined;
  const hasWordMismatch =
    detectedWord !== undefined && detectedWord.trim().toLocaleLowerCase("en-US") !== expectedWord;
  const correctionIssues =
    correctionReturnStage === "validation" && validationResult?.kind === "failure"
      ? validationResult.issues
      : correctionReturnStage === "content"
        ? (contentResult?.allIssues ?? [])
        : [];

  function resetDerivedResults() {
    setParseResult(undefined);
    setValidationResult(undefined);
    setContentResult(undefined);
    setPreview(undefined);
    setPreviewApproval("pending");
    setDuplicateResult(undefined);
    setDuplicateResolution(undefined);
    setPersistencePlan(undefined);
    setPersistenceStatus("ready");
    setPersistenceOutcome(undefined);
    setPersistenceError(undefined);
    setStage("paste");
  }

  function clearInput() {
    setInput("");
    resetDerivedResults();
  }

  function checkJsonSyntax() {
    setParseResult(parseVocabularyJson(input));
    setValidationResult(undefined);
    setContentResult(undefined);
    setPreview(undefined);
    setPreviewApproval("pending");
    setDuplicateResult(undefined);
    setDuplicateResolution(undefined);
    setPersistencePlan(undefined);
    setPersistenceOutcome(undefined);
  }

  function validateSchema() {
    if (parsedJson === undefined) {
      return;
    }

    setValidationResult(validateVocabularySchema(parsedJson.value));
    setContentResult(undefined);
    setPreview(undefined);
    setPreviewApproval("pending");
    setDuplicateResult(undefined);
    setDuplicateResolution(undefined);
    setPersistencePlan(undefined);
    setPersistenceOutcome(undefined);
    setStage("validation");
  }

  function runContentChecks() {
    if (validationResult?.kind !== "success") {
      return;
    }

    setContentResult(inspectVocabularyContent(validationResult.entry, expectedWord));
    setPreview(undefined);
    setPreviewApproval("pending");
    setDuplicateResult(undefined);
    setDuplicateResolution(undefined);
    setPersistencePlan(undefined);
    setPersistenceOutcome(undefined);
    setStage("content");
  }

  function openPreview() {
    if (contentResult?.canContinue !== true) {
      return;
    }

    setPreview(
      previewVocabularyImport(contentResult.entry, expectedWord, contentResult.qualityWarnings)
    );
    setPreviewApproval("pending");
    setDuplicateResult(undefined);
    setDuplicateResolution(undefined);
    setPersistencePlan(undefined);
    setPersistenceOutcome(undefined);
    setStage("preview");
  }

  function openDuplicateCheck() {
    if (preview === undefined || previewApproval !== "approved") {
      return;
    }

    setDuplicateResult(compareDuplicateEntries(contentSource, preview.entry));
    setDuplicateResolution(undefined);
    setStage("duplicate");
  }

  function openPersistence() {
    if (duplicateResult === undefined) {
      return;
    }

    try {
      setPersistencePlan(prepareVocabularyPersistence(duplicateResult, duplicateResolution));
      setPersistenceStatus("ready");
      setPersistenceOutcome(undefined);
      setPersistenceError(undefined);
      setStage("save");
    } catch (cause) {
      setPersistenceError(
        cause instanceof Error ? cause.message : "The persistence plan could not be prepared."
      );
    }
  }

  async function persistVocabularyEntry() {
    if (persistencePlan === undefined) {
      return;
    }

    if (persistencePlan.kind === "keep-existing") {
      setPersistenceOutcome({
        kind: "kept-existing",
        entry: persistencePlan.entry
      });
      setPersistenceStatus("success");
      return;
    }

    setPersistenceStatus("saving");
    setPersistenceError(undefined);

    try {
      const record = await saveEntry({
        entry: persistencePlan.entry,
        layer: persistencePlan.layer
      });
      setPersistenceOutcome({ kind: "saved", record });
      setPersistenceStatus("success");
    } catch (cause) {
      setPersistenceError(
        cause instanceof Error ? cause.message : "The vocabulary entry could not be saved."
      );
      setPersistenceStatus("error");
    }
  }

  if (stage === "validation" && validationResult !== undefined) {
    return (
      <ValidationResultDialog
        expectedWord={expectedWord}
        onClose={onClose}
        onEditJson={() => {
          setStage("paste");
        }}
        onOpenCorrectionInstruction={() => {
          if (validationResult.kind === "failure") {
            setCorrectionReturnStage("validation");
            setStage("correction");
          }
        }}
        onRunContentChecks={runContentChecks}
        open={open}
        result={validationResult}
      />
    );
  }

  if (stage === "content" && contentResult !== undefined) {
    return (
      <ContentValidationResultDialog
        expectedWord={expectedWord}
        onClose={onClose}
        onEditJson={() => {
          setStage("paste");
        }}
        onOpenCorrectionInstruction={() => {
          if (contentResult.allIssues.length > 0) {
            setCorrectionReturnStage("content");
            setStage("correction");
          }
        }}
        onPreview={openPreview}
        open={open}
        result={contentResult}
      />
    );
  }

  if (stage === "preview" && preview !== undefined) {
    return (
      <VocabularyPreviewDialog
        approvalState={previewApproval}
        onApprove={() => {
          setPreviewApproval("approved");
        }}
        onBack={() => {
          setStage("content");
        }}
        onClose={onClose}
        onContinue={openDuplicateCheck}
        onEditJson={() => {
          setPreviewApproval("pending");
          setDuplicateResult(undefined);
          setDuplicateResolution(undefined);
          setStage("paste");
        }}
        open={open}
        preview={preview}
      />
    );
  }

  if (stage === "duplicate" && duplicateResult !== undefined) {
    return (
      <DuplicateComparisonDialog
        onBack={() => {
          setStage("preview");
        }}
        onClose={onClose}
        onEditJson={() => {
          setPreviewApproval("pending");
          setDuplicateResult(undefined);
          setDuplicateResolution(undefined);
          setStage("paste");
        }}
        onResolve={(choice) => {
          if (duplicateResult.kind === "duplicate") {
            setDuplicateResolution(resolveDuplicateEntry(duplicateResult.comparison, choice));
          }
        }}
        onContinueToSave={openPersistence}
        open={open}
        {...(duplicateResolution === undefined ? {} : { resolution: duplicateResolution })}
        result={duplicateResult}
      />
    );
  }

  if (stage === "save" && persistencePlan !== undefined) {
    return (
      <VocabularyPersistenceDialog
        {...(persistenceError === undefined ? {} : { error: persistenceError })}
        {...(persistenceOutcome === undefined ? {} : { outcome: persistenceOutcome })}
        onBack={() => {
          setPersistenceStatus("ready");
          setPersistenceOutcome(undefined);
          setPersistenceError(undefined);
          setStage("duplicate");
        }}
        onClose={onClose}
        onOpenEntry={(word) => {
          onClose();
          onOpenSavedEntry?.(word);
        }}
        onSave={() => {
          void persistVocabularyEntry();
        }}
        open={open}
        plan={persistencePlan}
        status={persistenceStatus}
      />
    );
  }

  if (stage === "correction" && correctionIssues.length > 0 && parsedJson !== undefined) {
    return (
      <CorrectionInstructionDialog
        issues={correctionIssues}
        onBack={() => {
          setStage(correctionReturnStage);
        }}
        onClose={onClose}
        open={open}
        originalJson={parsedJson.cleanedText}
        targetWord={expectedWord}
      />
    );
  }

  return (
    <Modal
      description={`Paste the JSON generated for “${expectedWord}”. English Focus will clean common wrappers, parse it, and validate the versioned vocabulary structure locally.`}
      footer={
        <>
          <Button onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button disabled={input.length === 0} onClick={clearInput} variant="secondary">
            Clear
          </Button>
          <Button
            disabled={isOverLimit}
            leadingIcon={<AppIcon name="check" size={17} />}
            onClick={parsedJson === undefined ? checkJsonSyntax : validateSchema}
            variant="primary"
          >
            {parsedJson === undefined ? "Check JSON syntax" : "Validate schema"}
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      size="large"
      title="Paste generated JSON"
    >
      <div className="json-paste-dialog__metadata" aria-label="JSON import metadata">
        <StatusBadge tone="accent">Expected word: {expectedWord}</StatusBadge>
        <StatusBadge>Local processing</StatusBadge>
        {sourceFileName === undefined ? null : <StatusBadge>File: {sourceFileName}</StatusBadge>}
        <StatusBadge tone={parsedJson === undefined ? "neutral" : "success"}>
          {parsedJson === undefined ? "Syntax check first" : "Schema validation ready"}
        </StatusBadge>
      </div>

      <p className="json-paste-dialog__privacy">
        Nothing is uploaded. Markdown fences and explanatory text around the first JSON object can
        be removed locally before parsing and schema validation.
      </p>

      <div className="json-paste-dialog__toolbar">
        <p>
          Paste one vocabulary JSON object. The safety limit is{" "}
          {MAX_PASTED_JSON_CHARACTERS.toLocaleString("en-US")} characters.
        </p>
        <Button disabled variant="ghost">
          {sourceFileName === undefined ? "Use top-bar Import for files" : `Loaded: ${sourceFileName}`}
        </Button>
      </div>

      <TextAreaField
        autoCapitalize="off"
        autoCorrect="off"
        className="json-paste-dialog__text"
        {...(inputError === undefined ? {} : { error: inputError })}
        helperText={`${input.length.toLocaleString("en-US")} / ${MAX_PASTED_JSON_CHARACTERS.toLocaleString("en-US")} characters`}
        label="Generated vocabulary JSON"
        maxLength={MAX_PASTED_JSON_CHARACTERS + 1}
        onChange={(event) => {
          const nextInput = event.currentTarget.value;
          setInput(nextInput);
          resetDerivedResults();
        }}
        placeholder={'{\n  "schemaVersion": "1.0.0",\n  "word": "' + expectedWord + '"\n}'}
        rows={18}
        spellCheck={false}
        value={input}
      />

      {parsedJson === undefined ? null : (
        <section className="json-paste-result" aria-live="polite" data-tone="success">
          <div className="json-paste-result__heading">
            <span aria-hidden="true" className="json-paste-result__icon">
              <AppIcon name="check" size={18} />
            </span>
            <div>
              <h3>JSON syntax passed</h3>
              <p>
                A top-level object with {parsedJson.topLevelKeys.length} keys was parsed safely.
              </p>
            </div>
          </div>

          <dl className="json-paste-result__summary">
            <div>
              <dt>Detected word</dt>
              <dd>{detectedWord ?? "Not detected"}</dd>
            </div>
            <div>
              <dt>Schema validation</dt>
              <dd>Ready to validate</dd>
            </div>
          </dl>

          {parsedJson.transformations.length === 0 ? (
            <p className="json-paste-result__note">No cleanup was needed before parsing.</p>
          ) : (
            <p className="json-paste-result__note">
              Local cleanup: {parsedJson.transformations.map(describeTransformation).join(", ")}.
            </p>
          )}

          {hasWordMismatch ? (
            <p className="json-paste-result__warning" role="alert">
              This object says “{detectedWord}”, but the current request expects “{expectedWord}”.
              Structural validation can still run; semantic validation will block this mismatch.
            </p>
          ) : null}
        </section>
      )}

      {parseResult === undefined ? (
        <p className="json-paste-dialog__stage-note">
          Syntax must pass before the versioned Zod vocabulary contract can run. No entry will be
          saved yet.
        </p>
      ) : null}
    </Modal>
  );
}
