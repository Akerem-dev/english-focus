/** Port used by application use cases that copy plain text locally. */
export interface Clipboard {
  writeText(text: string): Promise<void>;
}
