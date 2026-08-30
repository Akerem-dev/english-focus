import type { GrammarTeachingContent } from "../grammarTeachingContent";

export const RELATIVE_CLAUSES_TEACHING_CONTENT: GrammarTeachingContent = {
  id: "relative-clauses",
  intro:
    "Use relative clauses to add information about a person, thing, place, time, or possession without starting a new sentence. Defining relative clauses identify exactly which noun you mean; non-defining clauses add extra information and are separated by commas.",
  sectionTitles: {
    comparison: "Defining vs Non-defining Relative Clauses",
    signals: "Relative Words & Reference Clues"
  },
  formula: "noun + relative word + relative clause",
  formulaExplanation:
    "Choose the relative word from what it refers to: who for people, which for things, that for people/things in many defining clauses, whose for possession, where for places, and when for times. In defining clauses, an object relative pronoun can sometimes be omitted.",
  formulaParts: Object.freeze([
    {
      label: "NOUN",
      value: "the woman / the book / the café",
      note: "The relative clause adds information about this noun."
    },
    {
      label: "RELATIVE WORD",
      value: "who / which / that / whose / where / when",
      note: "Choose the word according to the noun and its role."
    },
    {
      label: "CLAUSE",
      value: "lives next door / I bought / we met",
      note: "The clause contains the extra identifying or descriptive information."
    }
  ]),
  table: {
    headers: Object.freeze(["Reference", "Relative word", "Example"]),
    rows: Object.freeze([
      Object.freeze(["Person", "who / that", "The man who called is my uncle."]),
      Object.freeze(["Thing", "which / that", "The laptop that I bought is fast."]),
      Object.freeze(["Possession", "whose", "The student whose bag was lost..."]),
      Object.freeze(["Place", "where", "The café where we met..."]),
      Object.freeze(["Time", "when", "The year when we moved..."])
    ])
  },
  uses: Object.freeze([
    {
      title: "Identify exactly which noun you mean",
      explanation:
        "Use a defining relative clause when the information is necessary to identify the person or thing.",
      example: "The woman who works upstairs is a lawyer.",
      translationTr: "Üst katta çalışan kadın bir avukat."
    },
    {
      title: "Add extra information",
      explanation:
        "Use a non-defining clause when the noun is already clear and the clause only adds extra detail.",
      example: "Maya, who works upstairs, is a lawyer.",
      translationTr: "Maya, üst katta çalışıyor, bir avukat."
    },
    {
      title: "Show possession",
      explanation:
        "Use whose to connect a person or thing to something they possess or are associated with.",
      example: "I met a writer whose books are translated worldwide.",
      translationTr: "Kitapları dünya çapında çevrilen bir yazarla tanıştım."
    },
    {
      title: "Connect places and times",
      explanation:
        "Use where for places and when for times when that relationship is the important link.",
      example: "That’s the park where we first met.",
      translationTr: "İlk tanıştığımız park orası."
    }
  ]),
  examples: Object.freeze([
    {
      label: "Person",
      sentence: "The teacher who helped me is from Canada.",
      translationTr: "Bana yardım eden öğretmen Kanadalı.",
      note: "Who refers to a person and is the subject of helped."
    },
    {
      label: "Thing",
      sentence: "The film that we watched was excellent.",
      translationTr: "İzlediğimiz film mükemmeldi.",
      note: "That is the object of watched and could also be omitted in this defining clause."
    },
    {
      label: "Possession",
      sentence: "She knows a designer whose work won an award.",
      translationTr: "Çalışması ödül kazanan bir tasarımcı tanıyor.",
      note: "Whose expresses possession or association."
    },
    {
      label: "Place",
      sentence: "This is the town where my father grew up.",
      translationTr: "Burası babamın büyüdüğü kasaba.",
      note: "Where links the place to what happened there."
    },
    {
      label: "Non-defining",
      sentence: "My brother, who lives in Ankara, is visiting tomorrow.",
      translationTr: "Ankara’da yaşayan kardeşim yarın ziyarete geliyor.",
      note: "The commas show that the clause adds extra information rather than identifying which brother."
    }
  ]),
  comparison: {
    title: "Is the information necessary to identify the noun, or is it only extra detail?",
    left: {
      label: "DEFINING",
      rule: "Necessary information; no commas. That is often possible for people or things.",
      example: "The students who finished can leave.",
      translationTr: "Bitiren öğrenciler çıkabilir."
    },
    right: {
      label: "NON-DEFINING",
      rule: "Extra information; use commas. That is not used in standard non-defining clauses.",
      example: "Ali, who finished early, can leave.",
      translationTr: "Erken bitiren Ali çıkabilir."
    },
    takeaway:
      "Remove the clause mentally. If the listener can still clearly identify the noun, the clause is probably non-defining and needs commas."
  },
  mistakes: Object.freeze([
    {
      wrong: "The woman which called me is my manager.",
      right: "The woman who called me is my manager.",
      why: "Use who for people in this role, not which."
    },
    {
      wrong: "My car, that I bought last year, is electric.",
      right: "My car, which I bought last year, is electric.",
      why: "Standard non-defining clauses use which/who, not that."
    },
    {
      wrong: "The man who I spoke to him was helpful.",
      right: "The man who I spoke to was helpful.",
      why: "The relative pronoun already fills the object role, so do not repeat it with him."
    },
    {
      wrong: "The company who products are popular...",
      right: "The company whose products are popular...",
      why: "Use whose to express possession or association."
    }
  ]),
  signalsLabel: "Words that connect a noun to identifying or extra information",
  signals: Object.freeze([
    "who",
    "which",
    "that",
    "whose",
    "where",
    "when",
    "the person who...",
    "the thing that...",
    "the place where...",
    "the time when..."
  ]),
  signalsNote:
    "Choose the relative word from meaning and grammatical role. Punctuation then tells the reader whether the information identifies the noun or simply adds detail.",
  practiceChecks: Object.freeze([
    {
      prompt: "Complete: The woman ___ lives next door is a doctor.",
      answer: "who / that",
      explanation: "The antecedent is a person, and the relative word is the subject of lives."
    },
    {
      prompt: "Correct: My uncle, that lives in London, is visiting us.",
      answer: "My uncle, who lives in London, is visiting us.",
      explanation:
        "The commas mark a non-defining clause, where standard English uses who rather than that."
    },
    {
      prompt: "Complete: That’s the restaurant ___ we had our first date.",
      answer: "where",
      explanation: "Where connects the place to the event that happened there."
    }
  ]),
  quickRules: Object.freeze([
    "Who = people; which = things; whose = possession; where = place; when = time.",
    "Defining clauses identify the noun and normally have no commas.",
    "Non-defining clauses add extra information, use commas, and normally do not use that."
  ]),
  memoryHook:
    "Relative clauses are noun zoom-ins: identify the noun, then choose the connector that explains it."
};
