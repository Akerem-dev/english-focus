import type { HTMLAttributes, PropsWithChildren } from "react";

import { AppIcon } from "../../design-system";
import { joinClassNames } from "../componentUtils";

export type InlineErrorProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export function InlineError({ children, className, ...divProps }: InlineErrorProps) {
  return (
    <div {...divProps} className={joinClassNames("inline-error", className)} role="alert">
      <AppIcon name="warning" size={18} />
      <span>{children}</span>
    </div>
  );
}
