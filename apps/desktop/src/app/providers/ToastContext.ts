import { createContext } from "react";

export type ToastTone = "success" | "info" | "warning" | "error";

export interface ToastAction {
  readonly label: string;
  readonly onAction: () => void | Promise<void>;
}

export interface ToastInput {
  readonly title: string;
  readonly message?: string | undefined;
  readonly tone?: ToastTone | undefined;
  readonly durationMs?: number | undefined;
  readonly action?: ToastAction | undefined;
  readonly dedupeKey?: string | undefined;
}

export interface ToastRecord extends ToastInput {
  readonly id: string;
  readonly createdAt: number;
}

export interface ToastContextValue {
  readonly toasts: readonly ToastRecord[];
  readonly showToast: (input: ToastInput) => string;
  readonly dismissToast: (id: string) => void;
  readonly clearToasts: () => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);
