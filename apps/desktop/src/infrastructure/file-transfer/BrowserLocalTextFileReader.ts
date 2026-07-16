import type {
  LocalTextFileReader,
  LocalTextFileReadOptions,
  LocalTextFileReadResult
} from "@platform/domain";

function hasAllowedType(file: File, options: LocalTextFileReadOptions): boolean {
  const lowerName = file.name.toLocaleLowerCase("en-US");
  return (
    options.allowedExtensions.some((extension) => lowerName.endsWith(extension)) ||
    options.allowedMediaTypes.includes(file.type)
  );
}

export class BrowserLocalTextFileReader implements LocalTextFileReader {
  async readText(
    source: unknown,
    options: LocalTextFileReadOptions
  ): Promise<LocalTextFileReadResult> {
    if (!(source instanceof File)) {
      return { kind: "failure", code: "invalid-source", fileName: "Unknown file" };
    }

    if (!hasAllowedType(source, options)) {
      return { kind: "failure", code: "unsupported-type", fileName: source.name };
    }

    if (source.size > options.maxBytes) {
      return {
        kind: "failure",
        code: "too-large",
        fileName: source.name,
        sizeBytes: source.size
      };
    }

    try {
      return {
        kind: "success",
        file: {
          fileName: source.name,
          mediaType: source.type,
          sizeBytes: source.size,
          text: await source.text()
        }
      };
    } catch (cause) {
      return {
        kind: "failure",
        code: "read-failed",
        fileName: source.name,
        message: cause instanceof Error ? cause.message : undefined
      };
    }
  }
}
