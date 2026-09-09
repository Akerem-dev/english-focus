export const ROUTE_PATHS = {
  vocabulary: "/",
  grammar: "/grammar",
  library: "/library",
  practice: "/practice",
  settings: "/settings"
} as const;

export type AppRouteId = keyof typeof ROUTE_PATHS;
export type AppRoutePath = (typeof ROUTE_PATHS)[AppRouteId];
