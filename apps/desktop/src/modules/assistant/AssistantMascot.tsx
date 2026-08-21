import mascotConfused from "../../assets/assistant/assistant-confused.png";
import mascotLauncherClosed from "../../assets/assistant/assistant-launcher-closed.png";
import mascotReady from "../../assets/assistant/assistant-ready.png";
import mascotSleeping from "../../assets/assistant/assistant-sleeping.png";
import mascotSuccess from "../../assets/assistant/assistant-success.png";
import mascotThinking from "../../assets/assistant/assistant-thinking.png";
import wordieAvatarConfused from "../../assets/wordie/wordie-avatar-confused.png";
import wordieAvatarDefault from "../../assets/wordie/wordie-avatar-default.png";
import wordieCutoutReading from "../../assets/wordie/wordie-cutout-reading.png";

export type AssistantMascotState = "ready" | "thinking" | "success" | "confused" | "sleeping";

interface MascotVisual {
  readonly mascot: string;
}

function isWordValleyCompanionRoute(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const rawHash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const pathname = rawHash.split("?", 1)[0] ?? "";
  return pathname === "/" || pathname === "" || pathname === "/grammar";
}

function getPanelVisual(state: AssistantMascotState): MascotVisual {
  if (isWordValleyCompanionRoute()) {
    return {
      mascot: state === "confused" ? wordieAvatarConfused : wordieAvatarDefault
    };
  }

  switch (state) {
    case "thinking":
      return { mascot: mascotThinking };
    case "success":
      return { mascot: mascotSuccess };
    case "confused":
      return { mascot: mascotConfused };
    case "sleeping":
      return { mascot: mascotSleeping };
    case "ready":
      return { mascot: mascotReady };
  }
}

interface AssistantPanelMascotProps {
  readonly state: AssistantMascotState;
}

export function AssistantPanelMascot({ state }: AssistantPanelMascotProps) {
  const visual = getPanelVisual(state);

  return (
    <div className="assistant-panel__mascot-stage" data-state={state}>
      <img
        alt=""
        className={`assistant-panel__mascot assistant-panel__mascot--${state}`}
        key={`mascot-${state}`}
        src={visual.mascot}
      />
    </div>
  );
}

interface AssistantLauncherMascotProps {
  readonly awake: boolean;
}

export function AssistantLauncherMascot({ awake }: AssistantLauncherMascotProps) {
  const wordValleyCompanionRoute = isWordValleyCompanionRoute();

  return (
    <img
      alt=""
      className="assistant-launcher__mascot"
      key={`launcher-${awake ? "awake" : "closed"}`}
      src={wordValleyCompanionRoute ? wordieCutoutReading : awake ? mascotReady : mascotLauncherClosed}
    />
  );
}
