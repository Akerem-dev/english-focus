import { invoke, isTauri } from "@tauri-apps/api/core";

interface NativeRuntimeInfo {
  readonly productName: string;
  readonly appVersion: string;
  readonly runtime: string;
}

export type RuntimeConnection =
  | { readonly kind: "browser" }
  | { readonly kind: "native"; readonly info: NativeRuntimeInfo }
  | { readonly kind: "error"; readonly message: string };

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export async function connectToRuntime(): Promise<RuntimeConnection> {
  if (!isTauri()) {
    return { kind: "browser" };
  }

  try {
    const info = await invoke<NativeRuntimeInfo>("runtime_info");
    return { kind: "native", info };
  } catch (error: unknown) {
    return {
      kind: "error",
      message: toErrorMessage(error)
    };
  }
}
