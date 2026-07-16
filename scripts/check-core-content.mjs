import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const manifestPath = resolve(
  root,
  "apps/desktop/src/content/core/packs/pilot-core-v1.manifest.json"
);
const maintainPath = resolve(root, "apps/desktop/src/content/core/entries/maintain.entry.json");

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function fail(message) {
  console.error(`Core content check failed: ${message}`);
  process.exitCode = 1;
}

const [manifestBuffer, maintainBuffer] = await Promise.all([
  readFile(manifestPath),
  readFile(maintainPath)
]);

const manifest = JSON.parse(manifestBuffer.toString("utf8"));
const batchBuffers = await Promise.all(
  manifest.pilotBatches.map((batch) =>
    readFile(resolve(root, "apps/desktop/src/content/core/packs", batch.file))
  )
);
const pilotEntries = batchBuffers.flatMap((buffer) => JSON.parse(buffer.toString("utf8")));
const maintainEntry = JSON.parse(maintainBuffer.toString("utf8"));
const entries = [maintainEntry, ...pilotEntries];

if (manifest.kind !== "english-focus-core-content-manifest") {
  fail("manifest kind is not recognized");
}

if (manifest.status !== "pilot-validated") {
  fail("manifest status must be pilot-validated");
}

if (!Array.isArray(pilotEntries) || pilotEntries.length !== manifest.pilotEntryCount) {
  fail(`expected ${manifest.pilotEntryCount} pilot entries, found ${pilotEntries.length}`);
}

if (entries.length !== manifest.entryCount) {
  fail(`expected ${manifest.entryCount} total entries, found ${entries.length}`);
}

for (const [index, batch] of manifest.pilotBatches.entries()) {
  const buffer = batchBuffers[index];
  const parsed = JSON.parse(buffer.toString("utf8"));
  if (parsed.length !== batch.entryCount) {
    fail(`${batch.file} declares ${batch.entryCount} entries but contains ${parsed.length}`);
  }
  if (sha256(buffer) !== batch.sha256) {
    fail(`${batch.file} checksum does not match the manifest`);
  }
}

if (sha256(maintainBuffer) !== manifest.maintainEntrySha256) {
  fail("maintain fixture checksum does not match the manifest");
}

const ids = new Set();
const words = new Set();
const cefrCounts = {};
const partOfSpeechCounts = {};

for (const [index, entry] of entries.entries()) {
  const label = entry?.normalizedWord ?? `entry ${index + 1}`;

  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
    fail(`${label} is not an object`);
    continue;
  }

  if (entry.schemaVersion !== manifest.schemaVersion) {
    fail(`${label} uses schema ${entry.schemaVersion}`);
  }

  if (entry.source?.kind !== "core") {
    fail(`${label} is not marked as core content`);
  }

  if (entry.generation?.method !== "core-pack") {
    fail(`${label} is not marked as core-pack content`);
  }

  if (!new Set(["validated", "reviewed"]).has(entry.generation?.validationStatus)) {
    fail(`${label} has an unsupported validation status`);
  }

  if (entry.word?.trim().toLocaleLowerCase("en-US") !== entry.normalizedWord) {
    fail(`${label} has an inconsistent normalized word`);
  }

  if (!Array.isArray(entry.examples) || entry.examples.length !== 10) {
    fail(`${label} must contain exactly 10 primary examples`);
  }

  if (ids.has(entry.id)) {
    fail(`duplicate id ${entry.id}`);
  }
  ids.add(entry.id);

  if (words.has(entry.normalizedWord)) {
    fail(`duplicate normalized word ${entry.normalizedWord}`);
  }
  words.add(entry.normalizedWord);

  cefrCounts[entry.cefr] = (cefrCounts[entry.cefr] ?? 0) + 1;
  for (const partOfSpeech of entry.partsOfSpeech ?? []) {
    partOfSpeechCounts[partOfSpeech] = (partOfSpeechCounts[partOfSpeech] ?? 0) + 1;
  }
}

const sortedWords = [...words].sort((left, right) =>
  left.localeCompare(right, "en", { sensitivity: "base" })
);

if (JSON.stringify(sortedWords) !== JSON.stringify(manifest.words)) {
  fail("manifest word list does not match the bundled catalog");
}

const sortRecord = (record) =>
  Object.fromEntries(Object.entries(record).sort(([left], [right]) => left.localeCompare(right)));

if (JSON.stringify(sortRecord(cefrCounts)) !== JSON.stringify(sortRecord(manifest.cefrCounts))) {
  fail(`CEFR distribution mismatch: ${JSON.stringify(cefrCounts)}`);
}

if (
  JSON.stringify(sortRecord(partOfSpeechCounts)) !==
  JSON.stringify(sortRecord(manifest.partOfSpeechCounts))
) {
  fail(`part-of-speech distribution mismatch: ${JSON.stringify(partOfSpeechCounts)}`);
}

for (const sampleWord of manifest.qualityPolicy.manualSampleWords) {
  if (!words.has(sampleWord)) {
    fail(`manual sample word '${sampleWord}' is missing`);
  }
}

if (process.exitCode === 1) {
  process.exit(1);
}

console.log("Core content check passed.");
console.log(`Content version: ${manifest.contentVersion}`);
console.log(`Entries: ${entries.length}`);
console.log(`CEFR distribution: ${JSON.stringify(cefrCounts)}`);
console.log(`Part-of-speech distribution: ${JSON.stringify(partOfSpeechCounts)}`);
console.log(`Pilot batches: ${manifest.pilotBatches.length}`);
