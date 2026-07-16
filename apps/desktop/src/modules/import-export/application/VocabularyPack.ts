import type { ImportIssue, VocabularyEntry } from "@platform/domain";

import { assessVocabularyQuality } from "./AssessVocabularyQuality";
import { validateVocabularySchema } from "./ValidateVocabularySchema";
import { validateVocabularySemantics } from "./ValidateVocabularySemantics";

export const VOCABULARY_PACK_KIND = "english-focus-vocabulary-pack" as const;
export const VOCABULARY_PACK_VERSION = "1.0.0" as const;
export const MAX_VOCABULARY_PACK_CHARACTERS = 5_242_880;
export const MAX_VOCABULARY_PACK_BYTES = 5_242_880;
const MAX_VOCABULARY_PACK_ENTRIES = 500;

interface VocabularyPackDocument {
  readonly kind: typeof VOCABULARY_PACK_KIND;
  readonly packVersion: typeof VOCABULARY_PACK_VERSION;
  readonly schemaVersion: string;
  readonly createdAt: string;
  readonly entryCount: number;
  readonly entries: readonly unknown[];
}

export interface VocabularyPackExport {
  readonly fileName: string;
  readonly json: string;
  readonly entryCount: number;
}

type VocabularyPackEntryStatus = "valid" | "invalid";

export interface VocabularyPackEntryAnalysis {
  readonly index: number;
  readonly detectedWord: string;
  readonly status: VocabularyPackEntryStatus;
  readonly entry?: VocabularyEntry | undefined;
  readonly issues: readonly ImportIssue[];
  readonly qualityWarnings: readonly ImportIssue[];
}

export interface VocabularyPackAnalysis {
  readonly document: VocabularyPackDocument;
  readonly entries: readonly VocabularyPackEntryAnalysis[];
  readonly validCount: number;
  readonly invalidCount: number;
  readonly warningCount: number;
}

