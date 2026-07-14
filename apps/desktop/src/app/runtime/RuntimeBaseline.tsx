import { useEffect, useState } from "react";

import { connectToRuntime, type RuntimeConnection } from "./runtimeBridge";

type RuntimeState = { readonly kind: "checking" } | RuntimeConnection;

const baseChecks = [
  {
    label: "React",
    detail: "Application component rendered successfully"
  },
  {
    label: "TypeScript",
    detail: "Strict application entry is active"
  },
  {
    label: "Vite",
    detail: "Frontend development runtime is connected"
  }
] as const;

function getRuntimeCopy(state: RuntimeState) {
  switch (state.kind) {
    case "native":
      return {
        title: "Native desktop foundation ready",
        summary:
          "The React frontend is running inside the native Tauri window and the Rust IPC bridge responded successfully.",
        runtimeLabel: state.info.runtime,
        runtimeDetail: `${state.info.productName} ${state.info.appVersion}`,
        tone: "success" as const
      };
    case "browser":
      return {
        title: "Browser foundation ready",
        summary:
          "The web runtime remains available. Launch npm run desktop to verify the native Tauri connection.",
        runtimeLabel: "Tauri",
        runtimeDetail: "Awaiting native desktop launch",
        tone: "pending" as const
      };
    case "error":
      return {
        title: "Native runtime needs attention",
        summary:
          "The Tauri window opened, but the Rust IPC handshake did not complete. Use the terminal message to diagnose the native runtime.",
        runtimeLabel: "Rust IPC",
        runtimeDetail: state.message,
        tone: "error" as const
      };
    case "checking":
      return {
        title: "Checking application runtime",
        summary: "Confirming whether English Focus is running in a browser or a native window.",
        runtimeLabel: "Tauri",
        runtimeDetail: "Checking native runtime…",
        tone: "pending" as const
      };
  }
}

export function RuntimeBaseline() {
  const [runtimeState, setRuntimeState] = useState<RuntimeState>({ kind: "checking" });

  useEffect(() => {
    let isCurrent = true;

    void connectToRuntime().then((connection) => {
      if (isCurrent) {
        setRuntimeState(connection);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  const runtimeCopy = getRuntimeCopy(runtimeState);

  return (
    <main className="runtime-baseline" aria-labelledby="runtime-title">
      <section className="runtime-baseline__panel">
        <header className="runtime-baseline__brand">
          <span className="runtime-baseline__monogram" aria-hidden="true">
            EF
          </span>
          <span className="runtime-baseline__brand-name">English Focus</span>
          <span className="runtime-baseline__native-badge">Native checkpoint</span>
        </header>

        <div className="runtime-baseline__content">
          <p className="runtime-baseline__eyebrow">Checkpoint CP03</p>
          <h1 id="runtime-title">{runtimeCopy.title}</h1>
          <p className="runtime-baseline__summary" aria-live="polite">
            {runtimeCopy.summary}
          </p>

          <ul className="runtime-baseline__checks" aria-label="Runtime checks">
            {baseChecks.map((check) => (
              <li key={check.label} className="runtime-baseline__check">
                <span className="runtime-baseline__check-icon" aria-hidden="true">
                  ✓
                </span>
                <span>
                  <strong>{check.label}</strong>
                  <small>{check.detail}</small>
                </span>
              </li>
            ))}

            <li className={`runtime-baseline__check runtime-baseline__check--${runtimeCopy.tone}`}>
              <span className="runtime-baseline__check-icon" aria-hidden="true">
                {runtimeCopy.tone === "success" ? "✓" : runtimeCopy.tone === "error" ? "!" : "…"}
              </span>
              <span>
                <strong>{runtimeCopy.runtimeLabel}</strong>
                <small>{runtimeCopy.runtimeDetail}</small>
              </span>
            </li>
          </ul>

          <p className="runtime-baseline__note">
            Next checkpoint: build the reusable design system and the three-route application shell.
          </p>
        </div>
      </section>
    </main>
  );
}
