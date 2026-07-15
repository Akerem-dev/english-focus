import { forwardRef } from "react";

import { AppIcon } from "../../design-system";
import { IconButton } from "../actions";
import { TextField, type TextFieldProps } from "./TextField";

export interface SearchInputProps extends Omit<
  TextFieldProps,
  "leadingIcon" | "trailingAction" | "type"
> {
  readonly onClear?: () => void;
  readonly clearLabel?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  {
    clearLabel = "Clear search",
    label = "Search",
    onClear,
    value,
    ...inputProps
  },
  ref
) {
  const hasValue = typeof value === "string" ? value.length > 0 : value !== undefined;

  return (
    <TextField
      {...inputProps}
      ref={ref}
      hideLabel={inputProps.hideLabel ?? true}
      label={label}
      leadingIcon={<AppIcon name="search" size={18} />}
      trailingAction={
        onClear !== undefined && hasValue ? (
          <IconButton
            icon={<AppIcon name="close" size={16} />}
            label={clearLabel}
            onClick={onClear}
            size="small"
          />
        ) : undefined
      }
      type="search"
      value={value}
    />
  );
});
