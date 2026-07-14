import type { HTMLAttributes, PropsWithChildren } from "react";

import { joinClassNames } from "../componentUtils";

export type ContentColumnWidth = "reading" | "app" | "full";

export interface ContentColumnProps extends PropsWithChildren<HTMLAttributes<HTMLDivElement>> {
  readonly width?: ContentColumnWidth;
}

export function ContentColumn({
  children,
  className,
  width = "app",
  ...divProps
}: ContentColumnProps) {
  return (
    <div {...divProps} className={joinClassNames("content-column", className)} data-width={width}>
      {children}
    </div>
  );
}
