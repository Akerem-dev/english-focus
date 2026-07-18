import type { CefrLevel } from "@platform/domain";
import type { HTMLAttributes } from "react";

import { joinClassNames } from "../componentUtils";

export interface CefrBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  readonly level: CefrLevel;
  readonly showPrefix?: boolean;
}

export function CefrBadge({ className, level, showPrefix = true, ...spanProps }: CefrBadgeProps) {
  return (
    <span {...spanProps} className={joinClassNames("cefr-badge", className)} data-level={level}>
      {showPrefix ? `CEFR ${level}` : level}
    </span>
  );
}
