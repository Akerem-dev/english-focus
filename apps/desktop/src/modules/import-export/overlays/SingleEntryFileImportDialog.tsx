import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { Button, Modal } from "../../../components";
import { AppIcon } from "../../../design-system";
import { MAX_PASTED_JSON_CHARACTERS, parseVocabularyJson } from "../application";

export interface SingleEntryFileImportPayload {
  readonly expectedWord: string;
  readonly fileName: string;
  readonly input: string;
}

export interface SingleEntryFileImportDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onContinue: (payload: SingleEntryFileImportPayload) => void;
}

interface SelectedFileState {
  readonly fileName: string;
  readonly input: string;
  readonly detectedWord?: string | undefined;
  readonly topLevelKeyCount?: number | undefined;
  readonly error?: string | undefined;
}

function isJsonFile(file: File): boolean {
  return file.name.toLocaleLowerCase("en-US").endsWith(".json") || file.type === "application/json";
}

function describeFileSize(size: number): string {
  if (size < 1024) {
    return `${size} bytes`;
  }

  return `${(size / 1024).toFixed(1)} KB`;
}

export function SingleEntryFileImportDialog({
  onClose,
  onContinue,
  open
}: SingleEntryFileImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<SelectedFileState | undefined>();
  const [isReading, setIsReading] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedFile(undefined);
      setIsReading(false);
      if (inputRef.current !== null) {
        inputRef.current.value = "";
      }
    }
  }, [open]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    if (file === undefined) {
      return;
    }

    if (!isJsonFile(file)) {
      setSelectedFile({
        fileName: file.name,
        input: "",
        error: "Choose a .json file containing one vocabulary entry."
      });
      return;
    }

    setIsReading(true);

    try {
      const input = await file.text();

      if (input.length > MAX_PASTED_JSON_CHARACTERS) {
        setSelectedFile({
          fileName: file.name,
          input,
          error: `The file exceeds the ${MAX_PASTED_JSON_CHARACTERS.toLocaleString("en-US")} character safety limit.`
        });
        return;
      }

      const parseResult = parseVocabularyJson(input);

      if (parseResult.kind === "failure") {
        setSelectedFile({ fileName: file.name, input, error: parseResult.message });
        return;
      }

      const detectedWord = parseResult.parsed.detectedWord?.trim();

      if (detectedWord === undefined || detectedWord.length === 0) {
        setSelectedFile({
          fileName: file.name,
          input,
          topLevelKeyCount: parseResult.parsed.topLevelKeys.length,
          error: "The file is valid JSON, but no vocabulary word could be detected."
        });
        return;
      }

      setSelectedFile({
        fileName: file.name,
        input,
        detectedWord,
        topLevelKeyCount: parseResult.parsed.topLevelKeys.length
      });
    } catch (cause) {
      setSelectedFile({
        fileName: file.name,
        input: "",
        error: cause instanceof Error ? cause.message : "The selected file could not be read."
      });
    } finally {
      setIsReading(false);
    }
  }

  const canContinue =
    selectedFile !== undefined &&
    selectedFile.error === undefined &&
    selectedFile.detectedWord !== undefined &&
    selectedFile.input.length > 0;

  return (
    <Modal
      description="Choose one local vocabulary JSON file. English Focus reads it on this device and then opens the same validation, review, duplicate, and persistence workflow used by pasted JSON."
      footer={
        <>
          <Button onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button
            disabled={!canContinue}
            leadingIcon={<AppIcon name="upload" size={17} />}
            onClick={() => {
              if (!canContinue || selectedFile?.detectedWord === undefined) {
                return;
              }

              onContinue({
                expectedWord: selectedFile.detectedWord.toLocaleLowerCase("en-US"),
                fileName: selectedFile.fileName,
                input: selectedFile.input
              });
            }}
            variant="primary"
          >
            Continue to validation
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      title="Import one vocabulary entry"
    >
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
          <AppIcon name="upload" size={28} />
        </span>
        <strong>{selectedFile === undefined ? "Choose a vocabulary JSON file" : "Choose another file"}</strong>
        <small>Single JSON object · local processing · maximum 524,288 characters</small>
      </button>

      {isReading ? (
        <p className="single-entry-file-import__reading" role="status">
          Reading the selected file…
        </p>
      ) : null}

      {selectedFile === undefined ? null : (
        <section
          className="single-entry-file-import__result"
          data-tone={selectedFile.error === undefined ? "success" : "error"}
        >
          <header>
            <span aria-hidden="true">
              <AppIcon name={selectedFile.error === undefined ? "check" : "warning"} size={20} />
            </span>
            <div>
              <h3>{selectedFile.error === undefined ? "File is ready" : "File needs attention"}</h3>
              <p>{selectedFile.fileName}</p>
            </div>
          </header>

          {selectedFile.error === undefined ? (
            <dl>
              <div>
                <dt>Detected word:</dt>
                <dd>{selectedFile.detectedWord}</dd>
              </div>
              <div>
                <dt>JSON keys:</dt>
                <dd>{selectedFile.topLevelKeyCount}</dd>
              </div>
              <div>
                <dt>Text size:</dt>
                <dd>{describeFileSize(selectedFile.input.length)}</dd>
              </div>
              <div>
                <dt>Processing:</dt>
                <dd>Local only</dd>
              </div>
            </dl>
          ) : (
            <p className="single-entry-file-import__error">{selectedFile.error}</p>
          )}
        </section>
      )}
    </Modal>
  );
}
