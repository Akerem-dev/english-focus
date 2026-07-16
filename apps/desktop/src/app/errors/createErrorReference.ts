function hashText(value: string): number {
  let hash = 2166136261;

  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function createErrorReference(cause: unknown, timestamp = Date.now()): string {
  const safeKind = cause instanceof Error ? cause.name : typeof cause;
  const hash = hashText(`${safeKind}:${timestamp}`).toString(36).toUpperCase().padStart(7, "0");
  return `EF-${hash.slice(0, 7)}`;
}
