import type { GrammarTeachingContent } from "../grammarTeachingContent";

export const USED_TO_TEACHING_CONTENT: GrammarTeachingContent = {
  id: "used-to",
  intro:
    "Use used to + base verb for past habits or states that were true before but are not true now, or are understood as different now. It is a compact way to contrast 'then' with 'now'.",
  sectionTitles: {
    comparison: "Used to vs Past Simple",
    signals: "Then-vs-Now Clues"
  },
  formula:
    "Positive: Subject + used to + base verb · Negative: didn't use to + base verb · Question: Did + subject + use to + base verb?",
  formulaExplanation:
    "In positive statements, used to is fixed and is followed by the base verb. In negatives and questions, did carries past tense, so the spelling becomes use to after did/didn't.",
  formulaParts: Object.freeze([
    {
      label: "PAST PATTERN",
      value: "used to + base verb",
      note: "Use for a repeated past behaviour or a past state."
    },
    {
      label: "NEGATIVE",
      value: "didn't use to + base verb",
      note: "After didn't, write use to — did already carries the past."
    },
    {
      label: "QUESTION",
      value: "Did ... use to + base verb?",
      note: "Put did before the subject, then use to + base verb."
    }
  ]),
  table: {
    headers: Object.freeze(["Meaning", "Form", "Example"]),
    rows: Object.freeze([
      Object.freeze(["Past habit", "used to + verb", "I used to cycle to school."]),
      Object.freeze(["Past state", "used to + verb", "She used to be shy."]),
      Object.freeze(["Negative", "didn't use to + verb", "We didn't use to cook."]),
      Object.freeze(["Question", "Did ... use to + verb?", "Did you use to live here?"])
    ])
  },
  uses: Object.freeze([
    {
      title: "Past habits",
      explanation: "Describe something you regularly did in the past but do not normally do now.",
      example: "I used to play football after school.",
      translationTr: "Eskiden okuldan sonra futbol oynardım."
    },
    {
      title: "Past states",
      explanation:
        "Talk about a past condition, possession, belief, or situation that has changed.",
      example: "There used to be a cinema here.",
      translationTr: "Eskiden burada bir sinema vardı."
    },
    {
      title: "Long-term past situations",
      explanation: "Summarise how life was before a change.",
      example: "We used to live near the sea.",
      translationTr: "Eskiden denize yakın yaşardık."
    },
    {
      title: "Clear contrast with now",
      explanation: "Used to naturally suggests that the present situation is different.",
      example: "He used to hate coffee, but now he drinks it every morning.",
      translationTr: "Eskiden kahveden nefret ederdi ama şimdi her sabah içiyor."
    }
  ]),
  examples: Object.freeze([
    {
      label: "Habit",
      sentence: "I used to take the bus to work.",
      translationTr: "Eskiden işe otobüsle giderdim.",
      note: "A repeated past routine that is understood as different now."
    },
    {
      label: "State",
      sentence: "Mina used to have long hair.",
      translationTr: "Mina'nın eskiden uzun saçları vardı.",
      note: "Used to works with states such as have, know, like, and be."
    },
    {
      label: "Negative",
      sentence: "I didn't use to like spicy food.",
      translationTr: "Eskiden acı yemeği sevmezdim.",
      note: "After didn't, write use to, not used to."
    },
    {
      label: "Question",
      sentence: "Did you use to study at night?",
      translationTr: "Eskiden geceleri ders çalışır mıydın?",
      note: "Did + subject + use to + base verb."
    },
    {
      label: "Then and now",
      sentence: "She used to be quiet, but now she's very confident.",
      translationTr: "Eskiden sessizdi ama şimdi çok özgüvenli.",
      note: "The contrast makes the changed situation explicit."
    }
  ]),
  comparison: {
    title: "Are you describing a past pattern, or just reporting one finished event?",
    left: {
      label: "USED TO",
      rule: "Past habit/state with an implied contrast to now.",
      example: "I used to walk to school.",
      translationTr: "Eskiden okula yürürdüm."
    },
    right: {
      label: "PAST SIMPLE",
      rule: "A finished event, or repeated past action when no 'different now' contrast is needed.",
      example: "I walked to school yesterday.",
      translationTr: "Dün okula yürüdüm."
    },
    takeaway:
      "Use used to when the old pattern itself matters and the listener should understand that things are different now."
  },
  mistakes: Object.freeze([
    {
      wrong: "I use to live there.",
      right: "I used to live there.",
      why: "Positive statements use used to + base verb."
    },
    {
      wrong: "I didn't used to cook.",
      right: "I didn't use to cook.",
      why: "Did already marks the past, so use to follows it."
    },
    {
      wrong: "Did she used to work here?",
      right: "Did she use to work here?",
      why: "After did, use the base form use."
    },
    {
      wrong: "I am used to live alone.",
      right: "I used to live alone.",
      why: "Used to + verb means a past habit/state. Be used to has a different meaning: being accustomed to something."
    }
  ]),
  signalsLabel: "Language that often creates a past-vs-present contrast",
  signals: Object.freeze([
    "when I was younger",
    "years ago",
    "back then",
    "in the past",
    "before",
    "but now",
    "these days",
    "no longer",
    "not anymore",
    "as a child"
  ]),
  signalsNote:
    "Used to is chosen because a former habit or state is contrasted with the present. These phrases often make that contrast visible.",
  practiceChecks: Object.freeze([
    {
      prompt: "Complete: We ___ live in a small apartment, but now we have a house.",
      answer: "used to",
      explanation: "The sentence contrasts an old long-term situation with the present."
    },
    {
      prompt: "Correct: She didn't used to eat breakfast.",
      answer: "She didn't use to eat breakfast.",
      explanation: "After didn't, use to is the correct form."
    },
    {
      prompt: "Choose: Did you use to / used to play here?",
      answer: "Did you use to play here?",
      explanation: "Did carries the past marker; use stays in its base form."
    }
  ]),
  quickRules: Object.freeze([
    "Positive: used to + base verb for a past habit or state that is different now.",
    "After did/didn't, write use to + base verb.",
    "Do not confuse used to do with be used to doing; they express different meanings."
  ]),
  memoryHook: "Used to draws a bridge between THEN and NOW — and shows that the situation changed."
};
