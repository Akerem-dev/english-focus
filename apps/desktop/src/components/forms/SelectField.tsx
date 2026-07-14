import { forwardRef, useId, type SelectHTMLAttributes } from "react";

import { AppIcon } from "../../design-system";
import { joinClassNames, joinDescriptionIds } from "../componentUtils";

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly label: string;
  readonly helperText?: string;
  readonly error?: string;
  readonly hideLabel?: boolean;
  readonly fieldClassName?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  {
    children,
    className,
    error,
    fieldClassName,
    helperText,
    hideLabel = false,
    id,
    label,
    ...selectProps
  },
  ref
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const helperId = helperText === undefined ? undefined : `${selectId}-helper`;
  const errorId = error === undefined ? undefined : `${selectId}-error`;

  return (
    <div className={joinClassNames("field", fieldClassName)} data-invalid={Boolean(error)}>
      <label className={joinClassNames("field__label", hideLabel && "sr-only")} htmlFor={selectId}>
        {label}
      </label>
      <div className="field__control field__control--select">
        <select
          {...selectProps}
          ref={ref}
          aria-describedby={joinDescriptionIds(helperId, errorId)}
          aria-invalid={error === undefined ? undefined : true}
          className={joinClassNames("field__input", "field__select", className)}
          id={selectId}
        >
          {children}
        </select>
        <span aria-hidden="true" className="field__select-icon">
          <AppIcon name="chevron-down" size={16} />
        </span>
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
