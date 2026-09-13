import type { GrammarTeachingContent } from "../grammarTeachingContent";

export const PRESENT_PERFECT_CONTINUOUS_TEACHING_CONTENT: GrammarTeachingContent = {
  id: "present-perfect-continuous",
  intro:
    "Use the Present Perfect Continuous to connect an activity in the past with now, especially when the activity has continued for a period of time or has recently stopped but has a visible present result. The focus is usually on duration or activity rather than a completed result.",
  sectionTitles: {
    comparison: "Present Perfect Continuous vs Present Perfect",
    signals: "Duration & Recent-Activity Clues"
  },
  formula: "Subject + have / has been + verb-ing",
  formulaExplanation:
    "Choose have or has from the subject, add been, then use the -ing form of the main verb. Negatives use haven’t/hasn’t been; questions move have/has before the subject.",
  formulaParts: Object.freeze([
    {
      label: "AUXILIARY",
      value: "have / has",
      note: "I/you/we/they → have; he/she/it → has."
    },
    {
      label: "CONTINUOUS LINK",
      value: "been",
      note: "Been is fixed and follows have/has."
    },
    {
      label: "ACTIVITY",
      value: "verb-ing",
      note: "Use working, waiting, studying, raining, and so on."
    }
  ]),
  table: {
    headers: Object.freeze(["Type", "Form", "Example"]),
    rows: Object.freeze([
      Object.freeze(["Positive", "have/has been + V-ing", "She has been studying."]),
      Object.freeze(["Negative", "haven’t/hasn’t been + V-ing", "We haven’t been sleeping well."]),
      Object.freeze([
        "Question",
        "Have/Has + subject + been + V-ing?",
        "Have you been waiting long?"
      ])
    ])
  },
  uses: Object.freeze([
    {
      title: "Activity continuing until now",
      explanation: "Show that an activity started in the past and is still happening now.",
      example: "I’ve been learning Spanish for two years.",
      translationTr: "İki yıldır İspanyolca öğreniyorum."
    },
    {
      title: "Recent activity with a present result",
      explanation:
        "Talk about an activity that may have just stopped but explains what we can see now.",
      example: "You’re wet. Have you been walking in the rain?",
      translationTr: "Islanmışsın. Yağmurda mı yürüyordun?"
    },
    {
      title: "Repeated activity over a recent period",
      explanation: "Emphasise repeated effort or behaviour across an unfinished period.",
      example: "She has been calling me all morning.",
      translationTr: "Bütün sabah beni arayıp duruyor."
    },
    {
      title: "Duration as the main idea",
      explanation:
        "Choose the continuous form when how long the activity has been happening matters most.",
      example: "How long have you been working here?",
      translationTr: "Ne zamandır burada çalışıyorsun?"
    }
  ]),
  examples: Object.freeze([
    {
      label: "Continuing activity",
      sentence: "We have been waiting for forty minutes.",
      translationTr: "Kırk dakikadır bekliyoruz.",
      note: "For introduces the duration of an activity continuing to now."
    },
    {
      label: "Since",
      sentence: "He has been working here since January.",
      translationTr: "Ocak ayından beri burada çalışıyor.",
      note: "Since introduces the starting point."
    },
    {
      label: "Visible result",
      sentence: "Her eyes are red because she has been crying.",
      translationTr: "Ağladığı için gözleri kızarmış.",
      note: "The recent activity explains the present evidence."
    },
    {
      label: "Question",
      sentence: "What have you been doing all afternoon?",
      translationTr: "Bütün öğleden sonra ne yapıyordun?",
      note: "Move have before the subject, then keep been + V-ing."
    },
    {
      label: "Repeated recent activity",
      sentence: "They’ve been practising every day this week.",
      translationTr: "Bu hafta her gün pratik yapıyorlar.",
      note: "The unfinished time period connects repeated activity to now."
    }
  ]),
  comparison: {
    title: "Is the focus on the activity/duration, or on a completed result?",
    left: {
      label: "PRESENT PERFECT CONTINUOUS",
      rule: "Emphasise duration, repeated activity, or the process itself.",
      example: "I’ve been reading the book for two hours.",
      translationTr: "İki saattir kitabı okuyorum."
    },
    right: {
      label: "PRESENT PERFECT SIMPLE",
      rule: "Emphasise completion, quantity, achievement, or a present result.",
      example: "I’ve read three chapters.",
      translationTr: "Üç bölüm okudum."
    },
    takeaway:
      "Ask what matters more: the ongoing/recent activity and its duration, or the completed result and how much has been achieved."
  },
  mistakes: Object.freeze([
    {
      wrong: "I have been work here for years.",
      right: "I have been working here for years.",
      why: "After have/has been, use the -ing form."
    },
    {
      wrong: "She has being studying all day.",
      right: "She has been studying all day.",
      why: "The structure uses the fixed participle been, not being."
    },
    {
      wrong: "I have been knowing him for years.",
      right: "I have known him for years.",
      why: "Stative verbs such as know are normally not used in continuous forms."
    },
    {
      wrong: "I’ve been writing five emails.",
      right: "I’ve written five emails.",
      why: "A completed quantity such as five emails usually calls for Present Perfect Simple."
    }
  ]),
  signalsLabel: "Clues that often point to duration, repetition, or recent activity",
  signals: Object.freeze([
    "for",
    "since",
    "how long",
    "all day",
    "all morning",
    "recently",
    "lately",
    "this week",
    "for hours",
    "since Monday"
  ]),
  signalsNote:
    "These expressions are clues rather than automatic rules. Check whether the verb can naturally be continuous and whether the activity/process is the focus.",
  practiceChecks: Object.freeze([
    {
      prompt: "Complete: She ___ (study) since 7 a.m.",
      answer: "has been studying",
      explanation: "The sentence focuses on an activity continuing from a starting point until now."
    },
    {
      prompt: "Choose: I’ve written / I’ve been writing six reports today.",
      answer: "I’ve written six reports today.",
      explanation: "Six reports is a completed quantity, so Present Perfect Simple is more natural."
    },
    {
      prompt: "Correct: How long have you been know her?",
      answer: "How long have you known her?",
      explanation: "Know is a stative verb, so the simple perfect form is normally used."
    }
  ]),
  quickRules: Object.freeze([
    "Present Perfect Continuous = have/has been + verb-ing.",
    "Use it when duration, repeated activity, or the process itself matters.",
    "Prefer Present Perfect Simple for stative verbs and clearly completed quantities/results."
  ]),
  memoryHook: "Activity + duration leading up to NOW = think have/has been + V-ing."
};
