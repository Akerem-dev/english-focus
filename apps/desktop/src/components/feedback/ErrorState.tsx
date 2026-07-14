import type { ReactNode } from "react";

import { AppIcon } from "../../design-system";
import { joinClassNames } from "../componentUtils";

export interface ErrorStateProps {
  readonly title: string;
  readonly description: string;
  readonly actions?: ReactNode;
  readonly className?: string;
}

export function ErrorState({ actions, className, description, title }: ErrorStateProps) {
  return (
    <section className={joinClassNames("error-state", className)} role="alert">
      <span aria-hidden="true" className="error-state__icon">
        <AppIcon name="warning" size={24} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {actions === undefined ? null : <div className="error-state__actions">{actions}</div>}
    </section>
  );
}
