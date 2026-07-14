import type { HTMLAttributes, PropsWithChildren, ReactNode } from "react";

import { joinClassNames } from "../componentUtils";
import { SectionHeader } from "./SectionHeader";

export interface SectionProps extends PropsWithChildren<HTMLAttributes<HTMLElement>> {
  readonly title?: string;
  readonly description?: string;
  readonly actions?: ReactNode;
  readonly headingLevel?: 2 | 3 | 4;
}

export function Section({
  actions,
  children,
  className,
  description,
  headingLevel = 2,
  title,
  ...sectionProps
}: SectionProps) {
  return (
    <section {...sectionProps} className={joinClassNames("section", className)}>
      {title === undefined ? null : (
        <SectionHeader
          {...(actions === undefined ? {} : { actions })}
          {...(description === undefined ? {} : { description })}
          headingLevel={headingLevel}
          title={title}
        />
      )}
      <div className="section__content">{children}</div>
    </section>
  );
}
