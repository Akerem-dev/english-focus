import type { ActivityKind, ActivityScope } from "@platform/domain";

export const ACTIVITY_EVENT_NAME = "english-focus:activity";

export interface ActivityEventDetail {
  readonly kind: ActivityKind;
  readonly scope: ActivityScope;
  readonly label: string;
  readonly target?: string | undefined;
}

export function publishActivity(detail: ActivityEventDetail): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<ActivityEventDetail>(ACTIVITY_EVENT_NAME, { detail }));
}
