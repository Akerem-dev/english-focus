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
      const preferred = dialogRef.current?.querySelector<HTMLElement>("[data-autofocus='true']");
      const focusable =
        preferred ??
        dialogRef.current?.querySelector<HTMLElement>(
          'button:not([disabled]), select:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
      focusable?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], select:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((element) => !element.hasAttribute("hidden") && element.offsetParent !== null);

      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last?.focus();
        return;
      }

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first?.focus();
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
        tabIndex={-1}
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
