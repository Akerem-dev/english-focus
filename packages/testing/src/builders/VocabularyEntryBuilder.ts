import {
  VOCABULARY_SCHEMA_VERSION,
  type ExampleSentence,
  type VocabularyEntry
} from "@platform/domain";

const DEFAULT_TIMESTAMP = "2026-01-01T00:00:00.000Z";
const DEFAULT_EXAMPLE_COUNT = 3;

function createDefaultExamples(): readonly ExampleSentence[] {
  return Array.from({ length: DEFAULT_EXAMPLE_COUNT }, (_, index) => ({
    id: `test.example.${String(index + 1).padStart(2, "0")}`,
    sentenceEn: `The team will maintain standard number ${index + 1}.`,
    translationTr: `Ekip ${index + 1}. standardı koruyacak.`,
    registers: ["neutral"],
    grammarLabel: "maintain + noun",
    targetForm: "maintain a standard",
    context: "test fixture"
  }));
}

function createDefaultEntry(): VocabularyEntry {
  return {
    schemaVersion: VOCABULARY_SCHEMA_VERSION,
    id: "test.maintain.v1",
    word: "maintain",
    normalizedWord: "maintain",
    aliases: ["maintains", "maintained", "maintaining"],
    pronunciations: [
      {
        ipa: "/meɪnˈteɪn/",
        variant: "general",
        syllableBreakdown: "main-tain",
        stress: "second syllable"
      }
    ],
    cefr: "B2",
    registers: ["neutral"],
    partsOfSpeech: ["verb"],
    meanings: [
      {
        id: "test.maintain.keep-state",
        partOfSpeech: "verb",
        definitionEn: "To keep something at the same level or in the same condition.",
        translationsTr: ["sürdürmek", "korumak"],
        registers: ["neutral"]
      }
    ],
    morphology: {
      baseForm: "maintain",
      root: "maintain",
      inflectedForms: [
        {
          form: "maintained",
          normalizedForm: "maintained",
          type: "past"
        },
        {
          form: "maintaining",
          normalizedForm: "maintaining",
          type: "present-participle"
        }
      ]
    },
    wordFamily: [
      {
        word: "maintenance",
        normalizedWord: "maintenance",
        partOfSpeech: "noun",
        relation: "derived",
        translationTr: "bakım"
      }
    ],
    grammar: {
      summaryEn: "Maintain is a transitive verb and normally takes a direct object.",
      summaryTr: "Maintain geçişli bir fiildir ve normalde doğrudan nesne alır.",
      patterns: [],
      tenseExamples: [],
      sentenceForms: [],
      prepositionPatterns: []
    },
    collocations: [],
    phrasalVerbs: [],
    idioms: [],
    relatedWords: [],
    commonMistakes: [],
    examples: createDefaultExamples(),
    source: {
      kind: "core",
      sourceId: "test-core",
      sourceLabel: "Test core vocabulary"
    },
    generation: {
      method: "core-pack",
      generatedAt: DEFAULT_TIMESTAMP,
      validationStatus: "validated",
      generatorLabel: "VocabularyEntryBuilder",
      warnings: []
    },
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP
  };
}

/** Fluent builder for tests that need a structurally valid vocabulary entry. */
export class VocabularyEntryBuilder {
  private entry: VocabularyEntry;

  constructor(seed: VocabularyEntry = createDefaultEntry()) {
    this.entry = structuredClone(seed);
  }

  with(overrides: Partial<VocabularyEntry>): this {
    this.entry = {
      ...this.entry,
      ...structuredClone(overrides)
    };
    return this;
  }

  withWord(word: string, normalizedWord = word.trim().toLowerCase()): this {
    this.entry = {
      ...this.entry,
      word,
      normalizedWord
    };
    return this;
  }

  withExamples(examples: readonly ExampleSentence[]): this {
    this.entry = {
      ...this.entry,
      examples: structuredClone(examples)
    };
    return this;
  }

  build(): VocabularyEntry {
    return structuredClone(this.entry);
  }
}

export function createVocabularyEntryBuilder(seed?: VocabularyEntry): VocabularyEntryBuilder {
  return seed === undefined ? new VocabularyEntryBuilder() : new VocabularyEntryBuilder(seed);
}
