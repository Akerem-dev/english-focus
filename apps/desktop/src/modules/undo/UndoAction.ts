export interface UndoableActionOptions<TResult> {
  readonly perform: () => TResult | Promise<TResult>;
  readonly undo: () => void | Promise<void>;
  readonly successTitle: string;
  readonly successMessage?: string | undefined;
  readonly undoSuccessTitle?: string | undefined;
  readonly undoSuccessMessage?: string | undefined;
  readonly failureTitle?: string | undefined;
  readonly undoFailureTitle?: string | undefined;
}
