import type { UndoableActionOptions } from "./UndoAction";

/**
 * Lightweight in-memory registry used by presentation providers. The application keeps at most one
 * active undo callback per visible toast, so no persistent history is written to SQLite.
 */
export class UndoRegistry {
  private latest: UndoableActionOptions<unknown> | undefined;

  register(action: UndoableActionOptions<unknown>): void {
    this.latest = action;
  }

  clear(): void {
    this.latest = undefined;
  }

  getLatest(): UndoableActionOptions<unknown> | undefined {
    return this.latest;
  }
}
