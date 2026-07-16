import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(testDirectory, "../../../../..");

function readJson(relativePath: string) {
  return JSON.parse(readFileSync(resolve(repositoryRoot, relativePath), "utf8")) as Record<string, unknown>;
}

describe("Windows release configuration", () => {
  it("keeps application versions synchronized", () => {
    const rootPackage = readJson("package.json");
    const desktopPackage = readJson("apps/desktop/package.json");
    const tauriConfig = readJson("apps/desktop/src-tauri/tauri.conf.json");
    const cargo = readFileSync(resolve(repositoryRoot, "apps/desktop/src-tauri/Cargo.toml"), "utf8");
    const cargoVersion = cargo.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
    expect(rootPackage.version).toBe("0.9.0");
    expect(desktopPackage.version).toBe(rootPackage.version);
    expect(tauriConfig.version).toBe(rootPackage.version);
    expect(cargoVersion).toBe(rootPackage.version);
  });

  it("enables only MSI and NSIS release-candidate installers", () => {
    const config = readJson("apps/desktop/src-tauri/tauri.conf.json") as {
      bundle: {
        active: boolean;
        targets: string[];
        windows: { allowDowngrades: boolean; nsis: { installMode: string }; wix: { upgradeCode: string } };
      };
    };
    expect(config.bundle.active).toBe(true);
    expect(config.bundle.targets).toEqual(["msi", "nsis"]);
    expect(config.bundle.windows.allowDowngrades).toBe(false);
    expect(config.bundle.windows.nsis.installMode).toBe("currentUser");
    expect(config.bundle.windows.wix.upgradeCode).toMatch(/^[0-9A-F-]{36}$/);
  });
});
