import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(testDirectory, "../../../../..");
const internalWorkspaceVersion = "0.0.0";

type PackageJson = {
  readonly version?: string;
};

type PackageLock = {
  readonly version?: string;
  readonly packages?: Record<string, { readonly version?: string }>;
};

type TauriConfig = {
  readonly version?: string;
  readonly bundle: {
    readonly active: boolean;
    readonly targets: string[];
    readonly windows: {
      readonly allowDowngrades: boolean;
      readonly nsis: { readonly installMode: string };
      readonly wix: { readonly version?: string; readonly upgradeCode: string };
    };
  };
};

function readJson<T>(relativePath: string): T {
  return JSON.parse(
    readFileSync(resolve(repositoryRoot, relativePath), "utf8").replace(/^\uFEFF/, "")
  ) as T;
}

function readText(relativePath: string): string {
  return readFileSync(resolve(repositoryRoot, relativePath), "utf8").replace(/^\uFEFF/, "");
}

describe("Windows release configuration", () => {
  it("keeps all release-bearing application versions synchronized", () => {
    const rootPackage = readJson<PackageJson>("package.json");
    const desktopPackage = readJson<PackageJson>("apps/desktop/package.json");
    const packageLock = readJson<PackageLock>("package-lock.json");
    const tauriConfig = readJson<TauriConfig>("apps/desktop/src-tauri/tauri.conf.json");
    const cargo = readText("apps/desktop/src-tauri/Cargo.toml");
    const cargoLock = readText("apps/desktop/src-tauri/Cargo.lock");
    const cargoVersion = cargo.match(/^\s*version\s*=\s*"([^"]+)"/m)?.[1];
    const cargoLockVersion = cargoLock.match(
      /\[\[package\]\]\r?\nname = "english-learning-platform"\r?\nversion = "([^"]+)"/
    )?.[1];

    expect(rootPackage.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(rootPackage.version).not.toBe(internalWorkspaceVersion);
    expect(desktopPackage.version).toBe(rootPackage.version);
    expect(packageLock.version).toBe(rootPackage.version);
    expect(packageLock.packages?.[""]?.version).toBe(rootPackage.version);
    expect(packageLock.packages?.["apps/desktop"]?.version).toBe(rootPackage.version);
    expect(tauriConfig.version).toBe(rootPackage.version);
    expect(tauriConfig.bundle.windows.wix.version).toBe(rootPackage.version);
    expect(cargoVersion).toBe(rootPackage.version);
    expect(cargoLockVersion).toBe(rootPackage.version);

    for (const workspacePath of ["packages/domain", "packages/schemas", "packages/testing"]) {
      const workspacePackage = readJson<PackageJson>(`${workspacePath}/package.json`);
      expect(workspacePackage.version).toBe(internalWorkspaceVersion);
      expect(packageLock.packages?.[workspacePath]?.version).toBe(internalWorkspaceVersion);
    }
  });

  it("enables only the supported MSI and NSIS release installers", () => {
    const config = readJson<TauriConfig>("apps/desktop/src-tauri/tauri.conf.json");

    expect(config.bundle.active).toBe(true);
    expect(config.bundle.targets).toEqual(["msi", "nsis"]);
    expect(config.bundle.windows.allowDowngrades).toBe(false);
    expect(config.bundle.windows.nsis.installMode).toBe("currentUser");
    expect(config.bundle.windows.wix.upgradeCode).toMatch(/^[0-9A-F-]{36}$/);
  });

  it("keeps release builds detached from a Windows console", () => {
    const mainSource = readText("apps/desktop/src-tauri/src/main.rs");

    expect(mainSource).toContain(
      '#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]'
    );
  });

  it("removes stale Windows installer outputs before packaging", () => {
    const releaseScript = readText("scripts/build-windows-installers.ps1");

    expect(releaseScript).toContain("Remove-Item -LiteralPath $bundleRoot -Recurse -Force");
    expect(releaseScript).toContain(
      'foreach ($staleReleaseFile in @("english-learning-platform.exe", "english-learning-platform.pdb"))'
    );
    expect(releaseScript).toContain(
      "Get-ChildItem -LiteralPath $artifactRoot -Force | Remove-Item -Recurse -Force"
    );
  });

  it("runs the release quality gate by default and protects CI reuse", () => {
    const releaseScript = readText("scripts/build-windows-installers.ps1");

    expect(releaseScript).toContain("npm run quality:release");
    expect(releaseScript).toContain("[switch]$QualityAlreadyVerified");
    expect(releaseScript).toContain('if ($env:CI -ne "true" -or $env:EF_QUALITY_GATE_VERIFIED -ne "true")');
    expect(releaseScript).toContain(
      "QualityAlreadyVerified is restricted to unsigned CI system-acceptance builds."
    );
  });
});
