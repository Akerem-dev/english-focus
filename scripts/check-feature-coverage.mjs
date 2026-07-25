import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const matrixPath = path.join(repositoryRoot, "testing", "feature-coverage.json");

const requiredAutomatedFeatureIds = [
  "vocabulary.search",
  "vocabulary.missing-word-flow",
  "vocabulary.edit",
  "vocabulary.personal-metadata",
  "library.browse-filter-sort",
  "library.bulk-export",
  "import-export.single-entry",
  "import-export.pack",
  "import-export.duplicates",
  "settings.preferences",
  "backup.restore-retention",
  "maintenance.diagnostics",
  "maintenance.data-reset",
  "activity.history",
  "desktop.commands-keyboard",
  "desktop.accessibility-responsive",
  "storage.migrations-contracts",
  "content.core-validation",
  "release.windows",
  "performance.local-scale"
];

const requiredManualCheckIds = [
  "windows.real-installer-lifecycle",
  "windows.native-file-dialogs",
  "accessibility.real-screen-reader",
  "backup.scheduled-time-behavior",
  "release.authenticode"
];

function fail(message) {
  console.error(`Feature coverage check failed: ${message}`);
  process.exitCode = 1;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizedRepositoryPath(relativePath) {
  if (!isNonEmptyString(relativePath)) {
    throw new Error("evidence path must be a non-empty string");
  }

  const normalized = path.normalize(relativePath);
  if (
    path.isAbsolute(normalized) ||
    normalized.startsWith(`..${path.sep}`) ||
    normalized === ".."
  ) {
    throw new Error(`evidence path must stay inside the repository: ${relativePath}`);
  }

  return normalized;
}

function checkUniqueIds(items, groupName) {
  const seen = new Set();

  for (const item of items) {
    if (!isNonEmptyString(item?.id)) {
      fail(`${groupName} contains an item without an id.`);
      continue;
    }

    if (seen.has(item.id)) {
      fail(`${groupName} contains duplicate id '${item.id}'.`);
      continue;
    }

    seen.add(item.id);
  }

  return seen;
}

if (!fs.existsSync(matrixPath)) {
  fail("testing/feature-coverage.json is missing.");
} else {
  const matrix = JSON.parse(fs.readFileSync(matrixPath, "utf8"));

  if (matrix.version !== 1) {
    fail(`unsupported matrix version '${matrix.version}'.`);
  }

  const automatedFeatures = Array.isArray(matrix.automatedFeatures) ? matrix.automatedFeatures : [];
  const manualChecks = Array.isArray(matrix.manualChecks) ? matrix.manualChecks : [];

  const automatedIds = checkUniqueIds(automatedFeatures, "automatedFeatures");
  const manualIds = checkUniqueIds(manualChecks, "manualChecks");

  for (const requiredId of requiredAutomatedFeatureIds) {
    if (!automatedIds.has(requiredId)) {
      fail(`required automated feature '${requiredId}' is not mapped.`);
    }
  }

  for (const requiredId of requiredManualCheckIds) {
    if (!manualIds.has(requiredId)) {
      fail(`required manual check '${requiredId}' is not documented.`);
    }
  }

  for (const id of automatedIds) {
    if (manualIds.has(id)) {
      fail(`id '${id}' appears in both automated and manual coverage.`);
    }
  }

  let evidenceCount = 0;

  for (const feature of automatedFeatures) {
    if (!isNonEmptyString(feature?.label)) {
      fail(`automated feature '${feature?.id ?? "unknown"}' has no label.`);
    }

    if (!Array.isArray(feature?.evidence) || feature.evidence.length === 0) {
      fail(`automated feature '${feature?.id ?? "unknown"}' has no evidence.`);
      continue;
    }

    for (const evidence of feature.evidence) {
      try {
        const relativePath = normalizedRepositoryPath(evidence.path);
        const absolutePath = path.join(repositoryRoot, relativePath);

        if (!fs.existsSync(absolutePath)) {
          fail(`'${feature.id}' references missing file '${evidence.path}'.`);
          continue;
        }

        if (!fs.statSync(absolutePath).isFile()) {
          fail(`'${feature.id}' references a non-file path '${evidence.path}'.`);
          continue;
        }

        if (!isNonEmptyString(evidence.contains)) {
          fail(`'${feature.id}' evidence '${evidence.path}' has no content marker.`);
          continue;
        }

        const source = fs.readFileSync(absolutePath, "utf8");
        if (!source.includes(evidence.contains)) {
          fail(
            `'${feature.id}' evidence '${evidence.path}' no longer contains '${evidence.contains}'.`
          );
          continue;
        }

        evidenceCount += 1;
      } catch (error) {
        fail(`'${feature?.id ?? "unknown"}' has invalid evidence: ${error.message}`);
      }
    }
  }

  for (const check of manualChecks) {
    if (!isNonEmptyString(check?.label)) {
      fail(`manual check '${check?.id ?? "unknown"}' has no label.`);
    }
  }

  if (!process.exitCode) {
    console.log(
      `Feature coverage OK: ${automatedFeatures.length} automated features map to ${evidenceCount} executable test targets; ${manualChecks.length} Windows/manual checks are documented.`
    );
  }
}
