export type ImportWizardStage =
  "paste" | "validation" | "content" | "correction" | "preview" | "duplicate";

export type CorrectionReturnStage = "validation" | "content";
export type PreviewApprovalState = "pending" | "approved";

export interface ImportWizardState {
  readonly stage: ImportWizardStage;
  readonly correctionReturnStage: CorrectionReturnStage;
  readonly previewApproval: PreviewApprovalState;
}

export const INITIAL_IMPORT_WIZARD_STATE: ImportWizardState = Object.freeze({
  stage: "paste",
  correctionReturnStage: "validation",
  previewApproval: "pending"
});

export function resetPreviewApproval(): PreviewApprovalState {
  return "pending";
}
