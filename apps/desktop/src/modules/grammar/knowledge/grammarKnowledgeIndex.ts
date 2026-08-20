export interface GrammarSubtopic {
  readonly cardId: string;
  readonly title: string;
  readonly cacheAvailable: boolean;
}

export interface GrammarKnowledgeLesson {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly level: string;
  readonly description: string;
  readonly keywords: readonly string[];
  readonly coreTopics: readonly string[];
  readonly subtopics: readonly GrammarSubtopic[];
  readonly implemented?: boolean;
}

export interface GrammarKnowledgeArea {
  readonly id: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly level: string;
  readonly accent: "gold" | "forest";
  readonly lessons: readonly GrammarKnowledgeLesson[];
}

type AtlasTuple = readonly [cardId: string, title: string, cacheAvailable: boolean];

const ATLAS_TOPICS: readonly AtlasTuple[] = Object.freeze([
  ["A001","Present Perfect Continuous",true],["A002","Past Continuous",true],["A003","Past Perfect",true],["A004","Past Perfect Continuous",true],["A005","Future Continuous",true],["A006","Future Perfect",true],["A007","Future Perfect Continuous",true],["A008","Stative Verbs",true],["A009","Have been vs Have gone",true],["A010","Narrative Tenses",false],["A011","Present Perfect with just/already/yet",true],["A012","Present Perfect with ever/never",true],["A013","Present Perfect unfinished time",true],["A014","Past Simple finished-time expressions",false],["A015","Always with continuous forms",true],["A016","Sequence of Tenses",true],
  ["A017","Can for ability",true],["A018","Could for past ability",true],["A019","Be able to",true],["A020","Can for permission",true],["A021","May for permission",true],["A022","Could for polite requests",true],["A023","Would for polite requests",true],["A024","Be allowed to",true],["A025","May and Might for possibility",true],["A026","Must for obligation",true],["A027","Have to for obligation",true],["A028","Should and Ought to",true],["A029","Mustn't vs Don't have to",true],["A030","Needn't",true],["A031","Must vs Can't deduction",true],["A032","Modal perfects",true],
  ["A033","Unless",true],["A034","Provided / Providing that",true],["A035","As long as",true],["A036","Mixed Conditionals",true],["A037","Wish about the present",true],["A038","Wish about the past",true],["A039","If only",true],["A040","Would rather",true],["A041","Basic Passive Form",true],["A042","Passive across tenses",true],["A043","Passive by-agent",true],["A044","Get Passive",true],["A045","Have something done",true],["A046","Get something done",true],["A047","Passive reporting structures",true],["A048","Impersonal Passive",true],
  ["A049","Reported Statements",true],["A050","Reported Questions",true],["A051","Reported Commands",true],["A052","Reported Speech Backshift",true],["A053","Say vs Tell",true],["A054","Reporting Verbs",true],["A055","Reported time/place words",true],["A056","No backshift in reported speech",true],["A057","Zero Article",true],["A058","Generic reference with articles",true],["A059","Articles with proper names",true],["A060","Articles with geographical names",true],["A061","A/An with jobs and classifications",true],["A062","Articles vs possessives",true],["A063","This and That",true],["A064","These and Those",true],
  ["A065","Some",true],["A066","Any",true],["A067","No and None",true],["A068","Much and Many",true],["A069","A lot of / Lots of",true],["A070","Few vs A few",true],["A071","Little vs A little",true],["A072","Enough",true],["A073","All",true],["A074","Every",true],["A075","Each",true],["A076","Both",true],["A077","Either",true],["A078","Neither",true],["A079","Most",true],["A080","Another / Other / Others",true],
  ["A081","Irregular plurals",true],["A082","Possessive 's",true],["A083","Of-possessive",true],["A084","Compound Nouns",true],["A085","Reflexive Pronouns",true],["A086","Each other / One another",true],["A087","Indefinite Pronouns",false],["A088","One / Ones substitution",true],["A089","Adjective Order",true],["A090","-ed vs -ing Adjectives",true],["A091","Adjective vs Adverb",true],["A092","Adverb Position",true],["A093","Frequency Adverbs",true],["A094","So vs Such",true],["A095","Too vs Enough",true],["A096","Quite / Rather / Fairly",true],
  ["A097","As ... as",true],["A098","Less and Least",true],["A099","Comparative modifiers",true],["A100","The more ... the more",true],["A101","More and more",true],["A102","Superlative + ever",true],["A103","Same as / Different from",true],["A104","Like vs As",true],["A105","Verb + -ing",true],["A106","Verb + to-infinitive",true],["A107","Verb + object + to-infinitive",true],["A108","Bare Infinitive",true],["A109","Preposition + -ing",true],["A110","Adjective + infinitive",true],["A111","Noun + infinitive",true],["A112","Infinitive of purpose",true],
  ["A113","Stop doing vs Stop to do",true],["A114","Remember doing vs Remember to do",true],["A115","Try doing vs Try to do",true],["A116","Regret doing vs Regret to do",true],["A117","Mean doing vs Mean to do",true],["A118","Go on doing vs Go on to do",true],["A119","Allow / Advise patterns",true],["A120","Make / Let / Help patterns",true],["A121","Who in relative clauses",true],["A122","Which in relative clauses",true],["A123","That in relative clauses",true],["A124","Whose",true],["A125","Where and When relative words",true],["A126","Reduced Relative Clauses",true],["A127","Participle Clauses",true],["A128","Prepositions in relative clauses",true],
  ["A129","Because vs Because of",true],["A130","Although / Even though",true],["A131","Despite / In spite of",true],["A132","So that",true],["A133","In order to / So as to",true],["A134","So ... that",true],["A135","Such ... that",true],["A136","While vs Whereas",true],["A137","Yes/No Questions",true],["A138","Wh- Questions",true],["A139","Subject Questions",true],["A140","Indirect Questions",true],["A141","Question Tags",true],["A142","Negative Questions",true],["A143","Short Answers",true],["A144","Do-support",true],
  ["A145","At / On / In for time",true],["A146","At / On / In for place",true],["A147","By vs Until",true],["A148","During vs For",true],["A149","From vs Since",true],["A150","Before vs After",false],["A151","To / Into / Onto",true],["A152","Dependent Prepositions",true],["A153","There is / There are",true],["A154","Dummy It",true],["A155","Subject-Verb Agreement",true],["A156","Basic Word Order",true],["A157","Inversion after negative adverbials",true],["A158","Cleft Sentences",true],["A159","Emphatic Do",true],["A160","Ellipsis and Substitution",true]
]);

