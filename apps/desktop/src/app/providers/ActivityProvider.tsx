import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import type { ActivityRecord, RecordActivityInput } from "@platform/domain";

import { TauriActivityRepository } from "../../infrastructure/persistence";
import { ACTIVITY_EVENT_NAME, type ActivityEventDetail } from "../../modules/history";
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

export function ActivityProvider({ children }: PropsWithChildren) {
  const repository = useMemo(() => new TauriActivityRepository(), []);
  const [activity, setActivity] = useState<readonly ActivityRecord[]>([]);
  const [status, setStatus] = useState<ActivityStatus>("loading");
  const [error, setError] = useState<string | undefined>();
  const latestRecordSignature = useRef<string | undefined>(undefined);
  const latestRecordTime = useRef(0);
  const latestRecord = useRef<ActivityRecord | undefined>(undefined);

  const refreshActivity = useCallback(async () => {
    setStatus("loading");
    setError(undefined);

    try {
      const listed = await repository.listActivity(MAX_VISIBLE_ACTIVITY);
      setActivity(listed);
      setStatus("ready");
      return listed;
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
    async (input) => {
      const now = Date.now();
      const signature = `${input.kind}:${input.scope}:${input.label}:${input.target ?? ""}`;

      if (
        latestRecordSignature.current === signature &&
        now - latestRecordTime.current < 800 &&
        latestRecord.current !== undefined
      ) {
        return latestRecord.current;
      }

      latestRecordSignature.current = signature;
      latestRecordTime.current = now;
      setStatus("recording");
      setError(undefined);

      const record: RecordActivityInput = {
        ...input,
        id: createActivityId(),
        occurredAt: new Date(now).toISOString()
      };

      try {
        const saved = await repository.recordActivity(record);
        latestRecord.current = saved;
        setActivity((current) =>
          Object.freeze(
            [saved, ...current.filter((item) => item.id !== saved.id)].slice(
              0,
              MAX_VISIBLE_ACTIVITY
            )
          )
        );
        setStatus("ready");
        return saved;
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : "Recent activity could not be recorded.";
        setError(message);
        setStatus("error");
        throw cause;
      }
    },
    [repository]
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
    setStatus("clearing");
    setError(undefined);

    try {
      const cleared = await repository.clearActivity();
      latestRecord.current = undefined;
      latestRecordSignature.current = undefined;
      latestRecordTime.current = 0;
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
  }, [repository]);

  const value = useMemo<ActivityContextValue>(
    () => ({ activity, status, error, refreshActivity, recordActivity, clearActivity }),
    [activity, clearActivity, error, recordActivity, refreshActivity, status]
  );

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}
