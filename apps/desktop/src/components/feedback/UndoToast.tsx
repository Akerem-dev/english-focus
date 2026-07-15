import type { ToastRecord } from "../../app/providers/ToastContext";
import { Toast } from "./Toast";

export interface UndoToastProps {
  readonly toast: ToastRecord;
  readonly onDismiss: () => void;
}

export function UndoToast(props: UndoToastProps) {
  return <Toast {...props} />;
}
