import type { HTMLAttributes, PropsWithChildren } from "react";

import { joinClassNames } from "../componentUtils";

export type LayoutGap = "none" | "small" | "medium" | "large" | "xlarge";
export type LayoutAlignment = "start" | "center" | "end" | "stretch";

export interface StackProps extends PropsWithChildren<HTMLAttributes<HTMLDivElement>> {
  readonly gap?: LayoutGap;
  readonly align?: LayoutAlignment;
}

export function Stack({
  align = "stretch",
  children,
  className,
  gap = "medium",
  ...divProps
}: StackProps) {
  return (
    <div
      {...divProps}
      className={joinClassNames("stack", className)}
      data-align={align}
      data-gap={gap}
    >
      {children}
    </div>
  );
}
