import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import type { ActivityRecord } from "@platform/domain";

import { TauriActivityRepository } from "../../infrastructure/persistence";
import {
  ACTIVITY_EVENT_NAME,
  ActivityWriteCoordinator,
  type ActivityEventDetail
} from "../../modules/history";
import { ActivityContext, type ActivityContextValue, type ActivityStatus } from "./ActivityContext";

const MAX_VISIBLE_ACTIVITY = 100;
let fallbackActivitySequence = 0;

function createActivityId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  fallbackActivitySequence += 1;
  return `activity-${Date.now()}-${fallbackActivitySequence}`;
}

function orderActivity(records: readonly ActivityRecord[]): readonly ActivityRecord[] {
  return Object.freeze(
    [...records].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
  );
}

export function ActivityProvider({ children }: PropsWithChildren) {
  const repository = useMemo(() => new TauriActivityRepository(), []);
  const writeCoordinator = useMemo(() => new ActivityWriteCoordinator(createActivityId), []);
  const [activity, setActivity] = useState<readonly ActivityRecord[]>([]);
  const [status, setStatus] = useState<ActivityStatus>("loading");
  const [error, setError] = useState<string | undefined>();
  const recordSequence = useRef(0);

  const refreshActivity = useCallback(async () => {
    setStatus("loading");
    setError(undefined);

    try {
      const result = await repository.listActivity(MAX_VISIBLE_ACTIVITY);
      setActivity(orderActivity(result.records));
      setError(
        result.skippedCount > 0
          ? `${result.skippedCount} older activity ${
              result.skippedCount === 1 ? "record" : "records"
            } could not be shown.`
          : undefined
      );
      setStatus("ready");
      return result.records;
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Recent activity could not be loaded.";
      setError(message);
      setStatus("error");
      throw cause;
    }
  }, [repository]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshActivity().catch(() => undefined);
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [refreshActivity]);

  const recordActivity = useCallback<ActivityContextValue["recordActivity"]>(
    (input) => {
      const sequence = recordSequence.current + 1;
      recordSequence.current = sequence;
      setStatus("recording");
      setError(undefined);

      const operation = writeCoordinator
        .record(input, (record) => repository.recordActivity(record))
        .then(
          (saved) => {
            setActivity((current) =>
              orderActivity(
                [saved, ...current.filter((item) => item.id !== saved.id)].slice(
                  0,
                  MAX_VISIBLE_ACTIVITY
                )
              )
            );

            if (recordSequence.current === sequence) {
              setStatus("ready");
            }

            return saved;
          },
          (cause: unknown) => {
            if (recordSequence.current === sequence) {
              const message =
                cause instanceof Error ? cause.message : "Recent activity could not be recorded.";
              setError(message);
              setStatus("error");
            }

            throw cause;
          }
        );

      void operation.catch(() => undefined);
      return operation;
    },
    [repository, writeCoordinator]
  );

  useEffect(() => {
    const handleActivity = (event: Event) => {
      const detail = (event as CustomEvent<ActivityEventDetail>).detail;
      if (detail === undefined) {
        return;
      }

      void recordActivity(detail).catch(() => {
        // Activity history must never block the user's primary action.
      });
    };

    window.addEventListener(ACTIVITY_EVENT_NAME, handleActivity);
    return () => {
      window.removeEventListener(ACTIVITY_EVENT_NAME, handleActivity);
    };
  }, [recordActivity]);

  const clearActivity = useCallback(async () => {
    recordSequence.current += 1;
    setStatus("clearing");
    setError(undefined);

    try {
      await writeCoordinator.whenIdle();
      const cleared = await repository.clearActivity();
      writeCoordinator.clear();
      setActivity([]);
      setStatus("ready");
      return cleared;
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Recent activity could not be cleared.";
      setError(message);
      setStatus("error");
      throw cause;
    }
  }, [repository, writeCoordinator]);

  const value = useMemo<ActivityContextValue>(
    () => ({ activity, status, error, refreshActivity, recordActivity, clearActivity }),
    [activity, clearActivity, error, recordActivity, refreshActivity, status]
  );

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}
