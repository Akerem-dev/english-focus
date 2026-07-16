export interface LocalTextFileReadOptions {
  readonly allowedExtensions: readonly string[];
  readonly allowedMediaTypes: readonly string[];
  readonly maxBytes: number;
}

export interface LocalTextFileContent {
  readonly fileName: string;
  readonly mediaType: string;
  readonly sizeBytes: number;
  readonly text: string;
}

export type LocalTextFileReadFailureCode =
  "invalid-source" | "unsupported-type" | "too-large" | "read-failed";

export type LocalTextFileReadResult =
  | { readonly kind: "success"; readonly file: LocalTextFileContent }
  | {
      readonly kind: "failure";
      readonly code: LocalTextFileReadFailureCode;
      readonly fileName: string;
      readonly sizeBytes?: number | undefined;
      readonly message?: string | undefined;
    };

export interface LocalTextFileReader {
  readText(source: unknown, options: LocalTextFileReadOptions): Promise<LocalTextFileReadResult>;
}

export interface LocalTextFileExporter {
  saveText(fileName: string, text: string, mediaType: string): Promise<void>;
}
