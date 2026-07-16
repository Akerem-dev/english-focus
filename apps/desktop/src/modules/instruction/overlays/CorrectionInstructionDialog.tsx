import { useMemo, useState } from "react";
import type { ImportIssue } from "@platform/domain";

import {
  Button,
  Modal,
  StatusBadge,
  TextAreaField,
  ValidationIssueList
} from "../../../components";
import { AppIcon } from "../../../design-system";
import { useClipboard } from "../../../app/providers";
import { BuildCorrectionInstruction, CopyCorrectionInstruction } from "../application";

export interface CorrectionInstructionDialogProps {
  readonly open: boolean;
  readonly targetWord: string;
  readonly originalJson: string;
  readonly issues: readonly ImportIssue[];
  readonly onBack: () => void;
  readonly onClose: () => void;
}

type CopyState = "idle" | "copying" | "copied" | "error";

export function CorrectionInstructionDialog({
  issues,
  onBack,
  onClose,
  open,
  originalJson,
  targetWord
}: CorrectionInstructionDialogProps) {
  const clipboard = useClipboard();
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const builder = useMemo(() => new BuildCorrectionInstruction(), []);
  const copier = useMemo(
    () => new CopyCorrectionInstruction(clipboard, builder),
    [builder, clipboard]
  );
  const instruction = useMemo(
    () => builder.execute({ issues, originalJson, targetWord }),
    [builder, issues, originalJson, targetWord]
  );

  async function copyInstruction() {
    setCopyState("copying");

    try {
      await copier.execute({ issues, originalJson, targetWord });
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  return (
    <Modal
      description={`Copy this provider-independent repair instruction into the same external AI conversation for “${targetWord}”.`}
      footer={
        <>
          <Button onClick={onClose} variant="ghost">
            Close import
          </Button>
          <Button onClick={onBack} variant="secondary">
            Back to issues
          </Button>
          <Button
            isLoading={copyState === "copying"}
            leadingIcon={<AppIcon name="copy" size={17} />}
            onClick={() => void copyInstruction()}
            variant="primary"
          >
            {copyState === "copied" ? "Copied" : "Copy correction instruction"}
          </Button>
        </>
      }
      onClose={onBack}
      open={open}
      size="large"
      title="Correction instruction"
    >
      <div className="instruction-dialog__metadata" aria-label="Correction metadata">
        <StatusBadge tone="accent">Word: {targetWord}</StatusBadge>
        <StatusBadge
          tone={issues.some((issue) => issue.severity === "error") ? "danger" : "warning"}
        >
          {issues.length} validation issues
        </StatusBadge>
        <StatusBadge>Provider independent</StatusBadge>
      </div>

      <p className="instruction-dialog__privacy">
        Nothing is uploaded. The original JSON, schema paths, semantic checks, quality signals, and
        required schema are combined locally into plain text for your clipboard.
      </p>

      <ValidationIssueList
        heading="Validation issues included in the instruction"
        issues={issues}
      />

      <TextAreaField
        className="instruction-dialog__text correction-instruction-dialog__text"
        helperText={`${instruction.text.length.toLocaleString("en-US")} characters · schema ${instruction.vocabularySchemaVersion}`}
        label="Generated correction instruction"
        readOnly
        rows={16}
        value={instruction.text}
      />

      {copyState === "error" ? (
        <p className="instruction-dialog__error" role="alert">
          Clipboard access failed. Select the instruction text and copy it manually.
        </p>
      ) : null}
      {copyState === "copied" ? (
        <p className="instruction-dialog__success" role="status">
          Correction instruction copied. Paste it into the external AI conversation that produced
          the JSON that needs correction or improvement.
        </p>
      ) : null}
    </Modal>
  );
}
