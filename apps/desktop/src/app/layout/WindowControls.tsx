import { useEffect } from "react";
import type { Window as TauriWindow } from "@tauri-apps/api/window";

interface WindowControlsProps {
  readonly className?: string;
}

async function withCurrentWindow(
  action: (window: TauriWindow) => Promise<void>
): Promise<void> {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await action(getCurrentWindow());
  } catch {
    // Window controls are desktop-only. Static rendering and browser previews should stay usable.
  }
}

function toggleFullscreen(): void {
  void withCurrentWindow(async (window) => {
    const fullscreen = await window.isFullscreen();
    await window.setFullscreen(!fullscreen);
  });
}

export function WindowControls({ className = "" }: WindowControlsProps) {
  useEffect(() => {
    function handleFullscreenShortcut(event: KeyboardEvent) {
      if (event.key !== "F11") {
        return;
      }

      event.preventDefault();
      toggleFullscreen();
    }

    window.addEventListener("keydown", handleFullscreenShortcut);
    return () => window.removeEventListener("keydown", handleFullscreenShortcut);
  }, []);

  return (
    <div
      aria-label="Window controls"
      className={`window-controls${className.length > 0 ? ` ${className}` : ""}`}
      role="group"
    >
      <button
        aria-label="Minimize window"
        className="window-controls__button"
        onClick={() => {
          void withCurrentWindow((window) => window.minimize());
        }}
        type="button"
      >
        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16">
          <path d="M4 8.5h8" />
        </svg>
      </button>
      <button
        aria-label="Toggle full screen"
        className="window-controls__button"
        onClick={toggleFullscreen}
        title="Full screen (F11)"
        type="button"
      >
        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16">
          <rect height="8" width="8" x="4" y="4" />
        </svg>
      </button>
      <button
        aria-label="Close window"
        className="window-controls__button window-controls__button--close"
        onClick={() => {
          void withCurrentWindow((window) => window.close());
        }}
        type="button"
      >
        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16">
          <path d="m5 5 6 6M11 5l-6 6" />
        </svg>
      </button>
    </div>
  );
}
