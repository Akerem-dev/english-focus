import type { GrammarTeachingContent } from "../grammarTeachingContent";

export const PRESENT_PERFECT_TEACHING_CONTENT: GrammarTeachingContent = {
  id: "present-perfect",
  intro:
    "Use the Present Perfect when a past event matters because of its connection to now: life experience, a present result, unfinished time, or a situation continuing from the past until now. Avoid it with a clearly finished past time such as yesterday or last year.",
  sectionTitles: {
    comparison: "Present Perfect vs Past Simple",
    signals: "Common Time & Experience Clues"
  },
  formula: "Subject + have / has + past participle (V3)",
  formulaExplanation:
    "Choose have with I/you/we/they and has with he/she/it. The main verb must be the past participle: worked, seen, gone, written. Negatives use haven't/hasn't; questions move have/has before the subject.",
  formulaParts: Object.freeze([
    {
      label: "AUXILIARY",
      value: "have / has",
      note: "I/you/we/they → have; he/she/it → has."
    },
    {
      label: "PAST PARTICIPLE",
      value: "worked / seen / gone / written",
      note: "Use V3, not the Past Simple form when an irregular verb has a different participle."
    },
    {
      label: "QUESTION / NEGATIVE",
      value: "Have you...? / hasn't...",
      note: "Move have/has before the subject for questions; add not for negatives."
    }
  ]),
  table: {
    headers: Object.freeze(["Subject", "Positive", "Negative", "Question"]),
    rows: Object.freeze([
      Object.freeze([
        "I / you / we / they",
        "We have finished.",
        "We haven't finished.",
        "Have you finished?"
      ]),
      Object.freeze([
        "he / she / it",
        "She has finished.",
        "She hasn't finished.",
        "Has she finished?"
      ])
    ])
  },
  uses: Object.freeze([
    {
      title: "Life experience",
      explanation:
        "Talk about whether an experience has happened at any time before now without saying a finished time.",
      example: "I have never been to Japan.",
      translationTr: "Japonya'ya hiç gitmedim."
    },
    {
      title: "Present result",
      explanation: "A past event creates a situation that matters now.",
      example: "He has lost his keys, so he can't open the door.",
      translationTr: "Anahtarlarını kaybetti, bu yüzden kapıyı açamıyor."
    },
    {
      title: "Unfinished time period",
      explanation: "Use it when the time period includes now, such as today, this week, or so far.",
      example: "We have had three meetings this week.",
      translationTr: "Bu hafta üç toplantı yaptık."
    },
    {
      title: "From the past until now",
      explanation:
        "Use since for the starting point and for for the duration of a continuing situation.",
      example: "She has lived here for six years.",
      translationTr: "Altı yıldır burada yaşıyor."
    }
  ]),
  examples: Object.freeze([
    {
      label: "Experience",
      sentence: "Have you ever tried Korean food?",
      translationTr: "Hiç Kore yemeği denedin mi?",
      note: "Ever asks about experience at any time before now."
    },
    {
      label: "Recent result",
      sentence: "I've just finished my homework.",
      translationTr: "Ödevimi az önce bitirdim.",
      note: "Just normally sits between have/has and the past participle."
    },
    {
      label: "Already",
      sentence: "She has already sent the email.",
      translationTr: "E-postayı çoktan gönderdi.",
      note: "Already often appears before the past participle in positive sentences."
    },
    {
      label: "Yet",
      sentence: "They haven't arrived yet.",
      translationTr: "Henüz gelmediler.",
      note: "Yet commonly appears at the end of negatives and questions."
    },
    {
      label: "Been vs gone",
      sentence: "Maya has been to Rome, but Leo has gone to Rome.",
      translationTr: "Maya Roma'ya gidip döndü; Leo ise Roma'ya gitti ve hâlâ orada/yolda.",
      note: "Has been to usually means visited and returned; has gone to means the person has not returned yet."
    }
  ]),
  comparison: {
    title: "Does the sentence belong to a finished past time, or connect the past to now?",
    left: {
      label: "PRESENT PERFECT",
      rule: "Experience/result/unfinished time with a connection to now; no finished past time is named.",
      example: "I have visited Paris.",
      translationTr: "Paris'i ziyaret ettim."
    },
    right: {
      label: "PAST SIMPLE",
      rule: "Finished event in a finished past time.",
      example: "I visited Paris last summer.",
      translationTr: "Geçen yaz Paris'i ziyaret ettim."
    },
    takeaway:
      "Ask 'When?'. If the answer is a finished time such as yesterday, in 2023, or last summer, use Past Simple. If the exact finished time is not the point and the connection to now matters, Present Perfect is likely."
  },
  mistakes: Object.freeze([
    {
      wrong: "I have went to the store.",
      right: "I have gone to the store.",
      why: "Present Perfect needs the past participle V3: go → went → gone."
    },
    {
      wrong: "She has finish her work.",
      right: "She has finished her work.",
      why: "Have/has must be followed by a past participle."
    },
    {
      wrong: "I have seen him yesterday.",
      right: "I saw him yesterday.",
      why: "Yesterday is a finished past time, so Past Simple is required."
    },
    {
      wrong: "Did you ever been to Spain?",
      right: "Have you ever been to Spain?",
      why: "Life experience with ever normally uses Have/Has + past participle, not did + V3."
    }
  ]),
  signalsLabel: "Frequent clues for experience, recency, unfinished time, and duration",
  signals: Object.freeze([
    "ever",
    "never",
    "already",
    "just",
    "yet",
    "so far",
    "recently",
    "this week",
    "since",
    "for"
  ]),
  signalsNote:
    "These words are useful clues, not automatic tense buttons. Check whether the time is unfinished or the result/experience is connected to now.",
  practiceChecks: Object.freeze([
    {
      prompt: "Complete: She ___ already ___ (finish) the report.",
      answer: "has already finished",
      explanation:
        "She takes has, already comes naturally before the participle, and finish → finished."
    },
    {
      prompt: "Choose since or for: We have known each other ___ 2019.",
      answer: "since",
      explanation:
        "2019 is the starting point. Use since for a starting point and for for a duration."
    },
    {
      prompt: "Choose: I have met / met him last Monday.",
      answer: "I met him last Monday.",
      explanation: "Last Monday is a finished past time, so use Past Simple."
    }
  ]),
  quickRules: Object.freeze([
    "Form: have/has + past participle; use V3, not automatically the Past Simple V2 form.",
    "No finished past time: focus on experience, result now, unfinished time, or duration until now.",
    "Since = starting point; for = duration. Been usually means returned; gone usually means not returned yet."
  ]),
  memoryHook:
    "Present Perfect looks backward from NOW. If the past is closed and dated, switch to Past Simple."
};
