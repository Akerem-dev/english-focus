import type { GrammarTeachingContent } from "../grammarTeachingContent";

export const PAST_SIMPLE_TEACHING_CONTENT: GrammarTeachingContent = {
  id: "past-simple",
  intro:
    "Use the Past Simple for actions, events, and states that are finished in a completed past time. The key idea is a closed past situation: the event is over and the time is treated as finished.",
  sectionTitles: {
    comparison: "Past Simple vs Present Perfect",
    signals: "Finished-Time Clues"
  },
  formula:
    "Positive: Subject + past form (V2) · Negative: did not + base verb · Question: Did + subject + base verb?",
  formulaExplanation:
    "Positive sentences carry past time on the main verb: regular verbs usually add -ed and irregular verbs use a special past form. In negatives and questions, did carries the past meaning, so the main verb returns to its base form.",
  formulaParts: Object.freeze([
    {
      label: "POSITIVE",
      value: "worked / went / saw",
      note: "Use the past form once: regular -ed or the irregular V2 form."
    },
    {
      label: "NEGATIVE",
      value: "didn't + base verb",
      note: "Did already marks the past, so use work, go, see — not worked, went, saw."
    },
    {
      label: "QUESTION",
      value: "Did + subject + base verb?",
      note: "Put did before the subject and keep the main verb in base form."
    }
  ]),
  table: {
    headers: Object.freeze(["Type", "Regular verb: work", "Irregular verb: go"]),
    rows: Object.freeze([
      Object.freeze(["Positive", "I worked.", "I went."]),
      Object.freeze(["Negative", "I didn't work.", "I didn't go."]),
      Object.freeze(["Question", "Did you work?", "Did you go?"])
    ])
  },
  uses: Object.freeze([
    {
      title: "One completed past event",
      explanation: "Talk about something that started and finished in the past.",
      example: "I called Maya after dinner.",
      translationTr: "Akşam yemeğinden sonra Maya'yı aradım."
    },
    {
      title: "A sequence of finished events",
      explanation: "Move a story forward from one completed action to the next.",
      example: "He opened the door, walked in, and sat down.",
      translationTr: "Kapıyı açtı, içeri girdi ve oturdu."
    },
    {
      title: "Past states and facts",
      explanation: "Describe a situation that was true in a finished past period.",
      example: "We lived in Bursa for three years, then we moved.",
      translationTr: "Üç yıl Bursa'da yaşadık, sonra taşındık."
    },
    {
      title: "Repeated actions in a finished period",
      explanation:
        "Use the Past Simple when repeated behaviour belongs to a past period that is now over.",
      example: "I walked to school every day when I was ten.",
      translationTr: "On yaşındayken her gün okula yürürdüm."
    }
  ]),
  examples: Object.freeze([
    {
      label: "Regular verb",
      sentence: "They visited the museum last Saturday.",
      translationTr: "Geçen cumartesi müzeyi ziyaret ettiler.",
      note: "Visit is regular, so the positive past form is visited."
    },
    {
      label: "Irregular verb",
      sentence: "She bought a new laptop yesterday.",
      translationTr: "Dün yeni bir dizüstü bilgisayar aldı.",
      note: "Buy is irregular: buy → bought."
    },
    {
      label: "Negative",
      sentence: "We didn't see the message.",
      translationTr: "Mesajı görmedik.",
      note: "After didn't, use the base form see — not saw."
    },
    {
      label: "Question",
      sentence: "Did you finish the report?",
      translationTr: "Raporu bitirdin mi?",
      note: "Did marks the past; finish stays in base form."
    },
    {
      label: "Past state",
      sentence: "I was nervous before the interview.",
      translationTr: "Mülakattan önce gergindim.",
      note: "The past of be is was/were and does not use did in ordinary be questions or negatives."
    }
  ]),
  comparison: {
    title: "Is the past time finished, or is the past connected to now?",
    left: {
      label: "PAST SIMPLE",
      rule: "Use a finished past time or a completed past event.",
      example: "I visited Rome in 2024.",
      translationTr: "2024'te Roma'yı ziyaret ettim."
    },
    right: {
      label: "PRESENT PERFECT",
      rule: "Do not name a finished past time; focus on experience or a result connected to now.",
      example: "I have visited Rome twice.",
      translationTr: "Roma'yı iki kez ziyaret ettim."
    },
    takeaway:
      "If the sentence answers a finished 'When?' such as yesterday, last year, or in 2024, Past Simple is normally the safe choice."
  },
  mistakes: Object.freeze([
    {
      wrong: "Did you went there?",
      right: "Did you go there?",
      why: "Did already carries past tense, so the main verb must be the base form."
    },
    {
      wrong: "She didn't saw him.",
      right: "She didn't see him.",
      why: "After didn't, use the base form see."
    },
    {
      wrong: "I goed home early.",
      right: "I went home early.",
      why: "Go is irregular: its Past Simple form is went."
    },
    {
      wrong: "I have seen her yesterday.",
      right: "I saw her yesterday.",
      why: "Yesterday is a finished past time, so use Past Simple rather than Present Perfect."
    }
  ]),
  signalsLabel: "Common clues for a finished past frame",
  signals: Object.freeze([
    "yesterday",
    "last night",
    "last week",
    "two days ago",
    "in 2024",
    "when I was...",
    "then",
    "after that",
    "on Monday",
    "from 2019 to 2022"
  ]),
  signalsNote:
    "These expressions often create a closed past time. They are strong clues, but always confirm that the speaker treats the time or event as finished.",
  practiceChecks: Object.freeze([
    {
      prompt: "She ___ (buy) this phone last month.",
      answer: "bought",
      explanation:
        "Last month is a finished past time, and buy has the irregular past form bought."
    },
    {
      prompt: "Correct the question: Did they arrived on time?",
      answer: "Did they arrive on time?",
      explanation: "Did carries past tense, so arrive stays in base form."
    },
    {
      prompt: "Choose: I saw / have seen him yesterday.",
      answer: "I saw him yesterday.",
      explanation: "Yesterday names a finished past time, so Past Simple is required."
    }
  ]),
  quickRules: Object.freeze([
    "Positive Past Simple: use one past form — regular -ed or an irregular V2 form.",
    "With did/didn't, the main verb always returns to base form.",
    "Finished past time named? Prefer Past Simple, not Present Perfect."
  ]),
  memoryHook:
    "Closed past time = Past Simple. Did carries the past, so the main verb stays simple."
};
