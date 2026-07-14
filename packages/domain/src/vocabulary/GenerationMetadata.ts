export const GENERATION_METHODS = ["core-pack", "external-ai", "manual", "migration"] as const;
export const CONTENT_VALIDATION_STATUSES = [
  "unvalidated",
  "schema-valid",
  "validated",
  "reviewed"
] as const;

export type GenerationMethod = (typeof GENERATION_METHODS)[number];
export type ContentValidationStatus = (typeof CONTENT_VALIDATION_STATUSES)[number];

export interface GenerationMetadata {
  method: GenerationMethod;
  generatedAt: string;
  validationStatus: ContentValidationStatus;
  generatorLabel?: string | undefined;
  warnings: readonly string[];
}
