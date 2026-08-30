import type { GrammarTeachingContent } from "../grammarTeachingContent";

export const REPORTED_SPEECH_TEACHING_CONTENT: GrammarTeachingContent = {
  id: "reported-speech",
  intro:
    "Use reported speech to tell someone what another person said, asked, or told us without repeating the exact original words. When the reporting verb is in the past, English often shifts tense, pronouns, and time/place references to match the new viewpoint.",
  sectionTitles: {
    comparison: "Direct vs Reported Speech",
    signals: "Backshift & Reference Changes"
  },
  formula: "reporting verb + (that / object) + reported clause",
  formulaExplanation:
    "Statements commonly use say (that) or tell + object + clause. Yes/no questions use ask + if/whether; wh-questions keep the wh-word but return to statement word order. When reporting from a later past viewpoint, present forms often backshift one step.",
  formulaParts: Object.freeze([
    {
      label: "REPORTING VERB",
      value: "said / told / asked",
      note: "Choose the verb from whether you report a statement, message to someone, or question."
    },
    {
      label: "LINK",
      value: "that / if / whether / wh-word",
      note: "That is optional in many statements; questions need if/whether or the original wh-word."
    },
    {
      label: "REPORTED CLAUSE",
      value: "she was tired / he had finished",
      note: "Adjust tense, pronouns, and references when the new viewpoint requires it."
    }
  ]),
  table: {
    headers: Object.freeze(["Direct form", "Common backshift", "Example"]),
    rows: Object.freeze([
      Object.freeze(["Present Simple", "Past Simple", "‘I work.’ → He said he worked."]),
      Object.freeze(["Present Continuous", "Past Continuous", "‘I’m leaving.’ → She said she was leaving."]),
      Object.freeze(["Past Simple", "Past Perfect", "‘I saw it.’ → He said he had seen it."]),
      Object.freeze(["will", "would", "‘I’ll call.’ → She said she would call."])
    ])
  },
  uses: Object.freeze([
    {
      title: "Report statements",
      explanation: "Summarise another person’s message without quoting their exact words.",
      example: "Maya said that she was tired.",
      translationTr: "Maya yorgun olduğunu söyledi."
    },
    {
      title: "Report what someone told a person",
      explanation: "Use tell when you include the listener or recipient as an object.",
      example: "He told me that the meeting had changed.",
      translationTr: "Bana toplantının değiştiğini söyledi."
    },
    {
      title: "Report yes/no questions",
      explanation: "Use ask + if/whether and statement word order; do not keep do/does/did question order.",
      example: "She asked if I was ready.",
      translationTr: "Hazır olup olmadığımı sordu."
    },
    {
      title: "Report wh-questions",
      explanation: "Keep the question word but use statement order after it.",
      example: "He asked where I lived.",
      translationTr: "Nerede yaşadığımı sordu."
    }
  ]),
  examples: Object.freeze([
    {
      label: "Statement",
      sentence: "‘I’m busy.’ → She said that she was busy.",
      translationTr: "‘Meşgulüm.’ → Meşgul olduğunu söyledi.",
      note: "Present Continuous backshifts to Past Continuous after a past reporting verb."
    },
    {
      label: "Tell + object",
      sentence: "‘The file is ready.’ → He told us that the file was ready.",
      translationTr: "‘Dosya hazır.’ → Bize dosyanın hazır olduğunu söyledi.",
      note: "Tell normally needs an object: told me/us/her, not simply told that."
    },
    {
      label: "Yes/no question",
      sentence: "‘Are you coming?’ → She asked if I was coming.",
      translationTr: "‘Geliyor musun?’ → Gelip gelmediğimi sordu.",
      note: "The reported question uses if and statement order."
    },
    {
      label: "Wh-question",
      sentence: "‘Where did you park?’ → He asked where I had parked.",
      translationTr: "‘Nereye park ettin?’ → Nereye park ettiğimi sordu.",
      note: "Keep where, remove did, and use normal statement order."
    },
    {
      label: "Time reference",
      sentence: "‘I’ll finish tomorrow.’ → She said she would finish the next day.",
      translationTr: "‘Yarın bitireceğim.’ → Ertesi gün bitireceğini söyledi.",
      note: "Will commonly becomes would and tomorrow may become the next day when the viewpoint changes."
    }
  ]),
  comparison: {
    title: "Are you repeating the exact words, or retelling the message from a new viewpoint?",
    left: {
      label: "DIRECT SPEECH",
      rule: "Keep the speaker’s exact words and original tense inside quotation marks.",
      example: "Maya said, ‘I am tired.’",
      translationTr: "Maya, ‘Yorgunum,’ dedi."
    },
    right: {
      label: "REPORTED SPEECH",
      rule: "Retell the meaning and adjust grammar when the reporting viewpoint changes.",
      example: "Maya said that she was tired.",
      translationTr: "Maya yorgun olduğunu söyledi."
    },
    takeaway:
      "Reported speech changes viewpoint. Backshift is common after a past reporting verb, but do not change tense mechanically when the fact is still true or the context does not require a shift."
  },
  mistakes: Object.freeze([
    {
      wrong: "He told that he was tired.",
      right: "He said that he was tired. / He told me that he was tired.",
      why: "Tell normally needs a person as its object; say does not."
    },
    {
      wrong: "She asked where did I live.",
      right: "She asked where I lived.",
      why: "Reported questions use statement word order and do not keep did."
    },
    {
      wrong: "He asked was I ready.",
      right: "He asked if I was ready.",
      why: "Yes/no reported questions normally use if/whether plus statement order."
    },
    {
      wrong: "She said me to wait.",
      right: "She told me to wait.",
      why: "For an instruction directed at a person, tell + object + to-infinitive is the standard pattern."
    }
  ]),
  signalsLabel: "Common changes when the reporting viewpoint moves into the past",
  signals: Object.freeze([
    "said (that)",
    "told me/us",
    "asked if",
    "asked whether",
    "asked where/why/how",
    "now → then",
    "today → that day",
    "tomorrow → the next day",
    "yesterday → the day before",
    "here → there"
  ]),
  signalsNote:
    "Reference changes depend on context. Change words such as now, here, and tomorrow only when the new time/place viewpoint makes the original reference inaccurate.",
  practiceChecks: Object.freeze([
    {
      prompt: "Report: ‘I am working from home,’ Alex said.",
      answer: "Alex said that he was working from home.",
      explanation: "A past reporting verb commonly shifts am working to was working and the pronoun changes with the speaker."
    },
    {
      prompt: "Correct: She asked where did I buy it.",
      answer: "She asked where I had bought it. / She asked where I bought it.",
      explanation: "Reported wh-questions use statement order; did disappears. The exact backshift depends on context."
    },
    {
      prompt: "Report: ‘Are you free tomorrow?’ she asked me.",
      answer: "She asked me if I was free the next day.",
      explanation: "Yes/no questions use if/whether, statement order, and a changed time reference when needed."
    }
  ]),
  quickRules: Object.freeze([
    "Say + clause; tell + person + clause. Reported questions use statement word order.",
    "After a past reporting verb, tense often shifts one step back when the viewpoint changes.",
    "Adjust pronouns and time/place words only when the new context requires it."
  ]),
  memoryHook: "Reported speech is a camera change: retell the same message from a new speaker, time, and place."
};
