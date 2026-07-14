import type { ReactNode } from "react";

import { joinClassNames } from "../componentUtils";

export interface PageHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly eyebrow?: string;
  readonly actions?: ReactNode;
  readonly className?: string;
  readonly titleId?: string;
}

export function PageHeader({
  actions,
  className,
  description,
  eyebrow,
  title,
  titleId
}: PageHeaderProps) {
  return (
    <header className={joinClassNames("page-header", className)}>
      <div className="page-header__copy">
        {eyebrow === undefined ? null : <p className="page-header__eyebrow">{eyebrow}</p>}
        <h1 id={titleId}>{title}</h1>
        {description === undefined ? null : (
          <p className="page-header__description">{description}</p>
        )}
      </div>
      {actions === undefined ? null : <div className="page-header__actions">{actions}</div>}
    </header>
  );
}
