import { toJSONSchema } from "zod";

import { vocabularyEntrySchema } from "./vocabulary-entry.schema";

/** JSON Schema representation embedded into future external-AI instructions. */
export const vocabularyEntryJsonSchema = toJSONSchema(vocabularyEntrySchema, {
  io: "output",
  reused: "ref"
});
