import { createElement, type ReactNode } from "react";

import { joinClassNames } from "../componentUtils";

export interface SectionHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly actions?: ReactNode;
  readonly headingLevel?: 2 | 3 | 4;
  readonly titleId?: string;
  readonly className?: string;
}

export function SectionHeader({
  actions,
  className,
  description,
  headingLevel = 2,
  title,
  titleId
}: SectionHeaderProps) {
  return (
    <header className={joinClassNames("section-header", className)}>
      <div>
        {createElement(`h${headingLevel}`, { id: titleId }, title)}
        {description === undefined ? null : <p>{description}</p>}
      </div>
      {actions === undefined ? null : <div className="section-header__actions">{actions}</div>}
    </header>
  );
}
