import { getGrammarTeachingContent } from "../../apps/desktop/src/modules/grammar/knowledge/grammarTeachingContent";

import { expect, test } from "./app.fixture";

const EXPECTED_A1_IDS = Object.freeze([
  "present-simple",
  "be-am-is-are",
  "there-is-there-are",
  "present-continuous",
  "can-could",
  "wh-questions"
]);

test("A1 teaching catalog contains six complete curated lessons", () => {
  for (const lessonId of EXPECTED_A1_IDS) {
    const lesson = getGrammarTeachingContent(lessonId);

    expect(lesson, `${lessonId} should have curated teaching content`).toBeDefined();
    expect(lesson!.formulaParts.length).toBeGreaterThanOrEqual(3);
    expect(lesson!.uses.length).toBeGreaterThanOrEqual(3);
    expect(lesson!.examples.length).toBeGreaterThanOrEqual(4);
    expect(lesson!.mistakes.length).toBeGreaterThanOrEqual(2);
    expect(lesson!.signals.length).toBeGreaterThanOrEqual(8);
    expect(lesson!.practiceChecks).toHaveLength(3);
    expect(lesson!.quickRules).toHaveLength(3);
    expect(lesson!.memoryHook.trim().length).toBeGreaterThan(20);
  }
});
