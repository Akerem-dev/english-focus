import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { basename, extname, join, resolve } from "node:path";

const root = process.cwd();
const collect = process.argv.includes("--collect");
const config = JSON.parse(readFileSync(resolve(root, "apps/desktop/src-tauri/tauri.conf.json"), "utf8"));
const version = config.version;
const targetRoot = process.env.CARGO_TARGET_DIR
  ? resolve(root, process.env.CARGO_TARGET_DIR)
  : resolve(root, "apps/desktop/src-tauri/target");
const bundleRoot = join(targetRoot, "release", "bundle");
const expected = [
  { kind: "MSI", directory: join(bundleRoot, "msi"), extension: ".msi" },
  { kind: "NSIS", directory: join(bundleRoot, "nsis"), extension: ".exe" }
];
const failures = [];
const artifacts = [];

for (const target of expected) {
  const files = existsSync(target.directory)
    ? readdirSync(target.directory)
        .map((name) => join(target.directory, name))
        .filter((path) => statSync(path).isFile() && extname(path).toLowerCase() === target.extension)
    : [];

  if (files.length === 0) {
    failures.push(`${target.kind} artifact was not found in ${target.directory}`);
    continue;
  }

  for (const path of files) {
    const sizeBytes = statSync(path).size;
    const name = basename(path);
    if (sizeBytes < 100_000) failures.push(`${name} is unexpectedly small (${sizeBytes} bytes).`);
    if (!name.includes(version)) failures.push(`${name} does not contain release version ${version}.`);
    const sha256 = createHash("sha256").update(readFileSync(path)).digest("hex");
    artifacts.push({ kind: target.kind, name, path, sizeBytes, sha256 });
  }
}

if (failures.length > 0) {
  console.error("Windows release artifact check failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

if (collect) {
  const output = resolve(root, "release-artifacts", "windows", version);
  mkdirSync(output, { recursive: true });
  for (const artifact of artifacts) copyFileSync(artifact.path, join(output, artifact.name));
  writeFileSync(join(output, "SHA256SUMS.txt"), `${artifacts.map((item) => `${item.sha256}  ${item.name}`).join("\n")}\n`, "utf8");
  writeFileSync(
    join(output, "release-manifest.json"),
    `${JSON.stringify({
      productName: config.productName,
      version,
      identifier: config.identifier,
      generatedAt: new Date().toISOString(),
      signed: false,
      artifacts: artifacts.map(({ kind, name, sizeBytes, sha256 }) => ({ kind, name, sizeBytes, sha256 }))
    }, null, 2)}\n`,
    "utf8"
  );
  console.log(`Collected release artifacts in ${output}`);
}

for (const artifact of artifacts) {
  console.log(`${artifact.kind}: ${artifact.name}`);
  console.log(`  Size: ${(artifact.sizeBytes / 1024 / 1024).toFixed(2)} MiB`);
  console.log(`  SHA-256: ${artifact.sha256}`);
}
