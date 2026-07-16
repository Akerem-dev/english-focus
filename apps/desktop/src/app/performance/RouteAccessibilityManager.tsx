import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import { getRouteByPath } from "../router";

export function getDocumentTitle(routeTitle: string): string {
  return `${routeTitle} — English Focus`;
}

export function RouteAccessibilityManager() {
  const location = useLocation();
  const previousPathRef = useRef<string | undefined>(undefined);
  const route = getRouteByPath(location.pathname);

  useEffect(() => {
    document.title = getDocumentTitle(route.title);

    const previousPath = previousPathRef.current;
    previousPathRef.current = location.pathname;

    if (previousPath === undefined || previousPath === location.pathname) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      document.getElementById("main-content")?.focus({ preventScroll: true });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [location.pathname, route.title]);

  return (
    <p aria-atomic="true" aria-live="polite" className="visually-hidden">
      {route.title} page loaded
    </p>
  );
}
