import { B1_GRAMMAR_TEACHING_CONTENT } from "../../apps/desktop/src/modules/grammar/knowledge/grammarTeachingContentB1";

import { expect, test } from "./app.fixture";

const EXPECTED_B1_IDS = Object.freeze([
  "future-continuous",
  "present-perfect-continuous",
  "modal-perfects",
  "relative-clauses",
  "passive-voice",
  "reported-speech"
]);

test("B1 teaching catalog contains six complete curated lessons", () => {
  expect(B1_GRAMMAR_TEACHING_CONTENT.map((lesson) => lesson.id)).toEqual(EXPECTED_B1_IDS);

  for (const lesson of B1_GRAMMAR_TEACHING_CONTENT) {
    expect(lesson.formulaParts.length).toBeGreaterThanOrEqual(3);
    expect(lesson.uses.length).toBeGreaterThanOrEqual(4);
    expect(lesson.examples.length).toBeGreaterThanOrEqual(4);
    expect(lesson.mistakes.length).toBeGreaterThanOrEqual(3);
    expect(lesson.signals.length).toBeGreaterThanOrEqual(8);
    expect(lesson.practiceChecks).toHaveLength(3);
    expect(lesson.quickRules).toHaveLength(3);
    expect(lesson.memoryHook.trim().length).toBeGreaterThan(20);
  }
});
