import { AppErrorBoundary } from "./errors/AppErrorBoundary";
import { AppProviders } from "./providers/AppProviders";
import { RuntimeBaseline } from "./runtime";

export function App() {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <RuntimeBaseline />
      </AppProviders>
    </AppErrorBoundary>
  );
}
