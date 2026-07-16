import { APP_ROUTES, type AppRouteDefinition } from "./routes";

export function getRouteByPath(pathname: string): AppRouteDefinition {
  return APP_ROUTES.find((route) => route.path === pathname) ?? APP_ROUTES[0];
}
