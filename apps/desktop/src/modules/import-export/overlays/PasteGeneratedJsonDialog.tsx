import { useState } from "react";

import { Button, Modal, StatusBadge, TextAreaField } from "../../../components";
import { AppIcon } from "../../../design-system";
import {
  MAX_PASTED_JSON_CHARACTERS,
  parseVocabularyJson,
  type ParseVocabularyJsonResult
} from "../application";

export interface PasteGeneratedJsonDialogProps {
  readonly open: boolean;
  readonly expectedWord: string;
  readonly onClose: () => void;
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
    default:
      return transformation;
  }
}

export function PasteGeneratedJsonDialog({
  expectedWord,
  onClose,
  open
}: PasteGeneratedJsonDialogProps) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ParseVocabularyJsonResult | undefined>();
  const isOverLimit = input.length > MAX_PASTED_JSON_CHARACTERS;
  const detectedWord = result?.kind === "success" ? result.parsed.detectedWord : undefined;
  const inputError = isOverLimit
    ? `The pasted text exceeds the ${MAX_PASTED_JSON_CHARACTERS.toLocaleString("en-US")} character safety limit.`
    : result?.kind === "failure"
      ? result.message
      : undefined;
  const hasWordMismatch =
    detectedWord !== undefined && detectedWord.trim().toLocaleLowerCase("en-US") !== expectedWord;

  function clearInput() {
    setInput("");
    setResult(undefined);
  }

  function checkJsonSyntax() {
    setResult(parseVocabularyJson(input));
  }

  return (
    <Modal
      description={`Paste the JSON generated for “${expectedWord}”. English Focus will clean common wrappers and check JSON syntax locally.`}
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
            onClick={checkJsonSyntax}
            variant="primary"
          >
            Check JSON syntax
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
        <StatusBadge>Schema check next</StatusBadge>
      </div>

      <p className="json-paste-dialog__privacy">
        Nothing is uploaded. Markdown fences and explanatory text around the first JSON object can
        be removed locally before parsing.
      </p>

      <div className="json-paste-dialog__toolbar">
        <p>
          Paste one vocabulary JSON object. The safety limit is{" "}
          {MAX_PASTED_JSON_CHARACTERS.toLocaleString("en-US")} characters.
        </p>
        <Button disabled title="File import arrives with vocabulary-pack ingestion" variant="ghost">
          Import from file
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
          setResult(undefined);
        }}
        placeholder={'{\n  "schemaVersion": "1.0.0",\n  "word": "' + expectedWord + '"\n}'}
        rows={18}
        spellCheck={false}
        value={input}
      />

      {result?.kind === "success" ? (
        <section className="json-paste-result" aria-live="polite" data-tone="success">
          <div className="json-paste-result__heading">
            <span aria-hidden="true" className="json-paste-result__icon">
              <AppIcon name="check" size={18} />
            </span>
            <div>
              <h3>JSON syntax passed</h3>
              <p>
                A top-level object with {result.parsed.topLevelKeys.length} keys was parsed safely.
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
              <dd>Not checked yet</dd>
            </div>
          </dl>

          {result.parsed.transformations.length === 0 ? (
            <p className="json-paste-result__note">No cleanup was needed before parsing.</p>
          ) : (
            <p className="json-paste-result__note">
              Local cleanup: {result.parsed.transformations.map(describeTransformation).join(", ")}.
            </p>
          )}

          {hasWordMismatch ? (
            <p className="json-paste-result__warning" role="alert">
              This object says “{detectedWord}”, but the current request expects “{expectedWord}”.
              The schema and semantic validation checkpoint will block mismatched imports.
            </p>
          ) : null}
        </section>
      ) : null}

      {result === undefined ? (
        <p className="json-paste-dialog__stage-note">
          This checkpoint checks text cleanup, object extraction, size, and JSON syntax only. No
          entry will be saved yet.
        </p>
      ) : null}
    </Modal>
  );
}
