export interface ReportedErrorContext {
  readonly operation: string;
  readonly details?: Readonly<Record<string, string | number | boolean | undefined>> | undefined;
}

/**
 * Development-only local error reporting. Sensitive vocabulary content and personal notes must not
 * be passed through the context object.
 */
export function reportError(cause: unknown, context: ReportedErrorContext): void {
  if (!import.meta.env.DEV) {
    return;
  }

  console.error(`[English Focus] ${context.operation}`, {
    cause,
    details: context.details
  });
}
