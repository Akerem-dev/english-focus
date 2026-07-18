import type {
  SaveVocabularyEntryInput,
  StoredVocabularyEntry,
  VocabularyEntry,
  VocabularyStorageLayer
} from "@platform/domain";
import { vocabularyEntrySchema } from "@platform/schemas";

export interface VocabularyEntryEditIssue {
  readonly path: string;
  readonly message: string;
}

export type PrepareVocabularyEntryEditResult =
  | {
      readonly kind: "success";
      readonly input: SaveVocabularyEntryInput;
    }
  | {
      readonly kind: "failure";
      readonly message: string;
      readonly issues: readonly VocabularyEntryEditIssue[];
    };

interface PrepareVocabularyEntryEditOptions {
  readonly original: VocabularyEntry;
  readonly draft: VocabularyEntry;
  readonly layer: VocabularyStorageLayer;
  readonly updatedAt: string;
}

function trimOptional(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function normalizeEditableWord(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en-US");
}

function splitTranslations(values: readonly string[]): readonly string[] {
  return values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function issuePath(path: readonly PropertyKey[]): string {
  return path.reduce<string>((result, segment) => {
    if (typeof segment === "number") {
      return `${result}[${segment}]`;
    }

    const key = String(segment);
    return result.length === 0 ? key : `${result}.${key}`;
  }, "");
}

function createFailure(
  message: string,
  issues: readonly VocabularyEntryEditIssue[]
): PrepareVocabularyEntryEditResult {
  return {
    kind: "failure",
    message,
    issues: Object.freeze([...issues])
  };
}

export function resolveVocabularyEditLayer(
  normalizedWord: string,
  storedEntries: readonly StoredVocabularyEntry[]
): VocabularyStorageLayer {
  return (
    storedEntries.find((record) => record.entry.normalizedWord === normalizedWord)?.layer ??
    "override"
  );
}

/**
 * Converts the editable UI draft into the canonical three-example vocabulary contract.
 * The normalized identity and immutable core pack are protected at this boundary.
 */
export function prepareVocabularyEntryEdit({
  draft,
  layer,
  original,
  updatedAt
}: PrepareVocabularyEntryEditOptions): PrepareVocabularyEntryEditResult {
  const normalizedDraftWord = normalizeEditableWord(draft.word);

  if (normalizedDraftWord !== original.normalizedWord) {
    return createFailure("The entry identity cannot be changed from this editor.", [
      {
        path: "word",
        message: `Keep the headword as “${original.word}”. Create a separate entry for a different word.`
      }
    ]);
  }

  const candidate: VocabularyEntry = {
    ...draft,
    id: original.id,
    word: draft.word.trim(),
    normalizedWord: original.normalizedWord,
    aliases: original.aliases,
    pronunciations: draft.pronunciations.map((pronunciation) => ({
      ...pronunciation,
      ipa: pronunciation.ipa.trim(),
      syllableBreakdown: trimOptional(pronunciation.syllableBreakdown),
      stress: trimOptional(pronunciation.stress)
    })),
    registers: [...new Set(draft.registers)],
    partsOfSpeech: [
      ...new Set([...draft.partsOfSpeech, ...draft.meanings.map((meaning) => meaning.partOfSpeech)])
    ],
    meanings: draft.meanings.map((meaning) => ({
      ...meaning,
      id: meaning.id.trim(),
      definitionEn: meaning.definitionEn.trim(),
      translationsTr: splitTranslations(meaning.translationsTr),
      registers: [...new Set(meaning.registers)],
      usageNoteEn: trimOptional(meaning.usageNoteEn),
      usageNoteTr: trimOptional(meaning.usageNoteTr)
    })),
    morphology: {
      ...draft.morphology,
      baseForm: draft.morphology.baseForm.trim(),
      root: trimOptional(draft.morphology.root),
      prefix: trimOptional(draft.morphology.prefix),
      suffix: trimOptional(draft.morphology.suffix),
      notesEn: trimOptional(draft.morphology.notesEn),
      notesTr: trimOptional(draft.morphology.notesTr),
      inflectedForms: draft.morphology.inflectedForms.map((form) => ({
        ...form,
        form: form.form.trim(),
        normalizedForm: normalizeEditableWord(form.form)
      }))
    },
    etymology:
      draft.etymology === undefined
        ? undefined
        : {
            ...draft.etymology,
            explanationEn: draft.etymology.explanationEn.trim(),
            explanationTr: draft.etymology.explanationTr.trim(),
            originLanguage: trimOptional(draft.etymology.originLanguage),
            originForm: trimOptional(draft.etymology.originForm)
          },
    grammar: {
      ...draft.grammar,
      summaryEn: draft.grammar.summaryEn.trim(),
      summaryTr: draft.grammar.summaryTr.trim()
    },
    examples: draft.examples.map((example) => ({
      ...example,
      sentenceEn: example.sentenceEn.trim(),
      translationTr: example.translationTr.trim(),
      grammarLabel: trimOptional(example.grammarLabel),
      targetForm: trimOptional(example.targetForm),
      context: trimOptional(example.context)
    })),
    source: {
      kind: layer,
      ...(original.source.sourceId === undefined ? {} : { sourceId: original.source.sourceId }),
      sourceLabel: layer === "override" ? "Local edit of bundled vocabulary" : "Local vocabulary"
    },
    generation: {
      method: "manual",
      generatedAt: updatedAt,
      validationStatus: "schema-valid",
      generatorLabel: "English Focus entry editor",
      warnings: []
    },
    createdAt: original.createdAt,
    updatedAt
  };

  const result = vocabularyEntrySchema.safeParse(candidate);

  if (!result.success) {
    const issues = result.error.issues.map<VocabularyEntryEditIssue>((issue) => ({
      path: issuePath(issue.path),
      message: issue.message
    }));

    return createFailure(
      "Some vocabulary fields need attention before this entry can be saved.",
      issues
    );
  }

  return {
    kind: "success",
    input: {
      entry: result.data,
      layer
    }
  };
}
