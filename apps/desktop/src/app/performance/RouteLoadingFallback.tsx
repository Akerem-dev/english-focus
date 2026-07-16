import { LoadingSkeleton } from "../../components";

export interface RouteLoadingFallbackProps {
  readonly routeLabel: string;
}

export function RouteLoadingFallback({ routeLabel }: RouteLoadingFallbackProps) {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      className="route-page route-loading-state"
      role="status"
    >
      <p className="route-page__eyebrow">English Focus</p>
      <h1>Loading {routeLabel}</h1>
      <p>Your local data stays available while this section is prepared.</p>
      <LoadingSkeleton
        className="route-loading-state__skeleton"
        label={`Loading ${routeLabel}`}
        lines={5}
      />
    </section>
  );
}
