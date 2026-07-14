import type { PropsWithChildren } from "react";

import { AppContent } from "./AppContent";
import { AppSidebar } from "./AppSidebar";
import { AppTopBar } from "./AppTopBar";

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="application-frame">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <AppSidebar />
      <div className="application-main">
        <AppTopBar />
        <AppContent>{children}</AppContent>
      </div>
    </div>
  );
}
