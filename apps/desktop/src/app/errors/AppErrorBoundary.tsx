import { Component, type ErrorInfo, type ReactNode } from "react";

import { Button } from "../../components";
import { AppIcon } from "../../design-system";
import { createErrorReference } from "./createErrorReference";
import { reportError } from "./reportError";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  readonly hasError: boolean;
  readonly reference: string | null;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  public override state: AppErrorBoundaryState = {
    hasError: false,
    reference: null
  };

  public static getDerivedStateFromError(cause: unknown): AppErrorBoundaryState {
    return {
      hasError: true,
      reference: createErrorReference(cause)
    };
  }

  public override componentDidCatch(cause: unknown, info: ErrorInfo): void {
    reportError(cause, {
      operation: "Render application shell",
      details: {
        componentStackAvailable: (info.componentStack?.length ?? 0) > 0,
        reference: this.state.reference ?? "EF-UNKNOWN"
      }
    });
  }

  private readonly retryStartup = () => {
    this.setState({ hasError: false, reference: null });
  };

  private readonly reloadApplication = () => {
    window.location.reload();
  };

  public override render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="fatal-error" role="alert">
        <section className="fatal-error__card">
          <span aria-hidden="true" className="fatal-error__icon">
            <AppIcon name="warning" size={28} />
          </span>
          <p className="route-page__eyebrow">Local recovery</p>
          <h1>English Focus could not finish starting.</h1>
          <p>
            Your local vocabulary and backups were not intentionally changed. Retry once, then use
            Diagnostics if the problem continues.
          </p>
          <p className="fatal-error__reference">
            Error reference: <strong>{this.state.reference ?? "EF-UNKNOWN"}</strong>
          </p>
          <div className="fatal-error__actions">
            <Button onClick={this.retryStartup} variant="primary">
              Retry startup
            </Button>
            <Button onClick={this.reloadApplication} variant="secondary">
              Reload application
            </Button>
            <a
              className="button fatal-error__link"
              data-size="medium"
              data-variant="ghost"
              href="#/settings"
            >
              Open Settings &amp; Diagnostics
            </a>
          </div>
        </section>
      </main>
    );
  }
}
