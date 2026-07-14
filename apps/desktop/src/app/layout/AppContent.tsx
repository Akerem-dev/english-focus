import type { PropsWithChildren } from "react";

export function AppContent({ children }: PropsWithChildren) {
  return (
    <main className="app-content" id="main-content" tabIndex={-1}>
      {children}
    </main>
  );
}
