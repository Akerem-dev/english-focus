export const ASSISTANT_REQUEST_EVENT = "english-focus:assistant-request";

export type AssistantRequestKind = "wake" | "open";

export interface AssistantRequestDetail {
  readonly kind: AssistantRequestKind;
  readonly word?: string;
}

export function dispatchAssistantRequest(detail: AssistantRequestDetail): void {
  window.dispatchEvent(
    new CustomEvent<AssistantRequestDetail>(ASSISTANT_REQUEST_EVENT, {
      detail
    })
  );
}
