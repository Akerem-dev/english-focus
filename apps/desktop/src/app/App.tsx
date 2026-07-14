import { HashRouter } from "react-router-dom";

import { AppErrorBoundary } from "./errors/AppErrorBoundary";
import { AppLayout } from "./layout";
import { AppProviders } from "./providers/AppProviders";
import { AppRouter } from "./router";

export function App() {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <HashRouter>
          <AppLayout>
            <AppRouter />
          </AppLayout>
        </HashRouter>
      </AppProviders>
    </AppErrorBoundary>
  );
}
