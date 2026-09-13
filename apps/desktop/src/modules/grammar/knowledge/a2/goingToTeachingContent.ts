import type { GrammarTeachingContent } from "../grammarTeachingContent";

export const GOING_TO_TEACHING_CONTENT: GrammarTeachingContent = {
  id: "going-to",
  intro:
    "Use be going to + base verb for plans or intentions decided before the moment of speaking, and for predictions based on evidence you can see or know now.",
  sectionTitles: {
    comparison: "Going to vs Will",
    signals: "Plan & Evidence Clues"
  },
  formula: "Subject + am / is / are + going to + base verb",
  formulaExplanation:
    "The verb be changes with the subject, but going to and the main verb stay stable. Negatives put not after be. Questions move am/is/are before the subject.",
  formulaParts: Object.freeze([
    {
      label: "BE",
      value: "am / is / are",
      note: "I am; he/she/it is; you/we/they are."
    },
    {
      label: "FUTURE MARKER",
      value: "going to",
      note: "Keep going to unchanged after the correct form of be."
    },
    {
      label: "MAIN VERB",
      value: "base verb",
      note: "Use study, buy, visit, rain — never studies/goes after going to."
    }
  ]),
  table: {
    headers: Object.freeze(["Subject", "Positive", "Negative", "Question"]),
    rows: Object.freeze([
      Object.freeze(["I", "I'm going to call.", "I'm not going to call.", "Am I going to call?"]),
      Object.freeze([
        "he / she / it",
        "She's going to call.",
        "She isn't going to call.",
        "Is she going to call?"
      ]),
      Object.freeze([
        "you / we / they",
        "They're going to call.",
        "They aren't going to call.",
        "Are they going to call?"
      ])
    ])
  },
  uses: Object.freeze([
    {
      title: "Plans already decided",
      explanation: "The intention exists before you speak; you are reporting the plan.",
      example: "I'm going to start a new course next month.",
      translationTr: "Gelecek ay yeni bir kursa başlayacağım."
    },
    {
      title: "Personal intentions",
      explanation: "Say what you intend to do, even if every detail is not arranged yet.",
      example: "She's going to exercise more this year.",
      translationTr: "Bu yıl daha fazla egzersiz yapmayı düşünüyor."
    },
    {
      title: "Prediction from visible evidence",
      explanation: "Predict a future result because something now points strongly toward it.",
      example: "Look at those clouds. It's going to rain.",
      translationTr: "Şu bulutlara bak. Yağmur yağacak."
    },
    {
      title: "Immediate consequence from present evidence",
      explanation: "Use it when the current situation makes the future outcome clear.",
      example: "Be careful! You're going to drop that glass.",
      translationTr: "Dikkat et! O bardağı düşüreceksin."
    }
  ]),
  examples: Object.freeze([
    {
      label: "Plan",
      sentence: "We're going to visit my parents this weekend.",
      translationTr: "Bu hafta sonu ailemi ziyaret edeceğiz.",
      note: "The visit is already the plan before the sentence is spoken."
    },
    {
      label: "Intention",
      sentence: "I'm going to learn to drive.",
      translationTr: "Araba kullanmayı öğreneceğim.",
      note: "This expresses a present intention about the future."
    },
    {
      label: "Evidence prediction",
      sentence: "That box is too heavy. It's going to fall.",
      translationTr: "O kutu çok ağır. Düşecek.",
      note: "The prediction is based on evidence in the current situation."
    },
    {
      label: "Negative",
      sentence: "She isn't going to accept the offer.",
      translationTr: "Teklifi kabul etmeyecek.",
      note: "Put not after the correct form of be."
    },
    {
      label: "Question",
      sentence: "Are you going to cook tonight?",
      translationTr: "Bu akşam yemek yapacak mısın?",
      note: "Move are before the subject; going to + base verb remains unchanged."
    }
  ]),
  comparison: {
    title: "Was the decision already made, or are you deciding/reacting now?",
    left: {
      label: "GOING TO",
      rule: "Prior plan/intention, or prediction based on present evidence.",
      example: "I've bought the paint. I'm going to redecorate the room.",
      translationTr: "Boyayı aldım. Odayı yeniden dekore edeceğim."
    },
    right: {
      label: "WILL",
      rule: "Often an instant decision, offer, promise, or a prediction presented as an opinion.",
      example: "The phone is ringing. I'll answer it.",
      translationTr: "Telefon çalıyor. Ben açarım."
    },
    takeaway:
      "If the plan existed before you spoke or current evidence points to the result, going to is usually the clearer A2 choice."
  },
  mistakes: Object.freeze([
    {
      wrong: "I going to study tonight.",
      right: "I'm going to study tonight.",
      why: "Going to needs the correct form of be before it."
    },
    {
      wrong: "She is going to studies medicine.",
      right: "She is going to study medicine.",
      why: "After going to, use the base verb."
    },
    {
      wrong: "Do you going to travel?",
      right: "Are you going to travel?",
      why: "The auxiliary is be, so questions move are/is/am before the subject; do is not used."
    },
    {
      wrong: "They are going visit us.",
      right: "They are going to visit us.",
      why: "The complete future structure is be + going to + base verb."
    }
  ]),
  signalsLabel: "Language and situations that often support plans or evidence-based predictions",
  signals: Object.freeze([
    "plan to",
    "intend to",
    "this weekend",
    "next month",
    "I've decided...",
    "I've already booked...",
    "look at...",
    "watch out!",
    "those clouds...",
    "it's clear that..."
  ]),
  signalsNote:
    "Future time words such as tomorrow do not choose the form by themselves. The important question is whether there is a prior plan or present evidence.",
  practiceChecks: Object.freeze([
    {
      prompt: "Complete: We ___ (visit) İzmir next weekend. We've already booked the hotel.",
      answer: "are going to visit",
      explanation: "The booking shows a plan that already exists, so going to fits naturally."
    },
    {
      prompt: "Correct: He is going to buys a new phone.",
      answer: "He is going to buy a new phone.",
      explanation: "After going to, the main verb must be in base form."
    },
    {
      prompt: "Choose: The bag is slipping! You will / are going to drop it.",
      answer: "You are going to drop it.",
      explanation: "The prediction comes from visible evidence in the present situation."
    }
  ]),
  quickRules: Object.freeze([
    "Form: am/is/are + going to + base verb.",
    "Use it for a plan/intention already in mind before speaking, or a prediction based on present evidence.",
    "Questions use am/is/are before the subject; do/does/did is not part of this structure."
  ]),
  memoryHook:
    "Plan already in your head, or evidence already in front of your eyes? Think GOING TO."
};
