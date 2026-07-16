import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

const requiredAssets = [
  "apps/desktop/src-tauri/icons/icon.ico",
  "apps/desktop/src-tauri/icons/32x32.png",
  "apps/desktop/src-tauri/icons/128x128.png",
  "apps/desktop/src-tauri/icons/128x128@2x.png"
];

let failed = false;
for (const relativePath of requiredAssets) {
  const path = resolve(process.cwd(), relativePath);
  if (!existsSync(path)) {
    console.error(`✗ Missing native asset: ${relativePath}`);
    failed = true;
    continue;
  }
  const size = statSync(path).size;
  if (size < 100) {
    console.error(`✗ Native asset is unexpectedly small: ${relativePath} (${size} bytes)`);
    failed = true;
  } else {
    console.log(`✓ ${relativePath} (${size} bytes)`);
  }
}

if (failed) process.exit(1);
