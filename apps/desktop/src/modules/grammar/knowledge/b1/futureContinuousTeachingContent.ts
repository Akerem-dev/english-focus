import type { GrammarTeachingContent } from "../grammarTeachingContent";

export const FUTURE_CONTINUOUS_TEACHING_CONTENT: GrammarTeachingContent = {
  id: "future-continuous",
  intro:
    "Use the Future Continuous for an action that will be in progress at a particular future time, for expected future routines, and for neutral questions about someone’s plans. The focus is on the activity being underway, not simply completed.",
  sectionTitles: {
    comparison: "Future Continuous vs Will",
    signals: "Future-Time Frames"
  },
  formula: "Subject + will be + verb-ing",
  formulaExplanation:
    "Will be stays the same for every subject. Add the -ing form of the main verb. Negatives use will not be / won’t be; questions move will before the subject.",
  formulaParts: Object.freeze([
    {
      label: "SUBJECT",
      value: "I / you / he / she / it / we / they",
      note: "The form does not change with the subject."
    },
    {
      label: "FUTURE AUXILIARY",
      value: "will be",
      note: "Will marks the future and be supports the continuous form."
    },
    {
      label: "MAIN VERB",
      value: "verb-ing",
      note: "Use working, travelling, studying, waiting, and so on."
    }
  ]),
  table: {
    headers: Object.freeze(["Type", "Form", "Example"]),
    rows: Object.freeze([
      Object.freeze(["Positive", "will be + V-ing", "I’ll be working at nine."]),
      Object.freeze(["Negative", "won’t be + V-ing", "She won’t be driving tonight."]),
      Object.freeze(["Question", "Will + subject + be + V-ing?", "Will you be staying long?"])
    ])
  },
  uses: Object.freeze([
    {
      title: "Action in progress at a future time",
      explanation: "Show what will already be happening around a specific future moment.",
      example: "This time tomorrow, I’ll be flying to Berlin.",
      translationTr: "Yarın bu saatlerde Berlin’e uçuyor olacağım."
    },
    {
      title: "Expected future routine",
      explanation:
        "Describe something expected to happen as part of a normal schedule or course of events.",
      example: "I’ll be working from home next week.",
      translationTr: "Gelecek hafta evden çalışıyor olacağım."
    },
    {
      title: "Polite neutral questions about plans",
      explanation:
        "Ask about future arrangements without sounding as if you are requesting or pressuring someone.",
      example: "Will you be using the car this evening?",
      translationTr: "Bu akşam arabayı kullanıyor olacak mısın?"
    },
    {
      title: "Two simultaneous future situations",
      explanation: "Place two activities in progress at the same future time.",
      example: "While you’re presenting, I’ll be taking notes.",
      translationTr: "Sen sunum yaparken ben not alıyor olacağım."
    }
  ]),
  examples: Object.freeze([
    {
      label: "Future time",
      sentence: "At 8 p.m., we’ll be having dinner.",
      translationTr: "Saat sekizde akşam yemeği yiyor olacağız.",
      note: "The activity is viewed as already in progress at 8 p.m."
    },
    {
      label: "Expected situation",
      sentence: "Don’t call at noon; she’ll be teaching.",
      translationTr: "Öğlen arama; ders veriyor olacak.",
      note: "The future activity is expected from her schedule."
    },
    {
      label: "Neutral plan question",
      sentence: "Will you be joining us for lunch?",
      translationTr: "Öğle yemeğinde bize katılıyor olacak mısın?",
      note: "This asks about an expected plan rather than making a direct invitation."
    },
    {
      label: "Negative",
      sentence: "I won’t be staying at the office late tonight.",
      translationTr: "Bu akşam ofiste geç saate kadar kalıyor olmayacağım.",
      note: "Won’t be + V-ing makes the negative."
    },
    {
      label: "Future background",
      sentence: "When you arrive, the team will be discussing the proposal.",
      translationTr: "Sen vardığında ekip teklifi tartışıyor olacak.",
      note: "The discussion forms the background at the future arrival time."
    }
  ]),
  comparison: {
    title: "Do you see the future action as an event, or as something already in progress?",
    left: {
      label: "FUTURE CONTINUOUS",
      rule: "Focus on an activity in progress around a future time.",
      example: "I’ll be working at 10 tomorrow.",
      translationTr: "Yarın saat 10’da çalışıyor olacağım."
    },
    right: {
      label: "WILL + BASE VERB",
      rule: "Present a future decision, prediction, promise, or event without the in-progress viewpoint.",
      example: "I’ll finish the report tomorrow.",
      translationTr: "Raporu yarın bitireceğim."
    },
    takeaway:
      "If the important idea is ‘this activity will already be underway then’, Future Continuous is the stronger choice."
  },
  mistakes: Object.freeze([
    {
      wrong: "I will be work at nine.",
      right: "I will be working at nine.",
      why: "Future Continuous requires will be + verb-ing."
    },
    {
      wrong: "She will being travel tomorrow.",
      right: "She will be travelling tomorrow.",
      why: "Use the fixed auxiliary will be, then the -ing form of the main verb."
    },
    {
      wrong: "Will you be use the laptop?",
      right: "Will you be using the laptop?",
      why: "After will be, the main verb must be in the -ing form."
    },
    {
      wrong: "At six tomorrow, I will finish dinner.",
      right: "At six tomorrow, I will be having dinner.",
      why: "If the intended meaning is an activity in progress at six, Future Continuous expresses that viewpoint more clearly."
    }
  ]),
  signalsLabel: "Expressions that often create a future in-progress viewpoint",
  signals: Object.freeze([
    "this time tomorrow",
    "at 8 tomorrow",
    "this time next week",
    "when you arrive",
    "while",
    "all evening",
    "later today",
    "next week",
    "by then",
    "during the meeting"
  ]),
  signalsNote:
    "Future-time expressions do not automatically require Future Continuous. Use it when the action is viewed as being in progress at that future point.",
  practiceChecks: Object.freeze([
    {
      prompt: "Complete: This time tomorrow, we ___ (drive) through Italy.",
      answer: "will be driving",
      explanation: "The sentence places the journey in progress at a specific future time."
    },
    {
      prompt: "Correct: Will she be work from home next week?",
      answer: "Will she be working from home next week?",
      explanation: "Future Continuous questions still require be + verb-ing."
    },
    {
      prompt: "Choose: At 9 tonight, I’ll watch / I’ll be watching the match.",
      answer: "I’ll be watching the match.",
      explanation: "The sentence asks us to picture the activity already in progress at nine."
    }
  ]),
  quickRules: Object.freeze([
    "Future Continuous = will be + verb-ing.",
    "Use it for an action expected to be in progress around a future time.",
    "It also makes neutral questions about someone’s future plans or schedule."
  ]),
  memoryHook: "Put a camera at a future time: what will already be happening in the frame?"
};
