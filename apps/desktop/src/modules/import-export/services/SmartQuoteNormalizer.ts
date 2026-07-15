export interface SmartQuoteNormalizationResult {
  readonly text: string;
  readonly changed: boolean;
}

export function normalizeSmartJsonQuotes(input: string): SmartQuoteNormalizationResult {
  const text = input.replace(/[“”]/gu, '"');

  return {
    text,
    changed: text !== input
  };
}
