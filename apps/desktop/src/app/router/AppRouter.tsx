import { Navigate, Route, Routes } from "react-router-dom";

import { ROUTE_PATHS } from "./routeIds";
import { APP_ROUTES } from "./routes";

export function AppRouter() {
  return (
    <Routes>
      {APP_ROUTES.map((route) => (
        <Route element={route.element} key={route.id} path={route.path} />
      ))}
      <Route element={<Navigate replace to={ROUTE_PATHS.vocabulary} />} path="*" />
    </Routes>
  );
}
