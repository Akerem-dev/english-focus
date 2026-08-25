import { useContext } from "react";

import { CollectionsContext } from "./CollectionsContext";

export function useCollectionsRepository() {
  const repository = useContext(CollectionsContext);
  if (repository === undefined) {
    throw new Error("useCollectionsRepository must be used inside CollectionsProvider.");
  }
  return repository;
}
