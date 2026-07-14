export const ROUTE_PATHS = {
  vocabulary: "/",
  library: "/library",
  settings: "/settings"
} as const;

export type AppRouteId = keyof typeof ROUTE_PATHS;
export type AppRoutePath = (typeof ROUTE_PATHS)[AppRouteId];
