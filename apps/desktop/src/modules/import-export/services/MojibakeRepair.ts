const WINDOWS_1252_REVERSE = new Map<string, number>([
  ["€", 0x80],
  ["‚", 0x82],
  ["ƒ", 0x83],
  ["„", 0x84],
  ["…", 0x85],
  ["†", 0x86],
  ["‡", 0x87],
  ["ˆ", 0x88],
  ["‰", 0x89],
  ["Š", 0x8a],
  ["‹", 0x8b],
  ["Œ", 0x8c],
  ["Ž", 0x8e],
  ["‘", 0x91],
  ["’", 0x92],
  ["“", 0x93],
  ["”", 0x94],
  ["•", 0x95],
  ["–", 0x96],
  ["—", 0x97],
  ["˜", 0x98],
  ["™", 0x99],
  ["š", 0x9a],
  ["›", 0x9b],
  ["œ", 0x9c],
  ["ž", 0x9e],
  ["Ÿ", 0x9f]
]);

const MOJIBAKE_MARKER_PATTERN = /[ÃÂÄÅâ�]/gu;

export interface MojibakeRepairResult<T> {
  readonly value: T;
  readonly changed: boolean;
  readonly repairedStringCount: number;
}

function markerScore(value: string): number {
  return value.match(MOJIBAKE_MARKER_PATTERN)?.length ?? 0;
}

function toWindows1252Byte(character: string): number | undefined {
  const mapped = WINDOWS_1252_REVERSE.get(character);
  if (mapped !== undefined) {
    return mapped;
  }

  const codePoint = character.codePointAt(0);
  return codePoint !== undefined && codePoint <= 0xff ? codePoint : undefined;
}

function decodeCandidate(segment: string): string | undefined {
  if (markerScore(segment) === 0) {
    return undefined;
  }

  const bytes: number[] = [];
  for (const character of segment) {
    const byte = toWindows1252Byte(character);
    if (byte === undefined) {
      return undefined;
    }
    bytes.push(byte);
  }

  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes));
    if (decoded.includes("�") || markerScore(decoded) >= markerScore(segment)) {
      return undefined;
    }
    return decoded;
  } catch {
    return undefined;
  }
}

export function repairMojibakeText(value: string): MojibakeRepairResult<string> {
  let changed = false;
  let repairedStringCount = 0;
  let segment = "";
  let output = "";

  function flushSegment() {
    if (segment.length === 0) {
      return;
    }

    const decoded = decodeCandidate(segment);
    if (decoded === undefined) {
      output += segment;
    } else {
      output += decoded;
      changed = true;
      repairedStringCount += 1;
    }
    segment = "";
  }

  for (const character of value) {
    if (toWindows1252Byte(character) === undefined) {
      flushSegment();
      output += character;
    } else {
      segment += character;
    }
  }
  flushSegment();

  return {
    value: changed ? output : value,
    changed,
    repairedStringCount
  };
}

function repairUnknown(value: unknown): MojibakeRepairResult<unknown> {
  if (typeof value === "string") {
    return repairMojibakeText(value);
  }

  if (Array.isArray(value)) {
    let changed = false;
    let repairedStringCount = 0;
    const repairedItems = value.map((item) => {
      const repaired = repairUnknown(item);
      changed ||= repaired.changed;
      repairedStringCount += repaired.repairedStringCount;
      return repaired.value;
    });

    return {
      value: changed ? repairedItems : value,
      changed,
      repairedStringCount
    };
  }

  if (typeof value === "object" && value !== null) {
    let changed = false;
    let repairedStringCount = 0;
    const repairedEntries = Object.entries(value).map(([key, nestedValue]) => {
      const repaired = repairUnknown(nestedValue);
      changed ||= repaired.changed;
      repairedStringCount += repaired.repairedStringCount;
      return [key, repaired.value] as const;
    });

    return {
      value: changed ? Object.fromEntries(repairedEntries) : value,
      changed,
      repairedStringCount
    };
  }

  return { value, changed: false, repairedStringCount: 0 };
}

export function repairMojibakeJsonValue<T>(value: T): MojibakeRepairResult<T> {
  const repaired = repairUnknown(value);
  return {
    value: repaired.value as T,
    changed: repaired.changed,
    repairedStringCount: repaired.repairedStringCount
  };
}
