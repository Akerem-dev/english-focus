import { z } from "zod";

import { vocabularyEntryInputSchema } from "./vocabulary-entry.schema";

export const VOCABULARY_PACK_KIND = "english-focus-vocabulary-pack" as const;
export const VOCABULARY_PACK_VERSION = "1.0.0" as const;
export const MAX_VOCABULARY_PACK_ENTRIES = 500;

export const vocabularyPackSchema = z
  .strictObject({
    kind: z.literal(VOCABULARY_PACK_KIND),
    packVersion: z.literal(VOCABULARY_PACK_VERSION),
    schemaVersion: z.literal("1.0.0"),
    createdAt: z.string().datetime({ offset: true }),
    entryCount: z.number().int().positive().max(MAX_VOCABULARY_PACK_ENTRIES),
    entries: z.array(vocabularyEntryInputSchema).min(1).max(MAX_VOCABULARY_PACK_ENTRIES)
  })
  .superRefine((pack, context) => {
    if (pack.entryCount !== pack.entries.length) {
      context.addIssue({
        code: "custom",
        path: ["entryCount"],
        message: `Declared entryCount ${pack.entryCount} does not match ${pack.entries.length} entries.`
      });
    }

    const seen = new Set<string>();
    pack.entries.forEach((entry, index) => {
      if (seen.has(entry.normalizedWord)) {
        context.addIssue({
          code: "custom",
          path: ["entries", index, "normalizedWord"],
          message: `Duplicate normalized word: ${entry.normalizedWord}.`
        });
      }
      seen.add(entry.normalizedWord);
    });
  });

export type VocabularyPack = z.infer<typeof vocabularyPackSchema>;
