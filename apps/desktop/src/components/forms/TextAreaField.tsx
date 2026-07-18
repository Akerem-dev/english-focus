import { forwardRef, useId, type TextareaHTMLAttributes } from "react";

import { joinClassNames, joinDescriptionIds } from "../componentUtils";

export interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly label: string;
  readonly helperText?: string | undefined;
  readonly error?: string | undefined;
  readonly hideLabel?: boolean | undefined;
  readonly fieldClassName?: string | undefined;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  function TextAreaField(
    {
      className,
      error,
      fieldClassName,
      helperText,
      hideLabel = false,
      id,
      label,
      rows = 4,
      ...textareaProps
    },
    ref
  ) {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const helperId = helperText === undefined ? undefined : `${textareaId}-helper`;
    const errorId = error === undefined ? undefined : `${textareaId}-error`;

    return (
      <div className={joinClassNames("field", fieldClassName)} data-invalid={Boolean(error)}>
        <label
          className={joinClassNames("field__label", hideLabel && "sr-only")}
          htmlFor={textareaId}
        >
          {label}
        </label>
        <textarea
          {...textareaProps}
          ref={ref}
          aria-describedby={joinDescriptionIds(helperId, errorId)}
          aria-invalid={error === undefined ? undefined : true}
          className={joinClassNames("field__input", "field__textarea", className)}
          id={textareaId}
          rows={rows}
        />
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
  }
);
