import type { ReactNode } from "react";

import { joinClassNames } from "../componentUtils";

export interface EmptyStateProps {
  readonly title: string;
  readonly description: string;
  readonly icon?: ReactNode;
  readonly actions?: ReactNode;
  readonly className?: string;
}

export function EmptyState({ actions, className, description, icon, title }: EmptyStateProps) {
  return (
    <section className={joinClassNames("empty-state", className)}>
      {icon === undefined ? null : (
        <span aria-hidden="true" className="empty-state__icon">
          {icon}
        </span>
      )}
      <h2>{title}</h2>
      <p>{description}</p>
      {actions === undefined ? null : <div className="empty-state__actions">{actions}</div>}
    </section>
  );
}
