import { useContext } from "react";

import { AssistantContext } from "./AssistantContext";

export function useAssistant() {
  const context = useContext(AssistantContext);

  if (context === undefined) {
    throw new Error("useAssistant must be used inside AssistantProvider.");
  }

  return context;
}
