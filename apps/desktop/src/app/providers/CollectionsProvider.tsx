import { useMemo, type PropsWithChildren } from "react";

import { TauriCollectionsRepository } from "../../infrastructure/persistence";
import { CollectionsContext, type CollectionsRepository } from "./CollectionsContext";

export function CollectionsProvider({ children }: PropsWithChildren) {
  const repository = useMemo<CollectionsRepository>(() => new TauriCollectionsRepository(), []);

  return <CollectionsContext.Provider value={repository}>{children}</CollectionsContext.Provider>;
}
