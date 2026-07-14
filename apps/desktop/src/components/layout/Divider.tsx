import type { HTMLAttributes } from "react";

import { joinClassNames } from "../componentUtils";

export type DividerOrientation = "horizontal" | "vertical";

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  readonly orientation?: DividerOrientation;
}

export function Divider({ className, orientation = "horizontal", ...dividerProps }: DividerProps) {
  return (
    <hr
      {...dividerProps}
      aria-orientation={orientation}
      className={joinClassNames("divider", className)}
      data-orientation={orientation}
    />
  );
}
