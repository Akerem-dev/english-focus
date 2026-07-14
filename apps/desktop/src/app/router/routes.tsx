import type { ReactElement } from "react";

import type { AppIconName } from "../../design-system";
import { LibraryPage } from "../../modules/library/pages";
import { SettingsPage } from "../../modules/settings/pages";
import { VocabularyPage } from "../../modules/vocabulary/pages";
import { ROUTE_PATHS, type AppRouteId, type AppRoutePath } from "./routeIds";

export interface AppRouteDefinition {
  readonly id: AppRouteId;
  readonly path: AppRoutePath;
  readonly label: string;
  readonly title: string;
  readonly icon: AppIconName;
  readonly element: ReactElement;
}

export const APP_ROUTES = [
  {
    id: "vocabulary",
    path: ROUTE_PATHS.vocabulary,
    label: "Vocabulary",
    title: "Vocabulary",
    icon: "book-open",
    element: <VocabularyPage />
  },
  {
    id: "library",
    path: ROUTE_PATHS.library,
    label: "Library",
    title: "Library",
    icon: "books",
    element: <LibraryPage />
  },
  {
    id: "settings",
    path: ROUTE_PATHS.settings,
    label: "Settings",
    title: "Settings",
    icon: "settings",
    element: <SettingsPage />
  }
] as const satisfies readonly AppRouteDefinition[];

export function getRouteByPath(pathname: string): AppRouteDefinition {
  return APP_ROUTES.find((route) => route.path === pathname) ?? APP_ROUTES[0];
}
