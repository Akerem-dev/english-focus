import { A2_GRAMMAR_TEACHING_CONTENT } from "../../apps/desktop/src/modules/grammar/knowledge/grammarTeachingContentA2";

import { expect, test } from "./app.fixture";

const EXPECTED_A2_IDS = Object.freeze([
  "past-simple",
  "used-to",
  "present-perfect",
  "past-continuous",
  "going-to",
  "comparatives"
]);

test("A2 teaching catalog contains six complete curated lessons", () => {
  expect(A2_GRAMMAR_TEACHING_CONTENT.map((lesson) => lesson.id)).toEqual(EXPECTED_A2_IDS);

  for (const lesson of A2_GRAMMAR_TEACHING_CONTENT) {
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
