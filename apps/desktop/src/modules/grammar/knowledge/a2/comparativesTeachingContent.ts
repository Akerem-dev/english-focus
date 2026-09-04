import type { GrammarTeachingContent } from "../grammarTeachingContent";

export const COMPARATIVES_TEACHING_CONTENT: GrammarTeachingContent = {
  id: "comparatives",
  intro:
    "Use comparative forms to compare two people, things, places, amounts, or situations. Short adjectives often take -er; longer adjectives usually use more. Irregular adjectives must be learned separately.",
  sectionTitles: {
    comparison: "Comparative vs Superlative",
    signals: "Comparison Boosters"
  },
  formula:
    "short adjective + -er + than · more + long adjective + than · irregular: better / worse / farther-further",
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
      explanation:
        "The sentence compares two routes, so use a comparative; much strengthens the difference."
    }
  ]),
  quickRules: Object.freeze([
    "Two things: comparative. Short adjective → often -er; long adjective → often more + adjective.",
    "Never double-mark: not more cheaper, more better, or beautifuller.",
    "Use than for the second side; use much/far/a little/slightly to change the degree of difference."
  ]),
  memoryHook: "Two sides = comparative. Choose ONE comparative marker: -er OR more, not both."
};
