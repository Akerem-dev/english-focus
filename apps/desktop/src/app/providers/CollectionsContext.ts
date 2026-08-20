import { createContext } from "react";

export interface PersistedCollection {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly tone: string;
  readonly coverPreset: string;
  readonly coverImage?: string | undefined;
  readonly wordIds: readonly string[];
}

export interface CollectionsState {
  readonly version: 1;
  readonly collections: readonly PersistedCollection[];
}

export interface CollectionsRepository {
  getState(): Promise<CollectionsState | undefined>;
  saveState(state: CollectionsState): Promise<CollectionsState>;
}

export const CollectionsContext = createContext<CollectionsRepository | undefined>(undefined);
