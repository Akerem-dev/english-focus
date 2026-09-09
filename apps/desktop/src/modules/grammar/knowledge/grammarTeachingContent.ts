export type GrammarTeachingSectionId =
  | "formula"
  | "uses"
  | "examples"
  | "comparison"
  | "mistake"
  | "signals"
  | "practice"
  | "quick-rule";

export interface GrammarTeachingUse {
  readonly title: string;
  readonly explanation: string;
  readonly example: string;
  readonly translationTr?: string;
}

export interface GrammarTeachingExample {
  readonly label: string;
  readonly sentence: string;
  readonly translationTr?: string;
  readonly note: string;
}

export interface GrammarTeachingComparisonSide {
  readonly label: string;
  readonly rule: string;
  readonly example: string;
  readonly translationTr?: string;
}

export interface GrammarTeachingMistake {
  readonly wrong: string;
  readonly right: string;
  readonly why: string;
}

export interface GrammarTeachingContent {
  readonly id: string;
  readonly intro: string;
  readonly sectionTitles?: Partial<Record<GrammarTeachingSectionId, string>>;
  readonly formula: string;
  readonly formulaExplanation: string;
  readonly formulaParts: readonly {
    readonly label: string;
    readonly value: string;
    readonly note: string;
  }[];
  readonly table?: {
    readonly headers: readonly string[];
    readonly rows: readonly (readonly string[])[];
  };
  readonly uses: readonly GrammarTeachingUse[];
  readonly examples: readonly GrammarTeachingExample[];
  readonly comparison: {
    readonly title: string;
    readonly left: GrammarTeachingComparisonSide;
    readonly right: GrammarTeachingComparisonSide;
    readonly takeaway: string;
  };
  readonly mistakes: readonly GrammarTeachingMistake[];
  readonly signalsLabel: string;
  readonly signals: readonly string[];
  readonly signalsNote: string;
  readonly practiceChecks: readonly {
    readonly prompt: string;
    readonly answer: string;
    readonly explanation: string;
  }[];
  readonly quickRules: readonly string[];
  readonly memoryHook: string;
}

