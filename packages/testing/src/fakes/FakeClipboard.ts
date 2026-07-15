import type { Clipboard } from "@platform/domain";

export class FakeClipboard implements Clipboard {
  private copiedTexts: string[] = [];
  private failure: Error | undefined;

  get lastCopiedText(): string | undefined {
    return this.copiedTexts.at(-1);
  }

  get writes(): readonly string[] {
    return [...this.copiedTexts];
  }

  failWith(error: Error): void {
    this.failure = error;
  }

  async writeText(text: string): Promise<void> {
    if (this.failure !== undefined) {
      throw this.failure;
    }

    this.copiedTexts.push(text);
  }
}
