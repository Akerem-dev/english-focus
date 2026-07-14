import { execFileSync } from "node:child_process";
import process from "node:process";

function readCommand(command, args = []) {
  try {
    return execFileSync(command, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true
    }).trim();
  } catch {
    return null;
  }
}

const checks = [];

function pass(label, detail) {
  checks.push({ status: "PASS", label, detail });
}

function fail(label, detail) {
  checks.push({ status: "FAIL", label, detail });
}

if (process.platform === "win32") {
  pass("Operating system", "Windows detected");
} else {
  fail("Operating system", `Expected Windows for this checkpoint; detected ${process.platform}`);
}

const rustcVersion = readCommand("rustc", ["--version"]);
if (rustcVersion === null) {
  fail("Rust compiler", "rustc was not found in PATH");
} else {
  pass("Rust compiler", rustcVersion);
}

const cargoVersion = readCommand("cargo", ["--version"]);
if (cargoVersion === null) {
  fail("Cargo", "cargo was not found in PATH");
} else {
  pass("Cargo", cargoVersion);
}

const activeToolchain = readCommand("rustup", ["show", "active-toolchain"]);
if (activeToolchain === null) {
  fail("Rust toolchain", "rustup could not report an active toolchain");
} else if (!activeToolchain.includes("msvc")) {
  fail("Rust toolchain", `${activeToolchain}; stable-msvc is required on Windows`);
} else {
  pass("Rust toolchain", activeToolchain);
}

for (const check of checks) {
  const icon = check.status === "PASS" ? "✓" : "✗";
  console.log(`${icon} ${check.label}: ${check.status} — ${check.detail}`);
}

const failures = checks.filter((check) => check.status === "FAIL");
if (failures.length > 0) {
  console.error("\nNative environment check failed. Resolve every FAIL item before npm run desktop.");
  process.exitCode = 1;
} else {
  console.log("\nNative Rust environment check passed.");
  console.log("Microsoft C++ Build Tools and WebView2 are verified by the actual Tauri launch step.");
}
