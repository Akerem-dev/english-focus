import { forwardRef, useId, type InputHTMLAttributes } from "react";

import { joinClassNames } from "../componentUtils";

export interface SwitchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  readonly label: string;
  readonly description?: string;
  readonly containerClassName?: string;
}

export const SwitchField = forwardRef<HTMLInputElement, SwitchFieldProps>(function SwitchField(
  { containerClassName, description, disabled, id, label, ...inputProps },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = description === undefined ? undefined : `${inputId}-description`;

  return (
    <label
      className={joinClassNames("switch-field", containerClassName)}
      data-disabled={disabled || undefined}
      htmlFor={inputId}
    >
      <span className="switch-field__copy">
        <span className="switch-field__label">{label}</span>
        {description === undefined ? null : (
          <span className="switch-field__description" id={descriptionId}>
            {description}
          </span>
        )}
      </span>
      <span className="switch-field__control">
        <input
          {...inputProps}
          ref={ref}
          aria-describedby={descriptionId}
          className="switch-field__input"
          disabled={disabled}
          id={inputId}
          role="switch"
          type="checkbox"
        />
        <span aria-hidden="true" className="switch-field__track">
          <span className="switch-field__thumb" />
        </span>
      </span>
    </label>
  );
});
