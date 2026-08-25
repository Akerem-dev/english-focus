import { describe, expect, it } from "vitest";

import {
  GRAMMAR_ATLAS_CACHE_COUNT,
  GRAMMAR_ATLAS_PLANNED_COUNT,
  GRAMMAR_CORE_FAMILY_COUNT,
  GRAMMAR_KNOWLEDGE_AREAS,
  GRAMMAR_KNOWLEDGE_LESSONS,
  type GrammarSubtopic
} from "../../../src/modules/grammar/knowledge/grammarKnowledgeIndex";

describe("grammar knowledge hierarchy", () => {
  it("keeps the six frozen Word Valley grammar areas", () => {
    expect(GRAMMAR_KNOWLEDGE_AREAS.map((area) => area.title)).toEqual([
      "Tenses & Time",
      "Nouns & Articles",
      "Modals & Verb Patterns",
      "Clauses & Conditionals",
      "Prepositions & Linkers",
      "Adjectives & Adverbs"
    ]);
  });

  it("groups the full atlas under a compact lesson hierarchy", () => {
    const subtopics: readonly GrammarSubtopic[] = GRAMMAR_KNOWLEDGE_LESSONS.flatMap(
      (lesson) => lesson.subtopics
    );
    const uniqueIds = new Set(subtopics.map((topic) => topic.cardId));

    expect(GRAMMAR_KNOWLEDGE_LESSONS).toHaveLength(35);
    expect(subtopics).toHaveLength(GRAMMAR_ATLAS_PLANNED_COUNT);
    expect(uniqueIds.size).toBe(GRAMMAR_ATLAS_PLANNED_COUNT);
    expect(subtopics.filter((topic) => topic.cacheAvailable)).toHaveLength(
      GRAMMAR_ATLAS_CACHE_COUNT
    );
  });

  it("keeps the four fail-closed atlas gaps explicit", () => {
    const unavailable = GRAMMAR_KNOWLEDGE_LESSONS.flatMap((lesson) => lesson.subtopics)
      .filter((topic) => !topic.cacheAvailable)
      .map((topic) => topic.cardId)
      .sort();

    expect(unavailable).toEqual(["A010", "A014", "A087", "A150"]);
    expect(GRAMMAR_CORE_FAMILY_COUNT).toBe(13);
  });
});
