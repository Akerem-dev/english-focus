import { useMemo, useState } from "react";

import { Button, Modal, StatusBadge, TextAreaField } from "../../../components";
import { AppIcon } from "../../../design-system";
import { TauriClipboard } from "../../../infrastructure/clipboard";
import { useInstructionPreferences } from "../../../app/providers";
import { BuildVocabularyInstruction, CopyVocabularyInstruction } from "../application";

export interface AiInstructionDialogProps {
  readonly open: boolean;
  readonly targetWord: string;
  readonly onClose: () => void;
}

type CopyState = "idle" | "copying" | "copied" | "error";

export function AiInstructionDialog({ onClose, open, targetWord }: AiInstructionDialogProps) {
  const { preferences } = useInstructionPreferences();
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const builder = useMemo(() => new BuildVocabularyInstruction(), []);
  const copier = useMemo(
    () => new CopyVocabularyInstruction(new TauriClipboard(), builder),
    [builder]
  );
  const instruction = useMemo(
    () => builder.execute({ targetWord, preferences }),
    [builder, preferences, targetWord]
  );

  async function copyInstruction() {
    setCopyState("copying");

    try {
      await copier.execute({ targetWord, preferences });
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  return (
    <Modal
      description={`Copy this structured instruction into your own AI account to generate a JSON entry for “${targetWord}”.`}
      footer={
        <>
          <Button onClick={onClose} variant="ghost">
            Close
          </Button>
          <Button
            isLoading={copyState === "copying"}
            leadingIcon={<AppIcon name="copy" size={17} />}
            onClick={() => void copyInstruction()}
            variant="primary"
          >
            {copyState === "copied" ? "Copied" : "Copy instruction"}
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      size="large"
      title="AI instruction"
    >
      <div className="instruction-dialog__metadata" aria-label="Instruction metadata">
        <StatusBadge tone="accent">Word: {targetWord}</StatusBadge>
        <StatusBadge>Turkish explanations</StatusBadge>
        <StatusBadge>Exactly 10 examples</StatusBadge>
        <StatusBadge>{preferences.targetProficiency.toUpperCase()} target</StatusBadge>
        <StatusBadge>{preferences.detailLevel} detail</StatusBadge>
      </div>
      <p className="instruction-dialog__privacy">
        English Focus does not send this word or instruction anywhere. Copying places plain text on
        your local clipboard only.
      </p>
      <TextAreaField
        className="instruction-dialog__text"
        helperText={`${instruction.text.length.toLocaleString("en-US")} characters · schema ${instruction.vocabularySchemaVersion} · provider independent`}
        label="Generated instruction"
        readOnly
        rows={18}
        value={instruction.text}
      />
      {copyState === "error" ? (
        <p className="instruction-dialog__error" role="alert">
          Clipboard access failed. Select the instruction text and copy it manually.
        </p>
      ) : null}
      {copyState === "copied" ? (
        <p className="instruction-dialog__success" role="status">
          Instruction copied. Paste it into your preferred external AI account.
        </p>
      ) : null}
    </Modal>
  );
}
