import type { HTMLAttributes, PropsWithChildren } from "react";

import { AppIcon } from "../../design-system";
import { IconButton } from "../actions";
import { joinClassNames } from "../componentUtils";

export interface TagChipProps extends PropsWithChildren<HTMLAttributes<HTMLSpanElement>> {
  readonly onRemove?: () => void;
  readonly removeLabel?: string;
}

export function TagChip({
  children,
  className,
  onRemove,
  removeLabel = "Remove tag",
  ...spanProps
}: TagChipProps) {
  return (
    <span {...spanProps} className={joinClassNames("tag-chip", className)}>
      <span>{children}</span>
      {onRemove === undefined ? null : (
        <IconButton
          icon={<AppIcon name="close" size={13} />}
          label={removeLabel}
          onClick={onRemove}
          size="small"
        />
      )}
    </span>
  );
}
