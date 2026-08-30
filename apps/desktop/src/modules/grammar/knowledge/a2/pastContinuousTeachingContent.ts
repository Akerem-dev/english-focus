import type { GrammarTeachingContent } from "../grammarTeachingContent";

export const PAST_CONTINUOUS_TEACHING_CONTENT: GrammarTeachingContent = {
  id: "past-continuous",
  intro:
    "Use the Past Continuous for an action or situation that was in progress around a particular past time. It often gives the background while the Past Simple tells the shorter event that happened inside that background.",
  sectionTitles: {
    comparison: "Past Continuous vs Past Simple",
    signals: "Background & Interruption Clues"
  },
  formula: "Subject + was / were + verb-ing",
  formulaExplanation:
    "Choose was with I/he/she/it and were with you/we/they. Add -ing to the main verb. Negatives use was not/were not; questions move was/were before the subject.",
  formulaParts: Object.freeze([
    {
      label: "SUBJECT + BE",
      value: "I/he/she/it was · you/we/they were",
      note: "Was/were carries the past tense."
    },
    {
      label: "MAIN VERB",
      value: "verb-ing",
      note: "Use working, reading, running, writing, etc."
    },
    {
      label: "QUESTION / NEGATIVE",
      value: "Was she...? / weren't...",
      note: "Move was/were before the subject for questions; add not for negatives."
    }
  ]),
  table: {
    headers: Object.freeze(["Subject", "Positive", "Negative", "Question"]),
    rows: Object.freeze([
      Object.freeze([
        "I / he / she / it",
        "She was working.",
        "She wasn't working.",
        "Was she working?"
      ]),
      Object.freeze([
        "you / we / they",
        "They were working.",
        "They weren't working.",
        "Were they working?"
      ])
    ])
  },
  uses: Object.freeze([
    {
      title: "Action in progress at a past time",
      explanation: "Show what was happening around a specific point in the past.",
      example: "At 9 p.m., I was studying.",
      translationTr: "Saat 9'da ders çalışıyordum."
    },
    {
      title: "Background in a story",
      explanation: "Describe the scene or longer activity around the main events.",
      example: "The sun was shining and people were sitting outside.",
      translationTr: "Güneş parlıyordu ve insanlar dışarıda oturuyordu."
    },
    {
      title: "Interrupted action",
      explanation:
        "Use Past Continuous for the longer action and Past Simple for the shorter event that interrupts it.",
      example: "I was cooking when the phone rang.",
      translationTr: "Telefon çaldığında yemek yapıyordum."
    },
    {
      title: "Two simultaneous actions",
      explanation: "Use it for two longer activities happening at the same time.",
      example: "While I was cooking, Maya was setting the table.",
      translationTr: "Ben yemek yaparken Maya masayı hazırlıyordu."
    }
  ]),
  examples: Object.freeze([
    {
      label: "Past time",
      sentence: "We were driving home at midnight.",
      translationTr: "Gece yarısı eve doğru araba kullanıyorduk.",
      note: "The action was in progress at that past moment."
    },
    {
      label: "Interruption",
      sentence: "She was sleeping when the alarm went off.",
      translationTr: "Alarm çaldığında uyuyordu.",
      note:
        "Was sleeping is the background action; went off is the shorter completed event."
    },
    {
      label: "While",
      sentence: "While they were talking, I was taking notes.",
      translationTr: "Onlar konuşurken ben not alıyordum.",
      note: "Both actions continued over the same period."
    },
    {
      label: "Negative",
      sentence: "I wasn't listening when he explained it.",
      translationTr: "O açıklarken dinlemiyordum.",
      note: "Use wasn't/weren't + verb-ing for negatives."
    },
    {
      label: "Question",
      sentence: "What were you doing at 8 o'clock?",
      translationTr: "Saat sekizde ne yapıyordun?",
      note: "Move were before the subject; keep the -ing form."
    }
  ]),
  comparison: {
    title: "Background in progress or completed event?",
    left: {
      label: "PAST CONTINUOUS",
      rule: "Longer/background action in progress around a past time.",
      example: "I was walking home...",
      translationTr: "Eve yürüyordum..."
    },
    right: {
      label: "PAST SIMPLE",
      rule: "Completed event that moves the story forward.",
      example: "...when I saw an old friend.",
      translationTr: "...eski bir arkadaşımı gördüğümde."
    },
    takeaway:
      "Use Past Continuous to open the camera on an action already in progress; use Past Simple for the completed event that enters the scene."
  },
  mistakes: Object.freeze([
    {
      wrong: "I was work at 8 p.m.",
      right: "I was working at 8 p.m.",
      why: "Past Continuous requires was/were + verb-ing."
    },
    {
      wrong: "They was waiting outside.",
      right: "They were waiting outside.",
      why: "They takes were, not was."
    },
    {
      wrong: "Did you were sleeping?",
      right: "Were you sleeping?",
      why: "Was/were makes its own questions; do/did is not added."
    },
    {
      wrong: "I was cooking when the phone was ringing.",
      right: "I was cooking when the phone rang.",
      why:
        "For a short completed interruption, Past Simple is normally the natural choice."
    }
  ]),
  signalsLabel: "Expressions that often frame an action in progress",
  signals: Object.freeze([
    "while",
    "when",
    "at 8 p.m. yesterday",
    "at that moment",
    "all evening",
    "as I was...",
    "when suddenly...",
    "meanwhile",
    "at the time",
    "during the journey"
  ]),
  signalsNote:
    "While often introduces a longer background action and when often introduces the event inside it, but meaning—not the connector alone—decides the tense.",
  practiceChecks: Object.freeze([
    {
      prompt: "Complete: At 10 last night, we ___ (watch) a film.",
      answer: "were watching",
      explanation: "The action was in progress at a specific past time; we takes were."
    },
    {
      prompt: "Complete: I ___ (walk) home when it ___ (start) to rain.",
      answer: "was walking; started",
      explanation: "Walking is the background action; started is the shorter completed event."
    },
    {
      prompt: "Correct: Did she was working at six?",
      answer: "Was she working at six?",
      explanation: "Was/were moves before the subject; did is not used."
    }
  ]),
  quickRules: Object.freeze([
    "Past Continuous = was/were + verb-ing for an action in progress around a past time.",
    "Long background action → Past Continuous; short completed event → often Past Simple.",
    "Questions move was/were before the subject; never add did to was/were."
  ]),
  memoryHook:
    "Past Continuous is the background video; Past Simple is the event that clicks into the frame."
};
