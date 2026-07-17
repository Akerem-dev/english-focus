import type {
  InflectionType,
  PartOfSpeech,
  PronunciationVariant,
  Register,
  VocabularyEntry
} from "@platform/domain";

const LABELS = {
  partOfSpeech: {
    adjective: "Adjective",
    adverb: "Adverb",
    auxiliary: "Auxiliary",
    conjunction: "Conjunction",
    determiner: "Determiner",
    interjection: "Interjection",
    noun: "Noun",
    phrase: "Phrase",
    "phrasal-verb": "Phrasal verb",
    idiom: "Idiom",
    modal: "Modal",
    other: "Other",
    preposition: "Preposition",
    pronoun: "Pronoun",
    verb: "Verb"
  } satisfies Record<PartOfSpeech, string>,
  pronunciation: {
    au: "AU",
    general: "General",
    other: "Other",
    uk: "UK",
    us: "US"
  } satisfies Record<PronunciationVariant, string>,
  register: {
    academic: "Academic",
    business: "Business",
    formal: "Formal",
    informal: "Informal",
    legal: "Legal",
    literary: "Literary",
    neutral: "Neutral",
    slang: "Slang",
    spoken: "Spoken",
    technical: "Technical",
    written: "Written",
    archaic: "Archaic"
  } satisfies Record<Register, string>,
  inflection: {
    base: "Base form",
    comparative: "Comparative",
    other: "Other",
    past: "Past",
    "past-participle": "Past participle",
    plural: "Plural",
    "present-participle": "Present participle",
    superlative: "Superlative",
    "third-person-singular": "Third-person singular"
  } satisfies Record<InflectionType, string>
} as const;

export interface VocabularyEntryPresentation {
  readonly primaryTranslation: string;
  readonly partOfSpeechLabel: string;
  readonly registerLabels: readonly string[];
  readonly sourceLabel: string;
}

export function presentVocabularyEntry(entry: VocabularyEntry): VocabularyEntryPresentation {
  const primaryTranslations = Array.from(
    new Set(entry.meanings.flatMap((meaning) => meaning.translationsTr))
  ).slice(0, 4);

  return {
    primaryTranslation: primaryTranslations.join(", "),
    partOfSpeechLabel: entry.partsOfSpeech.map(formatPartOfSpeech).join(" · "),
    registerLabels: entry.registers.map(formatRegister),
    sourceLabel: entry.source.sourceLabel ?? "Local vocabulary"
  };
}

export function formatPartOfSpeech(value: PartOfSpeech): string {
  return LABELS.partOfSpeech[value];
}

export function formatPronunciationVariant(value: PronunciationVariant): string {
  return LABELS.pronunciation[value];
}

export function formatRegister(value: Register): string {
  return LABELS.register[value];
}

export function formatInflectionType(value: InflectionType): string {
  return LABELS.inflection[value];
}

export function formatPlainLabel(value: string): string {
  return value
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