const CONTENT: readonly GrammarTeachingContent[] = Object.freeze([
  {
    id: "be-am-is-are",
    intro:
      "Use the verb be to identify people and things, describe states and qualities, and say where someone or something is. The form changes with the subject: am, is, or are.",
    sectionTitles: {
      comparison: "Positive, Negative & Questions",
      signals: "Common Patterns"
    },
    formula: "Subject + am / is / are + complement",
    formulaExplanation:
      "Be is unusual because it does not need do/does to make negatives or questions. Choose am, is, or are from the subject first, then add the information that completes the meaning.",
    formulaParts: Object.freeze([
      {
        label: "SUBJECT",
        value: "I / you / he / she / it / we / they",
        note: "Who or what the sentence is about."
      },
      { label: "BE", value: "am / is / are", note: "The form must agree with the subject." },
      {
        label: "COMPLEMENT",
        value: "happy / a doctor / at home",
        note: "A description, identity, age, place, etc."
      }
    ]),
    table: {
      headers: Object.freeze(["Subject", "Positive", "Negative", "Question"]),
      rows: Object.freeze([
        Object.freeze(["I", "I am", "I am not", "Am I …?"]),
        Object.freeze(["he / she / it", "He is", "He is not / isn’t", "Is he …?"]),
        Object.freeze(["you / we / they", "They are", "They are not / aren’t", "Are they …?"])
      ])
    },
    uses: Object.freeze([
      {
        title: "Identity and classification",
        explanation: "Say what a person or thing is.",
        example: "Maya is a doctor.",
        translationTr: "Maya bir doktordur."
      },
      {
        title: "Description and state",
        explanation: "Describe a quality, feeling, age, condition, or state.",
        example: "The children are tired.",
        translationTr: "Çocuklar yorgun."
      },
      {
        title: "Location",
        explanation: "Say where somebody or something is.",
        example: "My keys are on the desk.",
        translationTr: "Anahtarlarım masanın üzerinde."
      },
      {
        title: "Time, weather and basic facts",
        explanation: "Be appears in many fixed everyday statements.",
        example: "It is cold today.",
        translationTr: "Bugün hava soğuk."
      }
    ]),
    examples: Object.freeze([
      {
        label: "I + am",
        sentence: "I am ready.",
        translationTr: "Hazırım.",
        note: "Use am only with I."
      },
      {
        label: "Singular + is",
        sentence: "The lesson is easy.",
        translationTr: "Ders kolay.",
        note: "A singular noun usually takes is."
      },
      {
        label: "Plural + are",
        sentence: "My friends are outside.",
        translationTr: "Arkadaşlarım dışarıda.",
        note: "Plural subjects take are."
      },
      {
        label: "Question",
        sentence: "Are you busy?",
        translationTr: "Meşgul müsün?",
        note: "Move be before the subject; do not add do."
      },
      {
        label: "Negative",
        sentence: "She isn’t at work.",
        translationTr: "O işte değil.",
        note: "Put not directly after be."
      }
    ]),
    comparison: {
      title: "Be changes position; ordinary verbs use do/does",
      left: {
        label: "BE",
        rule: "Move be before the subject to make a question.",
        example: "Is she tired?",
        translationTr: "O yorgun mu?"
      },
      right: {
        label: "ORDINARY VERB",
        rule: "Use do/does before the subject; keep the main verb in base form.",
        example: "Does she work here?",
        translationTr: "O burada çalışıyor mu?"
      },
      takeaway:
        "Never say “Does she is…?” or “Do they are…?”. Be makes its own questions and negatives."
    },
    mistakes: Object.freeze([
      {
        wrong: "I is tired.",
        right: "I am tired.",
        why: "I always pairs with am in the present tense."
      },
      {
        wrong: "They is at home.",
        right: "They are at home.",
        why: "Plural subjects and you take are."
      },
      {
        wrong: "Do you are ready?",
        right: "Are you ready?",
        why: "Do is not used when be is the main verb."
      },
      { wrong: "She not is happy.", right: "She is not happy.", why: "Not comes after am/is/are." }
    ]),
    signalsLabel: "Common complements and sentence frames",
    signals: Object.freeze([
      "be + adjective",
      "be + noun",
      "be + place",
      "be + age",
      "be + from",
      "be + ready",
      "be + late",
      "be + at home",
      "be + interested in",
      "be + afraid of"
    ]),
    signalsNote:
      "These are not ‘signal words’ in the tense sense. They are common patterns that help you notice what normally follows be.",
    practiceChecks: Object.freeze([
      {
        prompt: "___ you from Ankara?",
        answer: "Are",
        explanation: "The subject is you, so use are; questions put be before the subject."
      },
      {
        prompt: "My brother ___ 19 years old.",
        answer: "is",
        explanation: "My brother is singular, so use is."
      },
      {
        prompt: "Rewrite as a negative: We are late.",
        answer: "We are not late. / We aren’t late.",
        explanation: "Put not directly after are."
      }
    ]),
    quickRules: Object.freeze([
      "I → am; he/she/it or one thing → is; you/we/they or plural things → are.",
      "Negative: be + not. Question: be + subject. Do/does is not needed.",
      "After be, add the information that identifies, describes, or locates the subject."
    ]),
    memoryHook: "Choose the subject first. The subject chooses am, is, or are."
  },
  {
    id: "present-simple",
    intro:
      "Use the Present Simple for routines, repeated actions, permanent or long-term facts, and states. The main form is simple, but he/she/it usually adds -s or -es.",
    sectionTitles: { comparison: "Present Simple vs Continuous", signals: "Time Expressions" },
    formula: "Subject + base verb (he/she/it: verb-s/-es)",
    formulaExplanation:
      "Use the base verb with I/you/we/they. With he/she/it, normally add -s or -es. Negatives and questions use do/does + base verb.",
    formulaParts: Object.freeze([
      {
        label: "SUBJECT",
        value: "I / you / we / they",
        note: "Use the base verb: work, live, study."
      },
      {
        label: "3RD PERSON",
        value: "he / she / it",
        note: "Usually add -s/-es: works, watches, studies."
      },
      { label: "AUXILIARY", value: "do / does", note: "Use for most negatives and questions." }
    ]),
    table: {
      headers: Object.freeze(["Meaning", "Positive", "Negative", "Question"]),
      rows: Object.freeze([
        Object.freeze(["I / you / we / they", "They work.", "They don’t work.", "Do they work?"]),
        Object.freeze(["he / she / it", "She works.", "She doesn’t work.", "Does she work?"])
      ])
    },
    uses: Object.freeze([
      {
        title: "Habits and routines",
        explanation: "Repeated actions and regular behaviour.",
        example: "I walk to work every day.",
        translationTr: "Her gün işe yürüyerek giderim."
      },
      {
        title: "Facts and general truths",
        explanation: "Things that are generally or scientifically true.",
        example: "Water boils at 100°C.",
        translationTr: "Su 100°C’de kaynar."
      },
      {
        title: "States",
        explanation: "Thoughts, feelings, possession and other states often use simple forms.",
        example: "She knows the answer.",
        translationTr: "Cevabı biliyor."
      },
      {
        title: "Schedules",
        explanation: "Fixed timetables can use the Present Simple for future time.",
        example: "The train leaves at 8:15.",
        translationTr: "Tren 8.15’te kalkıyor."
      }
    ]),
    examples: Object.freeze([
      {
        label: "Routine",
        sentence: "We usually eat dinner at seven.",
        translationTr: "Genellikle yedide akşam yemeği yeriz.",
        note: "A repeated routine."
      },
      {
        label: "Third person",
        sentence: "Leo studies English after work.",
        translationTr: "Leo işten sonra İngilizce çalışır.",
        note: "study → studies with he/she/it."
      },
      {
        label: "Negative",
        sentence: "She doesn’t drink coffee.",
        translationTr: "Kahve içmez.",
        note: "After doesn’t, drink stays in base form."
      },
      {
        label: "Question",
        sentence: "Do you live near here?",
        translationTr: "Buraya yakın mı yaşıyorsun?",
        note: "Use do + subject + base verb."
      }
    ]),
    comparison: {
      title: "Habit/state or happening now?",
      left: {
        label: "PRESENT SIMPLE",
        rule: "Routine, fact, repeated action, state.",
        example: "I work from home.",
        translationTr: "Evden çalışırım."
      },
      right: {
        label: "PRESENT CONTINUOUS",
        rule: "Action happening around now or temporary situation.",
        example: "I’m working from home this week.",
        translationTr: "Bu hafta evden çalışıyorum."
      },
      takeaway: "Ask whether the meaning is regular/general or temporary/in progress now."
    },
    mistakes: Object.freeze([
      {
        wrong: "She work here.",
        right: "She works here.",
        why: "He/she/it usually takes -s/-es in positive statements."
      },
      {
        wrong: "She doesn’t works here.",
        right: "She doesn’t work here.",
        why: "Does already carries the third-person marking, so the main verb is base form."
      },
      {
        wrong: "Does he likes it?",
        right: "Does he like it?",
        why: "After does, use the base verb."
      }
    ]),
    signalsLabel: "Common routine and frequency expressions",
    signals: Object.freeze([
      "always",
      "usually",
      "often",
      "sometimes",
      "rarely",
      "never",
      "every day",
      "on Mondays",
      "once a week",
      "in general"
    ]),
    signalsNote:
      "These expressions often support a Present Simple meaning, but meaning decides the tense—not the word alone.",
    practiceChecks: Object.freeze([
      {
        prompt: "She ___ (go) to the gym twice a week.",
        answer: "goes",
        explanation: "She is third-person singular; go → goes."
      },
      {
        prompt: "Make a question: They live here.",
        answer: "Do they live here?",
        explanation: "Use do with they, then the base verb live."
      },
      {
        prompt: "Correct: He doesn’t likes tea.",
        answer: "He doesn’t like tea.",
        explanation: "After doesn’t, use the base verb."
      }
    ]),
    quickRules: Object.freeze([
      "Use Present Simple for regular/general meaning, not simply because a sentence is in the present.",
      "He/she/it adds -s/-es only in positive statements.",
      "Do/does carries the grammar in questions and negatives; the main verb returns to base form."
    ]),
    memoryHook: "Regular or generally true? Think Present Simple."
  },
  {
    id: "there-is-there-are",
    intro:
      "Use there is / there are to introduce the existence or presence of something. Choose is for singular or uncountable nouns and are for plural nouns.",
    sectionTitles: { comparison: "There is/are vs It is", signals: "Quantity Patterns" },
    formula: "There + is / are + noun (+ place/time)",
    formulaExplanation:
      "The real information comes after is/are. Match the verb to the noun that follows: there is a problem; there are two problems.",
    formulaParts: Object.freeze([
      {
        label: "INTRODUCER",
        value: "there",
        note: "It does not mean ‘orada’ here; it introduces existence."
      },
      { label: "BE", value: "is / are", note: "Choose from the noun that follows." },
      {
        label: "NOUN",
        value: "a café / some water / three books",
        note: "The thing that exists or is present."
      }
    ]),
    table: {
      headers: Object.freeze(["Noun", "Positive", "Negative", "Question"]),
      rows: Object.freeze([
        Object.freeze(["singular / uncountable", "There is…", "There isn’t…", "Is there…?"]),
        Object.freeze(["plural", "There are…", "There aren’t…", "Are there…?"])
      ])
    },
    uses: Object.freeze([
      {
        title: "Introduce something new",
        explanation: "Say that something exists or is present.",
        example: "There is a message for you.",
        translationTr: "Senin için bir mesaj var."
      },
      {
        title: "Describe a place",
        explanation: "List what a place contains.",
        example: "There are two cafés near the station.",
        translationTr: "İstasyonun yakınında iki kafe var."
      },
      {
        title: "Talk about amounts",
        explanation: "Use with countable and uncountable quantities.",
        example: "There is some milk in the fridge.",
        translationTr: "Buzdolabında biraz süt var."
      }
    ]),
    examples: Object.freeze([
      {
        label: "Singular",
        sentence: "There is a problem.",
        translationTr: "Bir sorun var.",
        note: "a problem is singular."
      },
      {
        label: "Plural",
        sentence: "There are three windows.",
        translationTr: "Üç pencere var.",
        note: "three windows is plural."
      },
      {
        label: "Question",
        sentence: "Is there a pharmacy nearby?",
        translationTr: "Yakında eczane var mı?",
        note: "Move is before there."
      },
      {
        label: "Negative",
        sentence: "There aren’t any seats left.",
        translationTr: "Hiç boş koltuk kalmadı.",
        note: "Plural negative uses aren’t."
      }
    ]),
    comparison: {
      title: "Introducing existence vs identifying something",
      left: {
        label: "THERE IS / ARE",
        rule: "Introduce that something exists.",
        example: "There is a cat in the garden.",
        translationTr: "Bahçede bir kedi var."
      },
      right: {
        label: "IT IS",
        rule: "Identify or describe a thing already known.",
        example: "It is very friendly.",
        translationTr: "O çok arkadaş canlısı."
      },
      takeaway: "First introduce the cat with there is; then refer back to it with it."
    },
    mistakes: Object.freeze([
      {
        wrong: "There is two cars outside.",
        right: "There are two cars outside.",
        why: "Two cars is plural, so use are."
      },
      {
        wrong: "There have a bank here.",
        right: "There is a bank here.",
        why: "English uses there is/are for existence, not there have."
      }
    ]),
    signalsLabel: "Common quantity patterns after there is/are",
    signals: Object.freeze([
      "a / an",
      "one",
      "some",
      "any",
      "no",
      "many",
      "a lot of",
      "two / three…",
      "much",
      "enough"
    ]),
    signalsNote: "Look at the noun after the quantity word to decide whether is or are is needed.",
    practiceChecks: Object.freeze([
      { prompt: "___ there any shops near here?", answer: "Are", explanation: "shops is plural." },
      {
        prompt: "There ___ some water on the floor.",
        answer: "is",
        explanation: "water is uncountable and takes singular agreement here."
      },
      {
        prompt: "Correct: There is five students outside.",
        answer: "There are five students outside.",
        explanation: "five students is plural."
      }
    ]),
    quickRules: Object.freeze([
      "There is + singular/uncountable; there are + plural.",
      "Use it to introduce existence or presence.",
      "For questions, move is/are before there: Is there…? Are there…?"
    ]),
    memoryHook: "Look after the verb: the following noun decides is or are."
  },
  {
    id: "present-continuous",
    intro:
      "Use the Present Continuous for actions in progress now or around now, temporary situations, and changing developments. Build it with am/is/are + verb-ing.",
    sectionTitles: { comparison: "Present Continuous vs Simple", signals: "Time Expressions" },
    formula: "Subject + am / is / are + verb-ing",
    formulaExplanation:
      "The auxiliary be carries person and number; the main verb carries -ing. Both parts are required: ‘She is working’, not ‘She working’.",
    formulaParts: Object.freeze([
      {
        label: "SUBJECT",
        value: "I / you / he / she / it / we / they",
        note: "Choose the matching form of be."
      },
      { label: "BE", value: "am / is / are", note: "The auxiliary changes with the subject." },
      {
        label: "MAIN VERB",
        value: "working / studying / running",
        note: "Add -ing, with spelling changes when needed."
      }
    ]),
    table: {
      headers: Object.freeze(["Form", "Example", "Pattern"]),
      rows: Object.freeze([
        Object.freeze(["Positive", "She is studying.", "subject + be + V-ing"]),
        Object.freeze(["Negative", "She isn’t studying.", "subject + be + not + V-ing"]),
        Object.freeze(["Question", "Is she studying?", "be + subject + V-ing?"])
      ])
    },
    uses: Object.freeze([
      {
        title: "Happening now",
        explanation: "An action in progress at the moment of speaking.",
        example: "Please be quiet. I’m working.",
        translationTr: "Lütfen sessiz ol. Çalışıyorum."
      },
      {
        title: "Around now",
        explanation: "A temporary project or activity, not necessarily this exact second.",
        example: "I’m reading a great book this week.",
        translationTr: "Bu hafta harika bir kitap okuyorum."
      },
      {
        title: "Temporary situation",
        explanation: "A situation seen as temporary rather than permanent.",
        example: "She is staying with her aunt this month.",
        translationTr: "Bu ay teyzesinde kalıyor."
      },
      {
        title: "Changing development",
        explanation: "A trend or situation that is developing.",
        example: "The weather is getting warmer.",
        translationTr: "Hava giderek ısınıyor."
      }
    ]),
    examples: Object.freeze([
      {
        label: "Now",
        sentence: "They are waiting outside.",
        translationTr: "Dışarıda bekliyorlar.",
        note: "Action in progress now."
      },
      {
        label: "Temporary",
        sentence: "I’m working in Ankara for a few weeks.",
        translationTr: "Birkaç haftalığına Ankara’da çalışıyorum.",
        note: "Temporary, not necessarily permanent."
      },
      {
        label: "Negative",
        sentence: "He isn’t sleeping.",
        translationTr: "Uyumuyor.",
        note: "Put not after be."
      },
      {
        label: "Question",
        sentence: "Are you listening?",
        translationTr: "Dinliyor musun?",
        note: "Move be before the subject."
      }
    ]),
    comparison: {
      title: "Regular/general vs temporary/in progress",
      left: {
        label: "PRESENT SIMPLE",
        rule: "Routine, fact or state.",
        example: "She works at a hospital.",
        translationTr: "Bir hastanede çalışır."
      },
      right: {
        label: "PRESENT CONTINUOUS",
        rule: "Temporary or happening around now.",
        example: "She is working from home today.",
        translationTr: "Bugün evden çalışıyor."
      },
      takeaway:
        "The time expression helps, but the speaker’s meaning—regular or temporary—is the real decision."
    },
    mistakes: Object.freeze([
      {
        wrong: "She working now.",
        right: "She is working now.",
        why: "Present Continuous requires a form of be."
      },
      {
        wrong: "I am know the answer.",
        right: "I know the answer.",
        why: "Know is normally a stative verb and usually uses Present Simple."
      },
      {
        wrong: "He is runing.",
        right: "He is running.",
        why: "Short stressed vowel + final consonant often doubles the consonant before -ing."
      }
    ]),
    signalsLabel: "Common expressions for current or temporary time",
    signals: Object.freeze([
      "now",
      "right now",
      "at the moment",
      "currently",
      "today",
      "this week",
      "these days",
      "for now",
      "still",
      "Look! / Listen!"
    ]),
    signalsNote:
      "These expressions strongly suggest current/temporary meaning, but stative verbs may still use Present Simple.",
    practiceChecks: Object.freeze([
      {
        prompt: "Look! The bus ___ (come).",
        answer: "is coming",
        explanation: "The action is happening now; bus is singular."
      },
      {
        prompt: "Correct: She studying for an exam this week.",
        answer: "She is studying for an exam this week.",
        explanation: "Be is required before the -ing form."
      },
      {
        prompt: "Choose: I know / am knowing the answer.",
        answer: "I know the answer.",
        explanation: "Know is normally stative."
      }
    ]),
    quickRules: Object.freeze([
      "Present Continuous = be + V-ing; never drop be.",
      "Use it for actions in progress, temporary situations, and changes.",
      "Do not automatically use it with stative verbs such as know, want, need, and believe."
    ]),
    memoryHook: "If you can imagine the action as ‘in progress’, think be + V-ing."
  },
  {
    id: "can-could",
    intro:
      "Can and could are modal verbs. They express ability, possibility, permission, and requests. A modal is followed by the base form of the main verb—never to + verb and never verb-s.",
    sectionTitles: { comparison: "Can vs Could", signals: "Useful Patterns" },
    formula: "Subject + can / could + base verb",
    formulaExplanation:
      "Modal verbs do not change with he/she/it. Negatives add not; questions move the modal before the subject.",
    formulaParts: Object.freeze([
      {
        label: "SUBJECT",
        value: "I / you / he / she / it / we / they",
        note: "The modal form stays the same for every subject."
      },
      {
        label: "MODAL",
        value: "can / could",
        note: "Carries ability, possibility, permission or request meaning."
      },
      { label: "BASE VERB", value: "swim / help / come", note: "No to and no -s after can/could." }
    ]),
    table: {
      headers: Object.freeze(["Function", "Can", "Could"]),
      rows: Object.freeze([
        Object.freeze(["Ability", "I can swim.", "I could swim at five."]),
        Object.freeze(["Request", "Can you help?", "Could you help?"]),
        Object.freeze(["Possibility", "It can happen.", "It could happen."])
      ])
    },
    uses: Object.freeze([
      {
        title: "Present ability",
        explanation: "Say what somebody is able to do now.",
        example: "Mina can drive.",
        translationTr: "Mina araba kullanabilir."
      },
      {
        title: "Past general ability",
        explanation: "Could often describes a general ability in the past.",
        example: "I could read before I started school.",
        translationTr: "Okula başlamadan önce okuyabiliyordum."
      },
      {
        title: "Requests and permission",
        explanation: "Could is often softer/more polite than can.",
        example: "Could you open the window?",
        translationTr: "Pencereyi açabilir misiniz?"
      },
      {
        title: "Possibility",
        explanation: "Could often presents a less certain possibility.",
        example: "It could rain later.",
        translationTr: "Daha sonra yağmur yağabilir."
      }
    ]),
    examples: Object.freeze([
      {
        label: "Ability",
        sentence: "She can speak three languages.",
        translationTr: "Üç dil konuşabilir.",
        note: "Can + base verb speak."
      },
      {
        label: "Past ability",
        sentence: "He could run very fast as a child.",
        translationTr: "Çocukken çok hızlı koşabiliyordu.",
        note: "General past ability."
      },
      {
        label: "Polite request",
        sentence: "Could I ask a question?",
        translationTr: "Bir soru sorabilir miyim?",
        note: "Could makes the request more tentative/polite."
      },
      {
        label: "Negative",
        sentence: "I can’t come tonight.",
        translationTr: "Bu akşam gelemem.",
        note: "Cannot/can’t + base verb."
      }
    ]),
    comparison: {
      title: "Direct/current vs past/softer/more tentative",
      left: {
        label: "CAN",
        rule: "Common for present ability and direct everyday requests.",
        example: "Can you wait a minute?",
        translationTr: "Bir dakika bekleyebilir misin?"
      },
      right: {
        label: "COULD",
        rule: "Past ability, polite requests, or a more tentative possibility.",
        example: "Could you wait a minute?",
        translationTr: "Bir dakika bekleyebilir misiniz?"
      },
      takeaway:
        "Could is not simply ‘past can’; its polite and possibility meanings are also common in the present/future."
    },
    mistakes: Object.freeze([
      { wrong: "She can swims.", right: "She can swim.", why: "After a modal, use the base verb." },
      { wrong: "I can to help.", right: "I can help.", why: "Do not use to after can/could." },
      {
        wrong: "Do you can drive?",
        right: "Can you drive?",
        why: "The modal itself moves before the subject; do is not needed."
      }
    ]),
    signalsLabel: "Frequent modal sentence patterns",
    signals: Object.freeze([
      "can + base verb",
      "could + base verb",
      "can’t",
      "couldn’t",
      "Can I…?",
      "Could I…?",
      "Can you…?",
      "Could you…?",
      "could be",
      "could happen"
    ]),
    signalsNote:
      "Focus on function: ability, request, permission or possibility. The same modal can express more than one meaning.",
    practiceChecks: Object.freeze([
      {
        prompt: "Correct: He can speaks English.",
        answer: "He can speak English.",
        explanation: "Modal + base verb."
      },
      {
        prompt: "Make this request more polite: Can you help me?",
        answer: "Could you help me?",
        explanation: "Could commonly softens requests."
      },
      {
        prompt: "Past general ability: When I was six, I ___ swim.",
        answer: "could",
        explanation: "Could is natural for general past ability."
      }
    ]),
    quickRules: Object.freeze([
      "Can/could + base verb; never add -s and normally do not add to.",
      "Questions invert the modal and subject: Can you…? Could she…?",
      "Could can mean past ability, polite request, or less certain possibility."
    ]),
    memoryHook: "Modal first, base verb second—nothing in between."
  },
  {
    id: "wh-questions",
    intro:
      "Wh- questions ask for specific information rather than yes/no. Choose the question word from the information you need, then build the correct question order.",
    sectionTitles: { comparison: "Object vs Subject Questions", signals: "Question Words" },
    formula: "Wh-word + auxiliary + subject + main verb?",
    formulaExplanation:
      "With ordinary verbs, most object questions use do/does/did. With be or a modal, use that verb as the auxiliary. Subject questions are different: who/what can directly replace the subject.",
    formulaParts: Object.freeze([
      {
        label: "WH-WORD",
        value: "who / what / when / where / why / how",
        note: "Choose from the missing information."
      },
      {
        label: "AUXILIARY",
        value: "do / does / did / be / modal",
        note: "Depends on the verb and tense."
      },
      {
        label: "SUBJECT + VERB",
        value: "you live / she work / they go",
        note: "Ordinary question order follows the auxiliary."
      }
    ]),
    table: {
      headers: Object.freeze(["Need", "Question word", "Example"]),
      rows: Object.freeze([
        Object.freeze(["person", "who", "Who did you call?"]),
        Object.freeze(["thing", "what", "What are you doing?"]),
        Object.freeze(["place", "where", "Where does she live?"]),
        Object.freeze(["time", "when", "When does it start?"]),
        Object.freeze(["reason", "why", "Why are they leaving?"]),
        Object.freeze(["manner", "how", "How did you learn?"])
      ])
    },
    uses: Object.freeze([
      {
        title: "Ask about a person",
        explanation: "Use who when the missing information is a person.",
        example: "Who did you meet?",
        translationTr: "Kiminle tanıştın?"
      },
      {
        title: "Ask about a thing or action",
        explanation: "Use what for things, ideas and actions.",
        example: "What are you reading?",
        translationTr: "Ne okuyorsun?"
      },
      {
        title: "Ask about place/time/reason",
        explanation: "Use where, when and why for different information types.",
        example: "Why did you leave early?",
        translationTr: "Neden erken ayrıldın?"
      },
      {
        title: "Ask about manner or degree",
        explanation: "How combines with adjectives/adverbs and many other expressions.",
        example: "How often do you exercise?",
        translationTr: "Ne sıklıkla egzersiz yaparsın?"
      }
    ]),
    examples: Object.freeze([
      {
        label: "Present Simple",
        sentence: "Where do you work?",
        translationTr: "Nerede çalışıyorsun?",
        note: "Wh + do + subject + base verb."
      },
      {
        label: "Be",
        sentence: "Why is she upset?",
        translationTr: "O neden üzgün?",
        note: "Be itself comes before the subject."
      },
      {
        label: "Modal",
        sentence: "What can I do?",
        translationTr: "Ne yapabilirim?",
        note: "Modal comes before the subject."
      },
      {
        label: "Subject question",
        sentence: "Who called you?",
        translationTr: "Seni kim aradı?",
        note: "Who is the subject, so no do/did is needed."
      }
    ]),
    comparison: {
      title: "Is the wh-word the subject or the object?",
      left: {
        label: "OBJECT QUESTION",
        rule: "The wh-word asks about the object; use normal question inversion.",
        example: "Who did Anna call?",
        translationTr: "Anna kimi aradı?"
      },
      right: {
        label: "SUBJECT QUESTION",
        rule: "Who/what itself is the subject; usually no do/does/did.",
        example: "Who called Anna?",
        translationTr: "Anna’yı kim aradı?"
      },
      takeaway: "Find the subject first. If who/what is the subject, do not insert do/does/did."
    },
    mistakes: Object.freeze([
      {
        wrong: "Where you live?",
        right: "Where do you live?",
        why: "Present Simple object questions need do/does."
      },
      {
        wrong: "Why she is late?",
        right: "Why is she late?",
        why: "With be, invert be and the subject."
      },
      {
        wrong: "Who did call you?",
        right: "Who called you?",
        why: "If who is the subject, do/did is usually unnecessary."
      }
    ]),
    signalsLabel: "Core question words and extensions",
    signals: Object.freeze([
      "who",
      "what",
      "where",
      "when",
      "why",
      "how",
      "which",
      "whose",
      "how often",
      "how long",
      "how much",
      "how many"
    ]),
    signalsNote:
      "Choose the question word by the information you want, then choose the grammar pattern from the verb and tense.",
    practiceChecks: Object.freeze([
      {
        prompt: "___ do you live? — In İzmir.",
        answer: "Where",
        explanation: "The answer is a place."
      },
      {
        prompt: "Correct: Why he is tired?",
        answer: "Why is he tired?",
        explanation: "With be, invert is and he."
      },
      {
        prompt: "Choose: Who did break / Who broke the window?",
        answer: "Who broke the window?",
        explanation: "Who is the subject of broke."
      }
    ]),
    quickRules: Object.freeze([
      "Wh-word first; then build the question pattern required by the verb and tense.",
      "Ordinary Present/Past Simple object questions usually need do/does/did.",
      "Subject questions with who/what usually do not use do/does/did."
    ]),
    memoryHook: "First ask: what information is missing? Then ask: who is the subject?"
  },
  {
    id: "present-perfect",
    intro:
      "Use the Present Perfect to connect past events or situations to the present: life experience, a present result, or a time period that is still open.",
    sectionTitles: {
      comparison: "Present Perfect vs Past Simple",
      signals: "Signal Words & Time Phrases"
    },
    formula: "Subject + have / has + past participle",
    formulaExplanation:
      "Have/has carries the present-tense agreement; the main verb uses its past participle form (worked, seen, gone, written). Do not use a finished past-time expression such as yesterday with this form.",
    formulaParts: Object.freeze([
      {
        label: "SUBJECT",
        value: "I / you / we / they → have",
        note: "Use have with I/you/we/they."
      },
      {
        label: "AUXILIARY",
        value: "he / she / it → has",
        note: "Use has with third-person singular."
      },
      {
        label: "PARTICIPLE",
        value: "worked / seen / gone / written",
        note: "Regular -ed or irregular third form."
      }
    ]),
    table: {
      headers: Object.freeze(["Form", "Example", "Pattern"]),
      rows: Object.freeze([
        Object.freeze(["Positive", "She has finished.", "subject + have/has + V3"]),
        Object.freeze(["Negative", "She hasn’t finished.", "subject + have/has + not + V3"]),
        Object.freeze(["Question", "Has she finished?", "have/has + subject + V3?"])
      ])
    },
    uses: Object.freeze([
      {
        title: "Life experience",
        explanation:
          "Talk about whether something has happened at any time in life; exact time is not the focus.",
        example: "I have never been to Japan.",
        translationTr: "Japonya’ya hiç gitmedim."
      },
      {
        title: "Present result",
        explanation: "A past action has a result that matters now.",
        example: "He has lost his keys.",
        translationTr: "Anahtarlarını kaybetti (ve şu anda anahtarları yok)."
      },
      {
        title: "Unfinished time",
        explanation: "The time period includes now.",
        example: "We have had three meetings this week.",
        translationTr: "Bu hafta üç toplantı yaptık."
      },
      {
        title: "State continuing until now",
        explanation: "Use since/for with many states or long situations.",
        example: "She has lived here for five years.",
        translationTr: "Beş yıldır burada yaşıyor."
      }
    ]),
    examples: Object.freeze([
      {
        label: "Experience",
        sentence: "They have travelled to five countries.",
        translationTr: "Beş ülkeye seyahat ettiler.",
        note: "No finished time is stated."
      },
      {
        label: "Result now",
        sentence: "The ground is wet. It has rained.",
        translationTr: "Yer ıslak. Yağmur yağmış.",
        note: "The present result is visible."
      },
      {
        label: "Repeated until now",
        sentence: "I’ve read this book three times.",
        translationTr: "Bu kitabı üç kez okudum.",
        note: "Life/time period is still open."
      },
      {
        label: "Question",
        sentence: "Have you ever tried sushi?",
        translationTr: "Hiç suşi denedin mi?",
        note: "Ever is common in experience questions."
      }
    ]),
    comparison: {
      title: "Connection to now or finished past time?",
      left: {
        label: "PRESENT PERFECT",
        rule: "No finished past time; experience/result/open time connects to now.",
        example: "I have visited Paris.",
        translationTr: "Paris’i ziyaret ettim."
      },
      right: {
        label: "PAST SIMPLE",
        rule: "A finished event at a finished past time.",
        example: "I visited Paris last summer.",
        translationTr: "Geçen yaz Paris’i ziyaret ettim."
      },
      takeaway:
        "If you answer ‘When?’ with a finished past time such as yesterday/last year/in 2022, Past Simple is normally the natural choice."
    },
    mistakes: Object.freeze([
      {
        wrong: "I have went to the store.",
        right: "I have gone to the store.",
        why: "Present Perfect needs the past participle: go → went → gone."
      },
      {
        wrong: "I have seen him yesterday.",
        right: "I saw him yesterday.",
        why: "Yesterday is a finished past-time expression, so use Past Simple."
      },
      { wrong: "She have finished.", right: "She has finished.", why: "He/she/it takes has." }
    ]),
    signalsLabel: "Common Present Perfect time expressions",
    signals: Object.freeze([
      "already",
      "just",
      "yet",
      "ever",
      "never",
      "so far",
      "recently",
      "up to now",
      "since",
      "for",
      "this week",
      "today"
    ]),
    signalsNote:
      "Signal words help, but the central question is whether the past is connected to now and whether the time is finished.",
    practiceChecks: Object.freeze([
      {
        prompt: "I ___ never ___ (see) snow.",
        answer: "have never seen",
        explanation: "Life experience with I → have + past participle seen."
      },
      {
        prompt: "Choose: I have met / met her yesterday.",
        answer: "I met her yesterday.",
        explanation: "Yesterday is a finished past time."
      },
      {
        prompt: "___ she finished yet?",
        answer: "Has",
        explanation: "Question form: has + subject + past participle."
      }
    ]),
    quickRules: Object.freeze([
      "Form: have/has + past participle.",
      "Use it when the past connects to now and the exact finished past time is not the focus.",
      "Finished past time (yesterday, last year, in 2020) usually points to Past Simple."
    ]),
    memoryHook: "Present Perfect builds a bridge: past event → present relevance."
  }
]);

const CONTENT_BY_ID = new Map(CONTENT.map((content) => [content.id, content]));

export function getGrammarTeachingContent(lessonId: string): GrammarTeachingContent | undefined {
  return CONTENT_BY_ID.get(lessonId);
}
