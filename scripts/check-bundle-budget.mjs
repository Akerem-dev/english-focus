import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DIST_ASSETS = path.resolve("apps/desktop/dist/assets");
const MAX_SINGLE_JS_BYTES = 460 * 1024;
const MAX_TOTAL_JS_BYTES = 1_900 * 1024;
const MAX_SINGLE_CSS_BYTES = 190 * 1024;

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

async function readAssetSizes() {
  const names = await readdir(DIST_ASSETS);
  const assets = [];

  for (const name of names) {
    if (!name.endsWith(".js") && !name.endsWith(".css")) {
      continue;
    }

    const filePath = path.join(DIST_ASSETS, name);
    const file = await stat(filePath);
    assets.push({ name, bytes: file.size, extension: path.extname(name) });
  }

  return assets;
}

try {
  const assets = await readAssetSizes();
  const javascript = assets.filter((asset) => asset.extension === ".js");
  const stylesheets = assets.filter((asset) => asset.extension === ".css");
  const failures = [];
  const totalJavascriptBytes = javascript.reduce((total, asset) => total + asset.bytes, 0);

  if (javascript.length < 4) {
    failures.push(
      `Expected route/vendor code splitting to create at least 4 JavaScript chunks; found ${javascript.length}.`
    );
  }

  for (const asset of javascript) {
    if (asset.bytes > MAX_SINGLE_JS_BYTES) {
      failures.push(
        `${asset.name} is ${formatBytes(asset.bytes)}; single JavaScript chunks must stay below ${formatBytes(MAX_SINGLE_JS_BYTES)}.`
      );
    }
  }

  for (const asset of stylesheets) {
    if (asset.bytes > MAX_SINGLE_CSS_BYTES) {
      failures.push(
        `${asset.name} is ${formatBytes(asset.bytes)}; stylesheets must stay below ${formatBytes(MAX_SINGLE_CSS_BYTES)}.`
      );
    }
  }

  if (totalJavascriptBytes > MAX_TOTAL_JS_BYTES) {
    failures.push(
      `Total JavaScript is ${formatBytes(totalJavascriptBytes)}; budget is ${formatBytes(MAX_TOTAL_JS_BYTES)}.`
    );
  }

  if (failures.length > 0) {
    console.error("Bundle budget check failed:\n");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  const largest = [...javascript].sort((left, right) => right.bytes - left.bytes)[0];
  console.log("Bundle budget check passed.");
  console.log(`JavaScript chunks: ${javascript.length}`);
  console.log(`Total JavaScript: ${formatBytes(totalJavascriptBytes)}`);
  console.log(
    `Largest JavaScript chunk: ${largest === undefined ? "none" : `${largest.name} (${formatBytes(largest.bytes)})`}`
  );
} catch (cause) {
  const message = cause instanceof Error ? cause.message : String(cause);
  console.error(`Bundle budget check could not inspect ${DIST_ASSETS}: ${message}`);
  console.error("Run the desktop production build before this check.");
  process.exit(1);
}
