import { useEffect, useState, type ReactNode } from "react";

import { AppIcon } from "../../design-system";
import { useSettings } from "../providers";

const LIBRARY_MOTION_STORAGE_KEY = "english-focus:library-ambient-motion";

function readStoredMotionPreference(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    return window.localStorage.getItem(LIBRARY_MOTION_STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

interface LibraryRouteFrameProps {
  readonly children: ReactNode;
}

export function LibraryRouteFrame({ children }: LibraryRouteFrameProps) {
  const { settings } = useSettings();
  const [motionPreference, setMotionPreference] = useState(readStoredMotionPreference);
  const reducedMotion = settings.appearance.reducedMotion;
  const motionActive = motionPreference && !reducedMotion;

  useEffect(() => {
    try {
      window.localStorage.setItem(LIBRARY_MOTION_STORAGE_KEY, motionPreference ? "on" : "off");
    } catch {
      // The atmosphere remains usable even when local preferences cannot be persisted.
    }
  }, [motionPreference]);

  return (
    <div className="library-route-frame" data-motion={motionActive ? "on" : "off"}>
      <div aria-hidden="true" className="library-atmosphere">
        <span className="library-atmosphere__motif library-atmosphere__motif--01">A</span>
        <span className="library-atmosphere__motif library-atmosphere__motif--02">
          <AppIcon name="book-open" size={19} />
        </span>
        <span className="library-atmosphere__motif library-atmosphere__motif--03">m</span>
        <span className="library-atmosphere__motif library-atmosphere__motif--04">R</span>
        <span className="library-atmosphere__motif library-atmosphere__motif--05">
          <AppIcon name="books" size={18} />
        </span>
        <span className="library-atmosphere__motif library-atmosphere__motif--06">t</span>
        <span className="library-atmosphere__motif library-atmosphere__motif--07">W</span>
        <span className="library-atmosphere__motif library-atmosphere__motif--08">
          <AppIcon name="book-open" size={16} />
        </span>
        <span className="library-atmosphere__motif library-atmosphere__motif--09">y</span>
        <span className="library-atmosphere__motif library-atmosphere__motif--10">E</span>
      </div>

      <div className="library-route-frame__content">{children}</div>

      <label
        className="library-motion-control"
        data-disabled={reducedMotion || undefined}
        title={reducedMotion ? "Reduced motion is enabled in Settings." : undefined}
      >
        <span className="library-motion-control__label">Animation</span>
        <input
          aria-label={
            motionActive ? "Turn background animation off" : "Turn background animation on"
          }
          checked={motionActive}
          disabled={reducedMotion}
          onChange={(event) => {
            setMotionPreference(event.currentTarget.checked);
          }}
          type="checkbox"
        />
        <span aria-hidden="true" className="library-motion-control__track" />
        <span aria-hidden="true" className="library-motion-control__state">
          {motionActive ? "On" : "Off"}
        </span>
      </label>
    </div>
  );
}
