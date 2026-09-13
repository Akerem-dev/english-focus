import type { GrammarTeachingContent } from "../grammarTeachingContent";

export const MODAL_PERFECTS_TEACHING_CONTENT: GrammarTeachingContent = {
  id: "modal-perfects",
  intro:
    "Use modal perfects to look back at the past and judge, infer, criticise, regret, or imagine a different past result. The core pattern is a modal verb + have + past participle.",
  sectionTitles: {
    comparison: "Must Have vs Might Have vs Should Have",
    signals: "Past-Judgement Clues"
  },
  formula: "modal + have + past participle (V3)",
  formulaExplanation:
    "The modal does not change with the subject. After the modal, use have — never has or had — followed by the past participle. Different modals change the meaning: certainty, possibility, criticism, regret, or an unreal past alternative.",
  formulaParts: Object.freeze([
    {
      label: "MODAL",
      value: "must / might / may / could / should",
      note: "Choose the modal from the meaning you want to express."
    },
    {
      label: "PERFECT LINK",
      value: "have",
      note: "After a modal, the form is always have."
    },
    {
      label: "PAST PARTICIPLE",
      value: "gone / seen / forgotten / finished",
      note: "Use V3 to point the judgement back to a past event."
    }
  ]),
  table: {
    headers: Object.freeze(["Meaning", "Pattern", "Example"]),
    rows: Object.freeze([
      Object.freeze(["Strong deduction", "must have + V3", "He must have forgotten."]),
      Object.freeze(["Possibility", "might/may/could have + V3", "She might have left."]),
      Object.freeze(["Regret / criticism", "should have + V3", "You should have called."]),
      Object.freeze(["Missed possibility", "could have + V3", "We could have won."])
    ])
  },
  uses: Object.freeze([
    {
      title: "Strong deduction about the past",
      explanation: "Use must have when the evidence makes a past explanation seem almost certain.",
      example: "The lights are off. They must have gone home.",
      translationTr: "Işıklar kapalı. Eve gitmiş olmalılar."
    },
    {
      title: "Possible past explanation",
      explanation: "Use might/may/could have when a past explanation is possible but not certain.",
      example: "She might have missed the train.",
      translationTr: "Treni kaçırmış olabilir."
    },
    {
      title: "Regret or criticism",
      explanation: "Use should have for something that was the better action, but did not happen.",
      example: "I should have studied more.",
      translationTr: "Daha çok çalışmalıydım."
    },
    {
      title: "Unrealised past possibility",
      explanation: "Use could have for something that was possible in the past but did not happen.",
      example: "We could have taken a taxi.",
      translationTr: "Taksiye binebilirdik."
    }
  ]),
  examples: Object.freeze([
    {
      label: "Deduction",
      sentence: "He must have left early; his desk is empty.",
      translationTr: "Erken çıkmış olmalı; masası boş.",
      note: "Present evidence supports a strong conclusion about the past."
    },
    {
      label: "Possibility",
      sentence: "They may have misunderstood the email.",
      translationTr: "E-postayı yanlış anlamış olabilirler.",
      note: "May have expresses a possible past explanation."
    },
    {
      label: "Regret",
      sentence: "I should have listened to you.",
      translationTr: "Seni dinlemeliydim.",
      note: "The speaker now judges a past decision negatively."
    },
    {
      label: "Missed chance",
      sentence: "She could have won the race.",
      translationTr: "Yarışı kazanabilirdi.",
      note: "Winning was possible, but it did not happen."
    },
    {
      label: "Negative deduction",
      sentence: "He can’t have seen the message; his phone was off.",
      translationTr: "Mesajı görmüş olamaz; telefonu kapalıydı.",
      note: "Can’t have expresses strong belief that a past event was impossible."
    }
  ]),
  comparison: {
    title: "Are you certain, uncertain, or judging what should have happened?",
    left: {
      label: "MUST HAVE / CAN’T HAVE",
      rule: "Make a strong positive or negative deduction from evidence.",
      example: "She must have taken the wrong bus.",
      translationTr: "Yanlış otobüse binmiş olmalı."
    },
    right: {
      label: "MIGHT HAVE / SHOULD HAVE",
      rule: "Might have = uncertain possibility; should have = regret or criticism.",
      example: "She might have taken the wrong bus. / She should have checked.",
      translationTr: "Yanlış otobüse binmiş olabilir. / Kontrol etmeliydi."
    },
    takeaway:
      "Choose the modal from your attitude to the past: certainty, possibility, criticism, regret, or missed opportunity."
  },
  mistakes: Object.freeze([
    {
      wrong: "He must has forgotten.",
      right: "He must have forgotten.",
      why: "After any modal, use the base form have."
    },
    {
      wrong: "I should have went earlier.",
      right: "I should have gone earlier.",
      why: "Modal perfects require the past participle V3: go → went → gone."
    },
    {
      wrong: "She might had missed the train.",
      right: "She might have missed the train.",
      why: "The perfect link after a modal is have, not had."
    },
    {
      wrong: "You must have called me yesterday!",
      right: "You should have called me yesterday!",
      why: "For criticism about a better past action, should have is the normal choice; must have usually expresses deduction."
    }
  ]),
  signalsLabel: "Language that often introduces a judgement or inference about the past",
  signals: Object.freeze([
    "I’m sure...",
    "probably",
    "perhaps",
    "maybe",
    "the evidence suggests...",
    "you should have...",
    "I wish I had...",
    "it was possible",
    "there’s no way...",
    "looking back"
  ]),
  signalsNote:
    "The clue is the speaker’s attitude, not one keyword. Decide whether the past conclusion is certain, possible, critical, regretful, or unrealised.",
  practiceChecks: Object.freeze([
    {
      prompt: "Choose: The door is unlocked. Someone must have / should have opened it.",
      answer: "must have opened it",
      explanation: "The unlocked door is evidence for a strong deduction about the past."
    },
    {
      prompt: "Correct: I should have went to bed earlier.",
      answer: "I should have gone to bed earlier.",
      explanation: "Use the past participle gone after have."
    },
    {
      prompt: "Complete: We ___ taken the earlier train, but we decided to wait.",
      answer: "could have",
      explanation: "The earlier train was a real past possibility that was not chosen."
    }
  ]),
  quickRules: Object.freeze([
    "Modal perfect = modal + have + past participle.",
    "Must have = strong deduction; might/may/could have = possibility.",
    "Should have = regret/criticism; could have can also describe a missed past possibility."
  ]),
  memoryHook: "Modal + HAVE + V3 lets you stand in the present and judge the past."
};
