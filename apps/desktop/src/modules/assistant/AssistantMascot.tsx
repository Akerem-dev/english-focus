import effectQuestionMark from "./assets/effects/effect-question-mark.png";
import effectSleepZ from "./assets/effects/effect-sleep-z.png";
import effectSparkles from "./assets/effects/effect-sparkles.png";
import effectThinkingDots from "./assets/effects/effect-thinking-dots.png";
import effectWakeRays from "./assets/effects/effect-wake-rays.png";
import mascotConfused from "./assets/mascot/mascot-confused.png";
import mascotReady from "./assets/mascot/mascot-ready.png";
import mascotSleeping from "./assets/mascot/mascot-sleeping.png";
import mascotSuccess from "./assets/mascot/mascot-success.png";
import mascotThinking from "./assets/mascot/mascot-thinking.png";

export type AssistantMascotState =
  | "ready"
  | "thinking"
  | "success"
  | "confused"
  | "sleeping";

interface MascotVisual {
  readonly mascot: string;
  readonly effect?: string | undefined;
  readonly effectClassName?: string | undefined;
}

function getPanelVisual(state: AssistantMascotState): MascotVisual {
  switch (state) {
    case "thinking":
      return {
        mascot: mascotThinking,
        effect: effectThinkingDots,
        effectClassName: "assistant-panel__state-effect--thinking"
      };
    case "success":
      return {
        mascot: mascotSuccess,
        effect: effectSparkles,
        effectClassName: "assistant-panel__state-effect--success"
      };
    case "confused":
      return {
        mascot: mascotConfused,
        effect: effectQuestionMark,
        effectClassName: "assistant-panel__state-effect--confused"
      };
    case "sleeping":
      return {
        mascot: mascotSleeping,
        effect: effectSleepZ,
        effectClassName: "assistant-panel__state-effect--sleeping"
      };
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
      {visual.effect === undefined ? null : (
        <img
          alt=""
          className={`assistant-panel__state-effect ${visual.effectClassName ?? ""}`}
          key={`effect-${state}`}
          src={visual.effect}
        />
      )}
    </div>
  );
}

interface AssistantLauncherMascotProps {
  readonly awake: boolean;
}

export function AssistantLauncherMascot({ awake }: AssistantLauncherMascotProps) {
  const state = awake ? "awake" : "sleeping";

  return (
    <>
      <img alt="" className="assistant-launcher__sleep-z" src={effectSleepZ} />
      <img alt="" className="assistant-launcher__wake-rays" src={effectWakeRays} />
      <img
        alt=""
        className="assistant-launcher__mascot"
        key={`launcher-${state}`}
        src={awake ? mascotReady : mascotSleeping}
      />
    </>
  );
}
