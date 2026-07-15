export class ClipboardError extends Error {
  override readonly name = "ClipboardError";

  constructor(message = "The text could not be copied to the clipboard.", options?: ErrorOptions) {
    super(message, options);
  }
}
