import type { Tag } from "@platform/domain";

const TURKISH_ASCII_REPLACEMENTS: Readonly<Record<string, string>> = Object.freeze({
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u"
});

function normalizeTagName(name: string): string {
  const ascii = [...name.toLocaleLowerCase("tr-TR")]
    .map((character) => TURKISH_ASCII_REPLACEMENTS[character] ?? character)
    .join("")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

  return ascii
    .replace(/[^a-z0-9 _-]+/g, " ")
    .replace(/[ _-]+/g, " ")
    .trim();
}

function createTag(name: string, createdAt: string): Tag {
  const normalizedName = normalizeTagName(name);

  if (normalizedName.length === 0) {
    throw new Error(`The tag “${name}” does not contain a usable name.`);
  }

  if (normalizedName.length > 80) {
    throw new Error("A normalized tag name cannot exceed 80 characters.");
  }

  return Object.freeze({
    id: `tag:${normalizedName.replace(/ /g, "_")}`,
    name: name.trim(),
    normalizedName,
    createdAt
  });
}

export function parseVocabularyTags(input: string, createdAt: string): readonly Tag[] {
  const names = input
    .split(/[,\n]/)
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
  const byNormalizedName = new Map<string, Tag>();

  for (const name of names) {
    if (name.length > 120) {
      throw new Error("A tag name cannot exceed 120 characters.");
    }

    const tag = createTag(name, createdAt);
    if (!byNormalizedName.has(tag.normalizedName)) {
      byNormalizedName.set(tag.normalizedName, tag);
    }
  }

  if (byNormalizedName.size > 30) {
    throw new Error("A vocabulary entry can contain at most 30 tags.");
  }

  return Object.freeze([...byNormalizedName.values()]);
}
