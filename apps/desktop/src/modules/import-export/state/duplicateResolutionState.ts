import type { DuplicateResolutionChoice } from "@platform/domain";

import type { DuplicateCheckResult, DuplicateResolutionPlan } from "../application";

export type DuplicateResolutionState =
  | {
      readonly status: "unchecked";
    }
  | {
      readonly status: "ready";
      readonly result: DuplicateCheckResult;
    }
  | {
      readonly status: "resolved";
      readonly result: DuplicateCheckResult;
      readonly choice: DuplicateResolutionChoice;
      readonly plan: DuplicateResolutionPlan;
    };

export const INITIAL_DUPLICATE_RESOLUTION_STATE: DuplicateResolutionState = Object.freeze({
  status: "unchecked"
});
