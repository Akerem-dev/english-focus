import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

import { joinClassNames, joinDescriptionIds } from "../componentUtils";

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  readonly label: string;
  readonly helperText?: string | undefined;
  readonly error?: string | undefined;
  readonly hideLabel?: boolean | undefined;
  readonly leadingIcon?: ReactNode | undefined;
  readonly trailingAction?: ReactNode | undefined;
  readonly fieldClassName?: string | undefined;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    className,
    error,
    fieldClassName,
    helperText,
    hideLabel = false,
    id,
    label,
    leadingIcon,
    trailingAction,
    type = "text",
    ...inputProps
  },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = helperText === undefined ? undefined : `${inputId}-helper`;
  const errorId = error === undefined ? undefined : `${inputId}-error`;

  return (
    <div className={joinClassNames("field", fieldClassName)} data-invalid={Boolean(error)}>
      <label className={joinClassNames("field__label", hideLabel && "sr-only")} htmlFor={inputId}>
        {label}
      </label>
      <div className="field__control">
        {leadingIcon === undefined ? null : (
          <span aria-hidden="true" className="field__leading-icon">
            {leadingIcon}
          </span>
        )}
        <input
          {...inputProps}
          ref={ref}
          aria-describedby={joinDescriptionIds(helperId, errorId)}
          aria-invalid={error === undefined ? undefined : true}
          className={joinClassNames("field__input", className)}
          id={inputId}
          type={type}
        />
        {trailingAction === undefined ? null : (
          <span className="field__trailing-action">{trailingAction}</span>
        )}
      </div>
      {helperText === undefined ? null : (
        <p className="field__helper" id={helperId}>
          {helperText}
        </p>
      )}
      {error === undefined ? null : (
        <p className="field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
