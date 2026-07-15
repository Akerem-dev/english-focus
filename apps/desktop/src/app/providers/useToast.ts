import { useContext } from "react";

import { ToastContext, type ToastContextValue } from "./ToastContext";

const OPTIONAL_TOAST_FALLBACK: ToastContextValue = Object.freeze({
  toasts: Object.freeze([]),
  showToast: () => "toast-provider-unavailable",
  dismissToast: () => undefined,
  clearToasts: () => undefined
});

/**
 * Returns the global toast service when mounted. The no-op fallback keeps isolated SSR/component
 * tests deterministic without forcing every presentation test to reproduce the full app provider tree.
 */
export function useToast() {
  return useContext(ToastContext) ?? OPTIONAL_TOAST_FALLBACK;
}
