import type { PropsWithChildren } from "react";

export function AppContent({ children }: PropsWithChildren) {
  return (
    <main aria-label="Application content" className="app-content" id="main-content" tabIndex={-1}>
      {children}
    </main>
  );
}
