/** Usage registers that may be attached to an entry or a specific meaning. */
export const REGISTERS = [
  "neutral",
  "formal",
  "informal",
  "academic",
  "business",
  "legal",
  "literary",
  "technical",
  "spoken",
  "written",
  "slang",
  "archaic"
] as const;

export type Register = (typeof REGISTERS)[number];
