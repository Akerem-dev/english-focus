import { Component, type ErrorInfo, type ReactNode } from "react";

import { Button, ErrorState } from "../../components";
import { mapErrorToUserMessage, reportError } from "../errors";

export interface RouteErrorBoundaryProps {
  readonly children: ReactNode;
  readonly routeLabel: string;
}

interface RouteErrorBoundaryState {
  readonly cause: unknown | null;
}

export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  public override state: RouteErrorBoundaryState = { cause: null };

  public static getDerivedStateFromError(cause: unknown): RouteErrorBoundaryState {
    return { cause };
  }

  public override componentDidCatch(cause: unknown, info: ErrorInfo): void {
    reportError(cause, {
      operation: "Render application route",
      details: {
        componentStackAvailable: (info.componentStack?.length ?? 0) > 0,
        route: this.props.routeLabel
      }
    });
  }

  private readonly retry = () => {
    this.setState({ cause: null });
  };

  public override render(): ReactNode {
    if (this.state.cause === null) {
      return this.props.children;
    }

    const message = mapErrorToUserMessage(
      this.state.cause,
      `${this.props.routeLabel} could not be displayed.`
    );

    return (
      <section className="route-page route-error-boundary">
        <ErrorState
          actions={
            <>
              <Button onClick={this.retry} variant="primary">
                Try this section again
              </Button>
              <a
                className="button route-error-boundary__link"
                data-size="medium"
                data-variant="secondary"
                href="#/settings"
              >
                Open Diagnostics
              </a>
            </>
          }
          description={`${message.message} Your existing local data was not changed.`}
          title={message.title}
        />
      </section>
    );
  }
}
