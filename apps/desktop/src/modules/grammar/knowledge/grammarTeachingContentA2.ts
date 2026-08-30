import type { GrammarTeachingContent } from "./grammarTeachingContent";

export const A2_GRAMMAR_TEACHING_CONTENT: readonly GrammarTeachingContent[] = Object.freeze([
  {
    id: "past-simple",
    intro:
      "Use the Past Simple for actions, events, and states that are finished in a completed past time. The key idea is a closed past situation: the event is over and the time is treated as finished.",
    sectionTitles: {
      comparison: "Past Simple vs Present Perfect",
      signals: "Finished-Time Clues"
    },
    formula: "Positive: Subject + past form (V2) · Negative: did not + base verb · Question: Did + subject + base verb?",
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
        explanation: "Use the Past Simple when repeated behaviour belongs to a past period that is now over.",
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
        explanation: "Last month is a finished past time, and buy has the irregular past form bought."
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
    memoryHook: "Closed past time = Past Simple. Did carries the past, so the main verb stays simple."
  },
  {
    id: "used-to",
    intro:
      "Use used to + base verb for past habits or states that were true before but are not true now, or are understood as different now. It is a compact way to contrast 'then' with 'now'.",
    sectionTitles: {
      comparison: "Used to vs Past Simple",
      signals: "Then-vs-Now Clues"
    },
    formula: "Positive: Subject + used to + base verb · Negative: didn't use to + base verb · Question: Did + subject + use to + base verb?",
    formulaExplanation:
      "In positive statements, used to is fixed and is followed by the base verb. In negatives and questions, did carries past tense, so the spelling becomes use to after did/didn't.",
    formulaParts: Object.freeze([
      {
        label: "PAST PATTERN",
        value: "used to + base verb",
        note: "Use for a repeated past behaviour or a past state."
      },
      {
        label: "NEGATIVE",
        value: "didn't use to + base verb",
        note: "After didn't, write use to — did already carries the past."
      },
      {
        label: "QUESTION",
        value: "Did ... use to + base verb?",
        note: "Put did before the subject, then use to + base verb."
      }
    ]),
    table: {
      headers: Object.freeze(["Meaning", "Form", "Example"]),
      rows: Object.freeze([
        Object.freeze(["Past habit", "used to + verb", "I used to cycle to school."]),
        Object.freeze(["Past state", "used to + verb", "She used to be shy."]),
        Object.freeze(["Negative", "didn't use to + verb", "We didn't use to cook."]),
        Object.freeze(["Question", "Did ... use to + verb?", "Did you use to live here?"])
      ])
    },
    uses: Object.freeze([
      {
        title: "Past habits",
        explanation: "Describe something you regularly did in the past but do not normally do now.",
        example: "I used to play football after school.",
        translationTr: "Eskiden okuldan sonra futbol oynardım."
      },
      {
        title: "Past states",
        explanation: "Talk about a past condition, possession, belief, or situation that has changed.",
        example: "There used to be a cinema here.",
        translationTr: "Eskiden burada bir sinema vardı."
      },
      {
        title: "Long-term past situations",
        explanation: "Summarise how life was before a change.",
        example: "We used to live near the sea.",
        translationTr: "Eskiden denize yakın yaşardık."
      },
      {
        title: "Clear contrast with now",
        explanation: "Used to naturally suggests that the present situation is different.",
        example: "He used to hate coffee, but now he drinks it every morning.",
        translationTr: "Eskiden kahveden nefret ederdi ama şimdi her sabah içiyor."
      }
    ]),
    examples: Object.freeze([
      {
        label: "Habit",
        sentence: "I used to take the bus to work.",
        translationTr: "Eskiden işe otobüsle giderdim.",
        note: "A repeated past routine that is understood as different now."
      },
      {
        label: "State",
        sentence: "Mina used to have long hair.",
        translationTr: "Mina'nın eskiden uzun saçları vardı.",
        note: "Used to works with states such as have, know, like, and be."
      },
      {
        label: "Negative",
        sentence: "I didn't use to like spicy food.",
        translationTr: "Eskiden acı yemeği sevmezdim.",
        note: "After didn't, write use to, not used to."
      },
      {
        label: "Question",
        sentence: "Did you use to study at night?",
        translationTr: "Eskiden geceleri ders çalışır mıydın?",
        note: "Did + subject + use to + base verb."
      },
      {
        label: "Then and now",
        sentence: "She used to be quiet, but now she's very confident.",
        translationTr: "Eskiden sessizdi ama şimdi çok özgüvenli.",
        note: "The contrast makes the changed situation explicit."
      }
    ]),
    comparison: {
      title: "Are you describing a past pattern, or just reporting one finished event?",
      left: {
        label: "USED TO",
        rule: "Past habit/state with an implied contrast to now.",
        example: "I used to walk to school.",
        translationTr: "Eskiden okula yürürdüm."
      },
      right: {
        label: "PAST SIMPLE",
        rule: "A finished event, or repeated past action when no 'different now' contrast is needed.",
        example: "I walked to school yesterday.",
        translationTr: "Dün okula yürüdüm."
      },
      takeaway:
        "Use used to when the old pattern itself matters and the listener should understand that things are different now."
    },
    mistakes: Object.freeze([
      {
        wrong: "I use to live there.",
        right: "I used to live there.",
        why: "Positive statements use used to + base verb."
      },
      {
        wrong: "I didn't used to cook.",
        right: "I didn't use to cook.",
        why: "Did already marks the past, so use to follows it."
      },
      {
        wrong: "Did she used to work here?",
        right: "Did she use to work here?",
        why: "After did, use the base form use."
      },
      {
        wrong: "I am used to live alone.",
        right: "I used to live alone.",
        why: "Used to + verb means a past habit/state. Be used to has a different meaning: being accustomed to something."
      }
    ]),
    signalsLabel: "Language that often creates a past-vs-present contrast",
    signals: Object.freeze([
      "when I was younger",
      "years ago",
      "back then",
      "in the past",
      "before",
      "but now",
      "these days",
      "no longer",
      "not anymore",
      "as a child"
    ]),
    signalsNote:
      "Used to is chosen because a former habit or state is contrasted with the present. These phrases often make that contrast visible.",
    practiceChecks: Object.freeze([
      {
        prompt: "Complete: We ___ live in a small apartment, but now we have a house.",
        answer: "used to",
        explanation: "The sentence contrasts an old long-term situation with the present."
      },
      {
        prompt: "Correct: She didn't used to eat breakfast.",
        answer: "She didn't use to eat breakfast.",
        explanation: "After didn't, use to is the correct form."
      },
      {
        prompt: "Choose: Did you use to / used to play here?",
        answer: "Did you use to play here?",
        explanation: "Did carries the past marker; use stays in its base form."
      }
    ]),
    quickRules: Object.freeze([
      "Positive: used to + base verb for a past habit or state that is different now.",
      "After did/didn't, write use to + base verb.",
      "Do not confuse used to do with be used to doing; they express different meanings."
    ]),
    memoryHook: "Used to draws a bridge between THEN and NOW — and shows that the situation changed."
  },
  {
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
        Object.freeze(["I / you / we / they", "We have finished.", "We haven't finished.", "Have you finished?"]),
        Object.freeze(["he / she / it", "She has finished.", "She hasn't finished.", "Has she finished?"])
      ])
    },
    uses: Object.freeze([
      {
        title: "Life experience",
        explanation: "Talk about whether an experience has happened at any time before now without saying a finished time.",
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
        explanation: "Use since for the starting point and for for the duration of a continuing situation.",
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
        explanation: "She takes has, already comes naturally before the participle, and finish → finished."
      },
      {
        prompt: "Choose since or for: We have known each other ___ 2019.",
        answer: "since",
        explanation: "2019 is the starting point. Use since for a starting point and for for a duration."
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
    memoryHook: "Present Perfect looks backward from NOW. If the past is closed and dated, switch to Past Simple."
  },
  {
    id: "past-continuous",
    intro:
      "Use the Past Continuous for an action or situation that was in progress around a particular past time. It often gives the background while the Past Simple tells the shorter event that happened inside that background.",
    sectionTitles: {
      comparison: "Past Continuous vs Past Simple",
      signals: "Background & Interruption Clues"
    },
    formula: "Subject + was / were + verb-ing",
    formulaExplanation:
      "Choose was with I/he/she/it and were with you/we/they. Add -ing to the main verb. Negatives use was not/were not; questions move was/were before the subject.",
    formulaParts: Object.freeze([
      {
        label: "SUBJECT + BE",
        value: "I/he/she/it was · you/we/they were",
        note: "Was/were carries the past tense."
      },
      {
        label: "MAIN VERB",
        value: "verb-ing",
        note: "Use working, reading, running, writing, etc."
      },
      {
        label: "QUESTION / NEGATIVE",
        value: "Was she...? / weren't...",
        note: "Move was/were before the subject for questions; add not for negatives."
      }
    ]),
    table: {
      headers: Object.freeze(["Subject", "Positive", "Negative", "Question"]),
      rows: Object.freeze([
        Object.freeze(["I / he / she / it", "She was working.", "She wasn't working.", "Was she working?"]),
        Object.freeze(["you / we / they", "They were working.", "They weren't working.", "Were they working?"])
      ])
    },
    uses: Object.freeze([
      {
        title: "Action in progress at a past time",
        explanation: "Show what was happening around a specific point in the past.",
        example: "At 9 p.m., I was studying.",
        translationTr: "Saat 9'da ders çalışıyordum."
      },
      {
        title: "Background in a story",
        explanation: "Describe the scene or longer activity around the main events.",
        example: "The sun was shining and people were sitting outside.",
        translationTr: "Güneş parlıyordu ve insanlar dışarıda oturuyordu."
      },
      {
        title: "Interrupted action",
        explanation: "Use Past Continuous for the longer action and Past Simple for the shorter event that interrupts it.",
        example: "I was cooking when the phone rang.",
        translationTr: "Telefon çaldığında yemek yapıyordum."
      },
      {
        title: "Two simultaneous actions",
        explanation: "Use it for two longer activities happening at the same time.",
        example: "While I was cooking, Maya was setting the table.",
        translationTr: "Ben yemek yaparken Maya masayı hazırlıyordu."
      }
    ]),
    examples: Object.freeze([
      {
        label: "Past time",
        sentence: "We were driving home at midnight.",
        translationTr: "Gece yarısı eve doğru araba kullanıyorduk.",
        note: "The action was in progress at that past moment."
      },
      {
        label: "Interruption",
        sentence: "She was sleeping when the alarm went off.",
        translationTr: "Alarm çaldığında uyuyordu.",
        note: "Was sleeping is the background action; went off is the shorter completed event."
      },
      {
        label: "While",
        sentence: "While they were talking, I was taking notes.",
        translationTr: "Onlar konuşurken ben not alıyordum.",
        note: "Both actions continued over the same period."
      },
      {
        label: "Negative",
        sentence: "I wasn't listening when he explained it.",
        translationTr: "O açıklarken dinlemiyordum.",
        note: "Use wasn't/weren't + verb-ing for negatives."
      },
      {
        label: "Question",
        sentence: "What were you doing at 8 o'clock?",
        translationTr: "Saat sekizde ne yapıyordun?",
        note: "Move were before the subject; keep the -ing form."
      }
    ]),
    comparison: {
      title: "Background in progress or completed event?",
      left: {
        label: "PAST CONTINUOUS",
        rule: "Longer/background action in progress around a past time.",
        example: "I was walking home...",
        translationTr: "Eve yürüyordum..."
      },
      right: {
        label: "PAST SIMPLE",
        rule: "Completed event that moves the story forward.",
        example: "...when I saw an old friend.",
        translationTr: "...eski bir arkadaşımı gördüğümde."
      },
      takeaway:
        "Use Past Continuous to open the camera on an action already in progress; use Past Simple for the completed event that enters the scene."
    },
    mistakes: Object.freeze([
      {
        wrong: "I was work at 8 p.m.",
        right: "I was working at 8 p.m.",
        why: "Past Continuous requires was/were + verb-ing."
      },
      {
        wrong: "They was waiting outside.",
        right: "They were waiting outside.",
        why: "They takes were, not was."
      },
      {
        wrong: "Did you were sleeping?",
        right: "Were you sleeping?",
        why: "Was/were makes its own questions; do/did is not added."
      },
      {
        wrong: "I was cooking when the phone was ringing.",
        right: "I was cooking when the phone rang.",
        why: "For a short completed interruption, Past Simple is normally the natural choice."
      }
    ]),
    signalsLabel: "Expressions that often frame an action in progress",
    signals: Object.freeze([
      "while",
      "when",
      "at 8 p.m. yesterday",
      "at that moment",
      "all evening",
      "as I was...",
      "when suddenly...",
      "meanwhile",
      "at the time",
      "during the journey"
    ]),
    signalsNote:
      "While often introduces a longer background action and when often introduces the event inside it, but meaning—not the connector alone—decides the tense.",
    practiceChecks: Object.freeze([
      {
        prompt: "Complete: At 10 last night, we ___ (watch) a film.",
        answer: "were watching",
        explanation: "The action was in progress at a specific past time; we takes were."
      },
      {
        prompt: "Complete: I ___ (walk) home when it ___ (start) to rain.",
        answer: "was walking; started",
        explanation: "Walking is the background action; started is the shorter completed event."
      },
      {
        prompt: "Correct: Did she was working at six?",
        answer: "Was she working at six?",
        explanation: "Was/were moves before the subject; did is not used."
      }
    ]),
    quickRules: Object.freeze([
      "Past Continuous = was/were + verb-ing for an action in progress around a past time.",
      "Long background action → Past Continuous; short completed event → often Past Simple.",
      "Questions move was/were before the subject; never add did to was/were."
    ]),
    memoryHook: "Past Continuous is the background video; Past Simple is the event that clicks into the frame."
  },
  {
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
        Object.freeze(["he / she / it", "She's going to call.", "She isn't going to call.", "Is she going to call?"]),
        Object.freeze(["you / we / they", "They're going to call.", "They aren't going to call.", "Are they going to call?"])
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
    memoryHook: "Plan already in your head, or evidence already in front of your eyes? Think GOING TO."
  },
  {
    id: "comparatives",
    intro:
      "Use comparative forms to compare two people, things, places, amounts, or situations. Short adjectives often take -er; longer adjectives usually use more. Irregular adjectives must be learned separately.",
    sectionTitles: {
      comparison: "Comparative vs Superlative",
      signals: "Comparison Boosters"
    },
    formula: "short adjective + -er + than · more + long adjective + than · irregular: better / worse / farther-further",
    formulaExplanation:
      "Choose the comparative pattern from the adjective. One-syllable adjectives usually take -er; many longer adjectives use more. Some spellings change, and a few common adjectives are irregular.",
    formulaParts: Object.freeze([
      {
        label: "SHORT ADJECTIVE",
        value: "tall → taller",
        note: "Usually add -er; many one-syllable adjectives follow this pattern."
      },
      {
        label: "LONG ADJECTIVE",
        value: "interesting → more interesting",
        note: "Use more before many adjectives with two or more syllables."
      },
      {
        label: "COMPARISON TARGET",
        value: "than + noun/pronoun",
        note: "Than introduces the second side of the comparison when it is stated."
      }
    ]),
    table: {
      headers: Object.freeze(["Pattern", "Adjective", "Comparative"]),
      rows: Object.freeze([
        Object.freeze(["Add -er", "small", "smaller"]),
        Object.freeze(["Double final consonant", "big", "bigger"]),
        Object.freeze(["y → i + er", "happy", "happier"]),
        Object.freeze(["Use more", "expensive", "more expensive"]),
        Object.freeze(["Irregular", "good / bad", "better / worse"])
      ])
    },
    uses: Object.freeze([
      {
        title: "Compare two things",
        explanation: "Show that one thing has more or less of a quality than another.",
        example: "This room is quieter than the kitchen.",
        translationTr: "Bu oda mutfaktan daha sessiz."
      },
      {
        title: "Compare choices",
        explanation: "Evaluate alternatives when making a decision.",
        example: "The train is cheaper than the plane.",
        translationTr: "Tren uçaktan daha ucuz."
      },
      {
        title: "Describe change",
        explanation: "Comparatives can show that a situation is changing over time.",
        example: "The weather is getting colder.",
        translationTr: "Hava giderek soğuyor."
      },
      {
        title: "Make the difference stronger or weaker",
        explanation: "Use words such as much, far, a little, or slightly before a comparative.",
        example: "This route is much faster than the old one.",
        translationTr: "Bu rota eskisinden çok daha hızlı."
      }
    ]),
    examples: Object.freeze([
      {
        label: "Short adjective",
        sentence: "My new desk is wider than the old one.",
        translationTr: "Yeni masam eskisinden daha geniş.",
        note: "Wide ends in silent e, so add -r: wider."
      },
      {
        label: "Consonant doubling",
        sentence: "This bag is bigger than mine.",
        translationTr: "Bu çanta benimkinden daha büyük.",
        note: "Big doubles the final consonant: big → bigger."
      },
      {
        label: "Long adjective",
        sentence: "The second explanation is more useful than the first.",
        translationTr: "İkinci açıklama ilkinden daha faydalı.",
        note: "Useful normally takes more rather than -er."
      },
      {
        label: "Irregular",
        sentence: "Today's result is better than yesterday's.",
        translationTr: "Bugünkü sonuç dünkünden daha iyi.",
        note: "Good has the irregular comparative better."
      },
      {
        label: "Degree word",
        sentence: "The blue model is slightly cheaper than the black one.",
        translationTr: "Mavi model siyah olandan biraz daha ucuz.",
        note: "Slightly reduces the size of the difference."
      }
    ]),
    comparison: {
      title: "Are you comparing two sides, or identifying the extreme member of a group?",
      left: {
        label: "COMPARATIVE",
        rule: "Compare two people/things/situations: -er or more + adjective, often with than.",
        example: "This street is quieter than that one.",
        translationTr: "Bu sokak diğerinden daha sessiz."
      },
      right: {
        label: "SUPERLATIVE",
        rule: "Identify the highest/lowest member of a group: the -est or the most + adjective.",
        example: "This is the quietest street in the area.",
        translationTr: "Bu, bölgedeki en sessiz sokak."
      },
      takeaway:
        "Two sides → comparative. One item against the whole group → superlative. Do not mix the forms."
    },
    mistakes: Object.freeze([
      {
        wrong: "This phone is more cheaper.",
        right: "This phone is cheaper.",
        why: "Do not use both more and -er for the same adjective."
      },
      {
        wrong: "Her idea is beautifuller than mine.",
        right: "Her idea is more beautiful than mine.",
        why: "Long adjectives such as beautiful normally use more, not -er."
      },
      {
        wrong: "My car is faster then yours.",
        right: "My car is faster than yours.",
        why: "Than is the comparison word; then is about sequence or time."
      },
      {
        wrong: "This result is more better.",
        right: "This result is better.",
        why: "Better is already the irregular comparative of good."
      }
    ]),
    signalsLabel: "Words that introduce, strengthen, or soften comparisons",
    signals: Object.freeze([
      "than",
      "much",
      "far",
      "a lot",
      "a little",
      "slightly",
      "even",
      "more",
      "less",
      "better / worse"
    ]),
    signalsNote:
      "Than often introduces the second side. Degree words such as much, far, a little, and slightly change the size of the difference but do not replace the comparative form.",
    practiceChecks: Object.freeze([
      {
        prompt: "Complete: This exercise is ___ (easy) than the last one.",
        answer: "easier",
        explanation: "Easy ends in consonant + y, so y changes to i before -er: easier."
      },
      {
        prompt: "Correct: This laptop is more lighter than mine.",
        answer: "This laptop is lighter than mine.",
        explanation: "Light is a short adjective; use lighter, not more lighter."
      },
      {
        prompt: "Choose: This route is much faster / fastest than the other one.",
        answer: "much faster",
        explanation: "The sentence compares two routes, so use a comparative; much strengthens the difference."
      }
    ]),
    quickRules: Object.freeze([
      "Two things: comparative. Short adjective → often -er; long adjective → often more + adjective.",
      "Never double-mark: not more cheaper, more better, or beautifuller.",
      "Use than for the second side; use much/far/a little/slightly to change the degree of difference."
    ]),
    memoryHook: "Two sides = comparative. Choose ONE comparative marker: -er OR more, not both."
  }
]);

const A2_CONTENT_BY_ID = new Map(A2_GRAMMAR_TEACHING_CONTENT.map((content) => [content.id, content]));

export function getA2GrammarTeachingContent(
  lessonId: string
): GrammarTeachingContent | undefined {
  return A2_CONTENT_BY_ID.get(lessonId);
}
