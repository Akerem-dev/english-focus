import mascotConfused from "../../assets/assistant/assistant-confused.png";
import mascotLauncherClosed from "../../assets/assistant/assistant-launcher-closed.png";
import mascotReady from "../../assets/assistant/assistant-ready.png";
import mascotSleeping from "../../assets/assistant/assistant-sleeping.png";
import mascotSuccess from "../../assets/assistant/assistant-success.png";
import mascotThinking from "../../assets/assistant/assistant-thinking.png";

export type AssistantMascotState = "ready" | "thinking" | "success" | "confused" | "sleeping";

interface MascotVisual {
  readonly mascot: string;
}

function getPanelVisual(state: AssistantMascotState): MascotVisual {
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
  return (
    <img
      alt=""
      className="assistant-launcher__mascot"
      key={`launcher-${awake ? "awake" : "closed"}`}
      src={awake ? mascotReady : mascotLauncherClosed}
    />
  );
}
