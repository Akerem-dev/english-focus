import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type PropsWithChildren,
  type ReactNode
} from "react";

import { AppIcon } from "../../design-system";
import { IconButton } from "../actions";

export interface ModalProps extends PropsWithChildren {
  readonly open: boolean;
  readonly title: string;
  readonly description?: string;
  readonly footer?: ReactNode;
  readonly onClose: () => void;
  readonly closeLabel?: string;
  readonly size?: "medium" | "large";
}

export function Modal({
  children,
  closeLabel = "Close dialog",
  description,
  footer,
  onClose,
  open,
  size = "medium",
  title
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      const focusable = dialogRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), select:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={handleBackdropClick}>
      <div
        ref={dialogRef}
        aria-describedby={description === undefined ? undefined : descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="modal"
        data-size={size}
        role="dialog"
      >
        <header className="modal__header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description === undefined ? null : <p id={descriptionId}>{description}</p>}
          </div>
          <IconButton
            icon={<AppIcon name="close" size={18} />}
            label={closeLabel}
            onClick={onClose}
            size="medium"
            variant="quiet"
          />
        </header>
        <div className="modal__body">{children}</div>
        {footer === undefined ? null : <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>
  );
}
