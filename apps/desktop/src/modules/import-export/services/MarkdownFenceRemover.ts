export interface MarkdownFenceRemovalResult {
  readonly text: string;
  readonly removed: boolean;
  readonly language?: string;
}

const COMPLETE_FENCE_PATTERN = /^\s*```([\w-]*)\s*\r?\n([\s\S]*?)\r?\n```\s*$/u;

export function removeMarkdownFence(input: string): MarkdownFenceRemovalResult {
  const match = COMPLETE_FENCE_PATTERN.exec(input);

  if (match === null) {
    return { text: input, removed: false };
  }

  const language = match[1]?.trim();
  const text = match[2] ?? "";

  return language === undefined || language.length === 0
    ? { text, removed: true }
    : { text, removed: true, language };
}