const atlasById = new Map(
  ATLAS_TOPICS.map(([cardId, title, cacheAvailable]) => [cardId, { cardId, title, cacheAvailable }] as const)
);

function subtopics(...cardIds: readonly string[]): readonly GrammarSubtopic[] {
  return Object.freeze(cardIds.map((cardId) => {
    const topic = atlasById.get(cardId);
    if (topic === undefined) throw new Error(`Unknown grammar atlas card: ${cardId}`);
    return topic;
  }));
}

function range(prefixStart: number, prefixEnd: number): readonly string[] {
  return Object.freeze(Array.from({ length: prefixEnd - prefixStart + 1 }, (_, index) => `A${String(prefixStart + index).padStart(3, "0")}`));
}

function lesson(
  id: string,
  title: string,
  category: string,
  level: string,
  description: string,
  keywords: readonly string[],
  atlasIds: readonly string[],
  coreTopics: readonly string[] = [],
  implemented = false
): GrammarKnowledgeLesson {
  return Object.freeze({ id, title, category, level, description, keywords: Object.freeze(keywords), coreTopics: Object.freeze(coreTopics), subtopics: subtopics(...atlasIds), implemented });
}

export const GRAMMAR_KNOWLEDGE_AREAS: readonly GrammarKnowledgeArea[] = Object.freeze([
  {
    id: "tenses-time", eyebrow: "TENSES & TIME", title: "Tenses & Time", description: "Present, past, perfect forms, aspect, and time reference.", level: "A1–C1", accent: "gold",
    lessons: Object.freeze([
      lesson("present-simple-continuous", "Present Simple vs Present Continuous", "Tenses & Time", "A1–B1", "Choose between routines/states and actions happening around now.", ["present", "simple", "continuous", "routine", "now"], [], ["Present Simple vs Continuous"]),
      lesson("past-narrative", "Past Simple, Past Continuous & Narrative Tenses", "Tenses & Time", "A2–B2", "Build finished events, background actions, and narrative sequence in the past.", ["past", "simple", "continuous", "narrative"], ["A002", "A010", "A014"]),
      lesson("present-perfect", "Present Perfect & Past Simple", "Tenses & Time", "B1–B2", "Connect past events to now and separate them from finished past time.", ["present", "perfect", "past", "simple", "already", "yet", "ever", "never"], ["A009", "A011", "A012", "A013"], ["Present Perfect vs Past Simple"], true),
      lesson("present-perfect-continuous", "Present Perfect Continuous", "Tenses & Time", "B1–B2", "Focus on duration or activity continuing up to, or just before, now.", ["present", "perfect", "continuous", "have been"], ["A001"]),
      lesson("past-perfect-family", "Past Perfect & Past Perfect Continuous", "Tenses & Time", "B2", "Look back from a past reference point and express earlier completion or duration.", ["past", "perfect", "had", "had been"], ["A003", "A004"]),
      lesson("future-forms", "Future Forms", "Tenses & Time", "A2–C1", "Choose among planned, predicted, arranged, continuous, and completed future meanings.", ["future", "will", "going to", "continuous", "perfect"], ["A005", "A006", "A007"], ["Future forms"]),
      lesson("aspect-tense-choice", "Aspect & Tense Choice", "Tenses & Time", "B1–C1", "Handle stative verbs, repeated behavior, and tense sequence without translating mechanically.", ["stative", "always", "sequence", "aspect"], ["A008", "A015", "A016"]),
      lesson("for-since", "For vs Since", "Tenses & Time", "B1", "Choose duration with ‘for’ and a starting point with ‘since’.", ["for", "since", "duration", "starting point"], [], ["for vs since"])
    ])
  },
  {
    id: "nouns-articles", eyebrow: "NOUN SYSTEM", title: "Nouns & Articles", description: "Articles, countability, determiners, pronouns, and possession.", level: "A1–C1", accent: "forest",
    lessons: Object.freeze([
      lesson("articles", "Articles: a, an, the & Zero Article", "Nouns & Articles", "A1–B2", "Choose articles by reference, specificity, countability, names, and shared knowledge.", ["article", "a", "an", "the", "zero article"], range(57, 62), ["a/an/the"]),
      lesson("demonstratives", "Demonstratives: this, that, these, those", "Nouns & Articles", "A1–A2", "Point to singular and plural things by distance and discourse context.", ["this", "that", "these", "those", "demonstrative"], ["A063", "A064"]),
      lesson("countability-quantifiers", "Countability & Quantifiers", "Nouns & Articles", "A1–B2", "Connect countable/uncountable nouns with natural quantity expressions.", ["countable", "uncountable", "some", "any", "much", "many", "few", "little", "enough"], range(65, 72), ["Countable vs Uncountable"]),
      lesson("determiners", "Determiners", "Nouns & Articles", "A2–B2", "Use all, every, each, both, either, neither, most, another, and other precisely.", ["all", "every", "each", "both", "either", "neither", "most", "other"], range(73, 80)),
      lesson("nouns-possession", "Nouns & Possession", "Nouns & Articles", "A2–B2", "Handle irregular plurals, possessive structures, and compound nouns.", ["plural", "possessive", "compound noun"], range(81, 84)),
      lesson("pronouns-substitution", "Pronouns & Substitution", "Nouns & Articles", "A2–B2", "Use reflexive, reciprocal, indefinite, and one/ones substitution patterns.", ["reflexive", "pronoun", "each other", "one another", "indefinite", "one", "ones"], range(85, 88))
    ])
  },
  {
    id: "modals-verb-patterns", eyebrow: "VERB SYSTEM", title: "Modals & Verb Patterns", description: "Ability, obligation, voice, infinitives, gerunds, and verb patterns.", level: "A2–C1", accent: "gold",
    lessons: Object.freeze([
      lesson("modal-verbs", "Modal Verbs", "Modals & Verb Patterns", "A2–C1", "Express ability, permission, possibility, obligation, advice, deduction, and modal-perfect meanings.", ["can", "could", "may", "might", "must", "have to", "should", "ought", "needn't", "modal"], range(17, 32), ["Modals"]),
      lesson("active-passive", "Active & Passive Voice", "Modals & Verb Patterns", "B1–B2", "Choose whether the actor or the action/result should be in focus.", ["active", "passive", "by agent", "get passive"], range(41, 44), ["Active vs Passive"]),
      lesson("causative-reporting-passive", "Causatives & Reporting Passive", "Modals & Verb Patterns", "B2–C1", "Use have/get something done and formal reporting-passive structures.", ["causative", "have something done", "get something done", "reporting passive"], range(45, 48)),
      lesson("gerunds-infinitives", "Gerunds & Infinitives", "Modals & Verb Patterns", "B1–C1", "Choose -ing, to-infinitive, bare infinitive, and verb-pattern complements by structure and meaning.", ["gerund", "infinitive", "verb pattern", "to do", "doing"], range(105, 120), ["Gerund vs Infinitive"]),
      lesson("used-to-family", "Used to / Be used to / Get used to", "Modals & Verb Patterns", "B1–B2", "Separate past habits from being accustomed to something and becoming accustomed to it.", ["used to", "be used to", "get used to", "accustomed"], [], ["Used-to family"])
    ])
  },
  {
    id: "clauses-conditionals", eyebrow: "SENTENCE LOGIC", title: "Clauses & Conditionals", description: "Conditionals, relative clauses, reported speech, questions, and sentence logic.", level: "A2–C1", accent: "forest",
    lessons: Object.freeze([
      lesson("conditionals", "Conditionals", "Clauses & Conditionals", "A2–C1", "Build real, hypothetical, past-unreal, mixed, and alternative conditional structures.", ["conditional", "if", "unless", "provided", "as long as", "mixed"], range(33, 36), ["Conditionals"]),
      lesson("wishes-unreal", "Wishes & Unreal Preference", "Clauses & Conditionals", "B1–C1", "Express present wishes, past regret, if only, and would rather.", ["wish", "if only", "would rather", "regret"], range(37, 40)),
      lesson("reported-speech", "Reported Speech", "Clauses & Conditionals", "B1–C1", "Report statements, questions, commands, tense shifts, and reporting verbs.", ["reported", "speech", "backshift", "say", "tell", "reporting verbs"], range(49, 56)),
      lesson("relative-clauses", "Relative Clauses", "Clauses & Conditionals", "B1–C1", "Choose relative words, defining/non-defining meaning, reductions, participles, and prepositions.", ["relative", "who", "which", "that", "whose", "where", "when", "reduced"], range(121, 128), ["Relative clauses"]),
      lesson("questions-auxiliaries", "Questions, Negation & Auxiliaries", "Clauses & Conditionals", "A1–B2", "Build yes/no, wh-, subject, indirect, tag, and negative questions with correct auxiliary behavior.", ["question", "wh", "subject question", "indirect", "tag", "negative", "do support"], range(137, 144)),
      lesson("word-order-agreement", "Word Order & Agreement", "Clauses & Conditionals", "A1–B2", "Control existential there, dummy it, subject–verb agreement, and basic English word order.", ["word order", "agreement", "there is", "there are", "dummy it"], range(153, 156)),
      lesson("emphasis-advanced", "Emphasis & Advanced Structures", "Clauses & Conditionals", "B2–C1", "Use inversion, cleft sentences, emphatic do, ellipsis, and substitution.", ["inversion", "cleft", "emphatic do", "ellipsis", "substitution"], range(157, 160))
    ])
  },
  {
    id: "prepositions-linkers", eyebrow: "RELATIONSHIPS", title: "Prepositions & Linkers", description: "Time, place, movement, dependent prepositions, and connectors.", level: "A1–C1", accent: "gold",
    lessons: Object.freeze([
      lesson("time-prepositions", "Time Prepositions", "Prepositions & Linkers", "A1–B2", "Choose at/on/in, by/until, during/for, from/since, and before/after in time expressions.", ["preposition", "time", "at", "on", "in", "by", "until", "during", "for", "from", "since", "before", "after"], ["A145", "A147", "A148", "A149", "A150"]),
      lesson("place-movement-prepositions", "Place & Movement Prepositions", "Prepositions & Linkers", "A1–B1", "Choose at/on/in for place and to/into/onto for movement.", ["place", "movement", "at", "on", "in", "to", "into", "onto"], ["A146", "A151"]),
      lesson("dependent-prepositions", "Dependent Prepositions", "Prepositions & Linkers", "B1–C1", "Learn which prepositions are selected by particular verbs, adjectives, and nouns.", ["dependent preposition", "verb preposition", "adjective preposition"], ["A152"]),
      lesson("cause-contrast-linkers", "Cause & Contrast Linkers", "Prepositions & Linkers", "A2–B2", "Connect ideas with because/because of, although/even though, despite/in spite of, while/whereas.", ["because", "although", "despite", "whereas", "contrast", "cause"], ["A129", "A130", "A131", "A136"]),
      lesson("purpose-result-linkers", "Purpose & Result Linkers", "Prepositions & Linkers", "A2–B2", "Express purpose and result with so that, in order to, so...that, and such...that.", ["purpose", "result", "so that", "in order to", "such that"], range(132, 135))
    ])
  },
  {
    id: "adjectives-adverbs", eyebrow: "DESCRIPTION", title: "Adjectives & Adverbs", description: "Comparison, degree, order, modifiers, and natural emphasis.", level: "A1–C1", accent: "forest",
    lessons: Object.freeze([
      lesson("adjective-form-order", "Adjective Form & Order", "Adjectives & Adverbs", "A2–B2", "Order multiple adjectives naturally and distinguish -ed from -ing adjective meanings.", ["adjective", "order", "ed", "ing"], ["A089", "A090"]),
      lesson("adjectives-adverbs", "Adjectives vs Adverbs", "Adjectives & Adverbs", "A1–B2", "Choose adjective/adverb forms and place frequency and other adverbs naturally.", ["adjective", "adverb", "position", "frequency"], ["A091", "A092", "A093"]),
      lesson("degree-intensity", "Degree & Intensity", "Adjectives & Adverbs", "A2–B2", "Control so/such, too/enough, quite/rather/fairly and related degree meanings.", ["degree", "so", "such", "too", "enough", "quite", "rather", "fairly"], ["A094", "A095", "A096"]),
      lesson("comparison", "Comparatives & Superlatives", "Adjectives & Adverbs", "A1–C1", "Compare equality, difference, degree, change, and extremes naturally.", ["comparative", "superlative", "as as", "less", "least", "more", "same", "different", "like", "as"], range(97, 104), ["Comparative vs Superlative"])
    ])
  }
]);

export const GRAMMAR_KNOWLEDGE_LESSONS: readonly GrammarKnowledgeLesson[] = Object.freeze(
  GRAMMAR_KNOWLEDGE_AREAS.flatMap((area) => area.lessons)
);

export const GRAMMAR_ATLAS_PLANNED_COUNT = 160;
export const GRAMMAR_ATLAS_CACHE_COUNT = 156;
export const GRAMMAR_CORE_FAMILY_COUNT = 13;
