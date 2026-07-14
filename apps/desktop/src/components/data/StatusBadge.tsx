import type { HTMLAttributes, PropsWithChildren } from "react";

import { joinClassNames } from "../componentUtils";

export type StatusBadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

export interface StatusBadgeProps extends PropsWithChildren<HTMLAttributes<HTMLSpanElement>> {
  readonly tone?: StatusBadgeTone;
}

export function StatusBadge({
  children,
  className,
  tone = "neutral",
  ...spanProps
}: StatusBadgeProps) {
  return (
    <span {...spanProps} className={joinClassNames("status-badge", className)} data-tone={tone}>
      {children}
    </span>
  );
}
