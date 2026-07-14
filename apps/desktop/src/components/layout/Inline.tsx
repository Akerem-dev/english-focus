import type { HTMLAttributes, PropsWithChildren } from "react";

import { joinClassNames } from "../componentUtils";
import type { LayoutAlignment, LayoutGap } from "./Stack";

export type InlineJustification = "start" | "center" | "end" | "between";

export interface InlineProps extends PropsWithChildren<HTMLAttributes<HTMLDivElement>> {
  readonly gap?: LayoutGap;
  readonly align?: LayoutAlignment;
  readonly justify?: InlineJustification;
  readonly wrap?: boolean;
}

export function Inline({
  align = "center",
  children,
  className,
  gap = "medium",
  justify = "start",
  wrap = true,
  ...divProps
}: InlineProps) {
  return (
    <div
      {...divProps}
      className={joinClassNames("inline", className)}
      data-align={align}
      data-gap={gap}
      data-justify={justify}
      data-wrap={wrap}
    >
      {children}
    </div>
  );
}
