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
      description={`Copy this request, revise “${targetWord}”, and paste the corrected entry back into English Focus.`}
      footer={
        <>
          <Button onClick={onClose} variant="ghost">
            Close
          </Button>
          <Button onClick={onBack} variant="secondary">
            Back
          </Button>
          <Button
            isLoading={copyState === "copying"}
            leadingIcon={<AppIcon name="copy" size={17} />}
            onClick={() => void copyInstruction()}
            variant="primary"
          >
            {copyState === "copied" ? "Copied" : "Copy correction request"}
          </Button>
        </>
      }
      onClose={onBack}
      open={open}
      size="large"
      title="Correction request"
    >
      <div className="instruction-dialog__metadata" aria-label="Correction request summary">
        <StatusBadge tone="accent">Word: {targetWord}</StatusBadge>
        <StatusBadge
          tone={issues.some((issue) => issue.severity === "error") ? "danger" : "warning"}
        >
          {issues.length} {issues.length === 1 ? "item" : "items"} to fix
        </StatusBadge>
        <StatusBadge>Prepared on this device</StatusBadge>
      </div>

      <p className="instruction-dialog__privacy">
        English Focus combines the entry and the detected issues into a clear correction request on
        this device. Nothing is uploaded.
      </p>

      <ValidationIssueList
        heading="Items included in the request"
        issues={issues}
        showTechnicalDetails={false}
      />

      <TextAreaField
        className="instruction-dialog__text correction-instruction-dialog__text"
        helperText={`${instruction.text.length.toLocaleString("en-US")} characters`}
        label="Correction request"
        readOnly
        rows={16}
        value={instruction.text}
      />

      {copyState === "error" ? (
        <p className="instruction-dialog__error" role="alert">
          Clipboard access failed. Select the request text and copy it manually.
        </p>
      ) : null}
      {copyState === "copied" ? (
        <p className="instruction-dialog__success" role="status">
          Correction request copied. Use it to revise the entry, then paste the corrected data back
          here.
        </p>
      ) : null}
    </Modal>
  );
}
