import { lazy, Suspense, type ReactElement } from "react";

import type { AppIconName } from "../../design-system";
import { RouteErrorBoundary, RouteLoadingFallback } from "../performance";
import { LibraryRouteFrame } from "./LibraryRouteFrame";
import { ROUTE_PATHS, type AppRouteId, type AppRoutePath } from "./routeIds";

const VocabularyPage = lazy(async () => {
  const module = await import("../../modules/vocabulary/pages");
  return { default: module.VocabularyPage };
});

const LibraryPage = lazy(async () => {
  const module = await import("../../modules/library/pages");
  return { default: module.LibraryPage };
});

const SettingsPage = lazy(async () => {
  const module = await import("../../modules/settings/pages");
  return { default: module.SettingsPage };
});

export interface AppRouteDefinition {
  readonly id: AppRouteId;
  readonly path: AppRoutePath;
  readonly label: string;
  readonly title: string;
  readonly icon: AppIconName;
  readonly element: ReactElement;
}

function createRouteElement(routeLabel: string, page: ReactElement): ReactElement {
  return (
    <RouteErrorBoundary routeLabel={routeLabel}>
      <Suspense fallback={<RouteLoadingFallback routeLabel={routeLabel} />}>{page}</Suspense>
    </RouteErrorBoundary>
  );
}

export const APP_ROUTES = [
  {
    id: "vocabulary",
    path: ROUTE_PATHS.vocabulary,
    label: "Vocabulary",
    title: "Vocabulary",
    icon: "book-open",
    element: createRouteElement("Vocabulary", <VocabularyPage />)
  },
  {
    id: "library",
    path: ROUTE_PATHS.library,
    label: "Library",
    title: "Library",
    icon: "books",
    element: <LibraryRouteFrame>{createRouteElement("Library", <LibraryPage />)}</LibraryRouteFrame>
  },
  {
    id: "settings",
    path: ROUTE_PATHS.settings,
    label: "Settings",
    title: "Settings",
    icon: "settings",
    element: createRouteElement("Settings", <SettingsPage />)
  }
] as const satisfies readonly AppRouteDefinition[];