export type ParseVocabularyPackResult =
  | {
      readonly kind: "success";
      readonly analysis: VocabularyPackAnalysis;
    }
  | {
      readonly kind: "failure";
      readonly message: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatDateStamp(isoDate: string): string {
  return isoDate.slice(0, 10);
}

function detectWord(value: unknown, index: number): string {
  if (isRecord(value)) {
    const normalizedWord = value.normalizedWord;
    if (typeof normalizedWord === "string" && normalizedWord.trim().length > 0) {
      return normalizedWord.trim();
    }

    const word = value.word;
    if (typeof word === "string" && word.trim().length > 0) {
      return word.trim();
    }
  }

  return `Entry ${index + 1}`;
}

function packIssue(
  code: string,
  index: number,
  message: string,
  pathText = `entries[${index}]`
): ImportIssue {
  return Object.freeze({
    source: "semantic",
    severity: "error",
    code,
    path: Object.freeze(["entries", index]),
    pathText,
    message
  });
}

function createDocument(
  entries: readonly VocabularyEntry[],
  createdAt: string
): VocabularyPackDocument {
  const sortedEntries = [...entries].sort((left, right) =>
    left.normalizedWord.localeCompare(right.normalizedWord, "en", { sensitivity: "base" })
  );

  return Object.freeze({
    kind: VOCABULARY_PACK_KIND,
    packVersion: VOCABULARY_PACK_VERSION,
    schemaVersion: "1.0.0",
    createdAt,
    entryCount: sortedEntries.length,
    entries: Object.freeze(sortedEntries)
  });
}

export function exportVocabularyPack(
  entries: readonly VocabularyEntry[],
  createdAt = new Date().toISOString()
): VocabularyPackExport {
  const document = createDocument(entries, createdAt);

  return Object.freeze({
    fileName: `english-focus-vocabulary-pack-${formatDateStamp(createdAt)}.json`,
    json: `${JSON.stringify(document, null, 2)}\n`,
    entryCount: document.entryCount
  });
}

function parsePackDocument(value: unknown): VocabularyPackDocument | string {
  if (!isRecord(value)) {
    return "The vocabulary pack must be a top-level JSON object.";
  }

  if (value.kind !== VOCABULARY_PACK_KIND) {
    return `Pack kind must be “${VOCABULARY_PACK_KIND}”.`;
  }

  if (value.packVersion !== VOCABULARY_PACK_VERSION) {
    return `Pack version must be “${VOCABULARY_PACK_VERSION}”.`;
  }

  if (typeof value.schemaVersion !== "string" || value.schemaVersion.trim().length === 0) {
    return "The pack must declare a schemaVersion.";
  }

  if (typeof value.createdAt !== "string" || Number.isNaN(Date.parse(value.createdAt))) {
    return "The pack createdAt value must be a valid ISO timestamp.";
  }

  if (!Array.isArray(value.entries)) {
    return "The pack entries field must be an array.";
  }

  if (value.entries.length === 0) {
    return "The vocabulary pack does not contain any entries.";
  }

  if (value.entries.length > MAX_VOCABULARY_PACK_ENTRIES) {
    return `The pack exceeds the ${MAX_VOCABULARY_PACK_ENTRIES.toLocaleString("en-US")} entry safety limit.`;
  }

  if (typeof value.entryCount !== "number" || !Number.isInteger(value.entryCount)) {
    return "The pack entryCount must be an integer.";
  }

  if (value.entryCount !== value.entries.length) {
    return `The pack declares ${value.entryCount} entries but contains ${value.entries.length}.`;
  }

  return Object.freeze({
    kind: VOCABULARY_PACK_KIND,
    packVersion: VOCABULARY_PACK_VERSION,
    schemaVersion: value.schemaVersion,
    createdAt: value.createdAt,
    entryCount: value.entryCount,
    entries: Object.freeze([...value.entries])
  });
}

function analyzeVocabularyPack(document: VocabularyPackDocument): VocabularyPackAnalysis {
  const seenWords = new Map<string, number>();

  const entries = document.entries.map<VocabularyPackEntryAnalysis>((value, index) => {
    const detectedWord = detectWord(value, index);
    const schemaResult = validateVocabularySchema(value);

    if (schemaResult.kind === "failure") {
      return Object.freeze({
        index,
        detectedWord,
        status: "invalid",
        issues: schemaResult.issues,
        qualityWarnings: [] as const
      });
    }

    const previousIndex = seenWords.get(schemaResult.entry.normalizedWord);
    if (previousIndex !== undefined) {
      return Object.freeze({
        index,
        detectedWord: schemaResult.entry.normalizedWord,
        status: "invalid",
        entry: schemaResult.entry,
        issues: Object.freeze([
          packIssue(
            "duplicate_pack_entry",
            index,
            `The pack repeats “${schemaResult.entry.normalizedWord}”; the first copy is entries[${previousIndex}].`,
            `entries[${index}].normalizedWord`
          )
        ]),
        qualityWarnings: [] as const
      });
    }

    seenWords.set(schemaResult.entry.normalizedWord, index);

    const semanticResult = validateVocabularySemantics(
      schemaResult.entry,
      schemaResult.entry.normalizedWord,
      "vocabulary-pack-transfer"
    );

    if (semanticResult.kind === "failure") {
      return Object.freeze({
        index,
        detectedWord: schemaResult.entry.normalizedWord,
        status: "invalid",
        entry: schemaResult.entry,
        issues: semanticResult.issues,
        qualityWarnings: [] as const
      });
    }

    const qualityResult = assessVocabularyQuality(schemaResult.entry);

    return Object.freeze({
      index,
      detectedWord: schemaResult.entry.normalizedWord,
      status: "valid",
      entry: schemaResult.entry,
      issues: [] as const,
      qualityWarnings: qualityResult.kind === "warnings" ? qualityResult.issues : ([] as const)
    });
  });

  const validCount = entries.filter((entry) => entry.status === "valid").length;
  const invalidCount = entries.length - validCount;
  const warningCount = entries.reduce((total, entry) => total + entry.qualityWarnings.length, 0);

  return Object.freeze({
    document,
    entries: Object.freeze(entries),
    validCount,
    invalidCount,
    warningCount
  });
}

export function parseVocabularyPackJson(input: string): ParseVocabularyPackResult {
  if (input.length > MAX_VOCABULARY_PACK_CHARACTERS) {
    return Object.freeze({
      kind: "failure",
      message: `The file exceeds the ${MAX_VOCABULARY_PACK_CHARACTERS.toLocaleString("en-US")} character safety limit.`
    });
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(input);
  } catch (cause) {
    return Object.freeze({
      kind: "failure",
      message: cause instanceof Error ? cause.message : "The vocabulary pack is not valid JSON."
    });
  }

  const document = parsePackDocument(parsed);

  if (typeof document === "string") {
    return Object.freeze({ kind: "failure", message: document });
  }

  return Object.freeze({ kind: "success", analysis: analyzeVocabularyPack(document) });
}
