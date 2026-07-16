import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { joinClassNames } from "../componentUtils";

type IconButtonVariant = "quiet" | "outlined" | "accent" | "danger";
type IconButtonSize = "small" | "medium" | "large";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly label: string;
  readonly icon: ReactNode;
  readonly variant?: IconButtonVariant;
  readonly size?: IconButtonSize;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    className,
    icon,
    label,
    size = "medium",
    title,
    type = "button",
    variant = "quiet",
    ...buttonProps
  },
  ref
) {
  return (
    <button
      {...buttonProps}
      ref={ref}
      aria-label={label}
      className={joinClassNames("icon-button", className)}
      data-size={size}
      data-variant={variant}
      title={title ?? label}
      type={type}
    >
      {icon}
    </button>
  );
});
