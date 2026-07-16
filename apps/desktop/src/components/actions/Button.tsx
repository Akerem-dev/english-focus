import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { joinClassNames } from "../componentUtils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "small" | "medium" | "large";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly leadingIcon?: ReactNode;
  readonly trailingIcon?: ReactNode;
  readonly isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    className,
    disabled = false,
    isLoading = false,
    leadingIcon,
    size = "medium",
    trailingIcon,
    type = "button",
    variant = "secondary",
    ...buttonProps
  },
  ref
) {
  return (
    <button
      {...buttonProps}
      ref={ref}
      aria-busy={isLoading || undefined}
      className={joinClassNames("button", className)}
      data-size={size}
      data-variant={variant}
      disabled={disabled || isLoading}
      type={type}
    >
      {isLoading ? <span aria-hidden="true" className="button__spinner" /> : leadingIcon}
      <span className="button__label">{children}</span>
      {trailingIcon}
    </button>
  );
});
