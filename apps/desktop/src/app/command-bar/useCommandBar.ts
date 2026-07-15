import { useCallback, useState } from "react";

export interface CommandBarController {
  readonly open: boolean;
  readonly openCommandBar: () => void;
  readonly closeCommandBar: () => void;
}

export function useCommandBar(): CommandBarController {
  const [open, setOpen] = useState(false);

  const openCommandBar = useCallback(() => {
    setOpen(true);
  }, []);

  const closeCommandBar = useCallback(() => {
    setOpen(false);
  }, []);

  return { open, openCommandBar, closeCommandBar };
}
