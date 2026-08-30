import type { GrammarTeachingContent } from "../grammarTeachingContent";

export const PASSIVE_VOICE_TEACHING_CONTENT: GrammarTeachingContent = {
  id: "passive-voice",
  intro:
    "Use the passive voice when the action, result, or receiver is more important than the person who performs the action, or when the agent is unknown, obvious, or deliberately not mentioned. Build the passive with the correct form of be + past participle.",
  sectionTitles: {
    comparison: "Active vs Passive Voice",
    signals: "Passive-Voice Clues"
  },
  formula: "subject + be (in the required tense) + past participle (V3)",
  formulaExplanation:
    "Keep the original tense on the verb be, then add the past participle of the main verb. The object of an active sentence becomes the subject of the passive sentence. Add by + agent only when the agent is useful information.",
  formulaParts: Object.freeze([
    {
      label: "RECEIVER",
      value: "the bridge / the report / the window",
      note: "The passive subject receives or experiences the action."
    },
    {
      label: "BE",
      value: "is / was / has been / will be",
      note: "Change be to carry the tense you need."
    },
    {
      label: "PAST PARTICIPLE",
      value: "built / written / broken / completed",
      note: "Use V3 for the main action."
    }
  ]),
  table: {
    headers: Object.freeze(["Tense", "Active", "Passive"]),
    rows: Object.freeze([
      Object.freeze(["Present Simple", "They clean the room.", "The room is cleaned."]),
      Object.freeze(["Past Simple", "They built the bridge.", "The bridge was built."]),
      Object.freeze(["Present Perfect", "They have finished it.", "It has been finished."]),
      Object.freeze(["Future", "They will announce it.", "It will be announced."])
    ])
  },
  uses: Object.freeze([
    {
      title: "Unknown agent",
      explanation: "Use the passive when you do not know who performed the action.",
      example: "My bike was stolen last night.",
      translationTr: "Bisikletim dün gece çalındı."
    },
    {
      title: "Agent is obvious or unimportant",
      explanation: "Leave out the agent when the result matters more than who caused it.",
      example: "The road was closed for two hours.",
      translationTr: "Yol iki saat boyunca kapatıldı."
    },
    {
      title: "Formal, scientific, or process-focused writing",
      explanation: "Use the passive to keep attention on a procedure, product, or result.",
      example: "The samples are stored at low temperature.",
      translationTr: "Numuneler düşük sıcaklıkta saklanır."
    },
    {
      title: "Mention an important agent with by",
      explanation:
        "Add by + agent when the identity of the performer is informative or surprising.",
      example: "The novel was written by George Orwell.",
      translationTr: "Roman George Orwell tarafından yazıldı."
    }
  ]),
  examples: Object.freeze([
    {
      label: "Present Simple",
      sentence: "English is spoken in many countries.",
      translationTr: "İngilizce birçok ülkede konuşulur.",
      note: "Is carries Present Simple; spoken is the past participle."
    },
    {
      label: "Past Simple",
      sentence: "The package was delivered yesterday.",
      translationTr: "Paket dün teslim edildi.",
      note: "Was carries Past Simple; delivered stays in V3."
    },
    {
      label: "Present Perfect",
      sentence: "The problem has been solved.",
      translationTr: "Sorun çözüldü.",
      note: "Present Perfect passive uses has/have been + V3."
    },
    {
      label: "Future",
      sentence: "The results will be published tomorrow.",
      translationTr: "Sonuçlar yarın yayımlanacak.",
      note: "Future passive uses will be + V3."
    },
    {
      label: "Agent included",
      sentence: "The final design was approved by the client.",
      translationTr: "Nihai tasarım müşteri tarafından onaylandı.",
      note: "By + agent is included because the approver matters."
    }
  ]),
  comparison: {
    title: "Do you want the sentence to focus on the doer or on the receiver/result?",
    left: {
      label: "ACTIVE",
      rule: "Put the doer first when who performs the action is central.",
      example: "The company launched the product in May.",
      translationTr: "Şirket ürünü mayısta piyasaya sürdü."
    },
    right: {
      label: "PASSIVE",
      rule: "Put the receiver/result first when the action or outcome is central.",
      example: "The product was launched in May.",
      translationTr: "Ürün mayısta piyasaya sürüldü."
    },
    takeaway:
      "Passive voice is a focus choice, not simply a different word order. Keep the tense, change the viewpoint."
  },
  mistakes: Object.freeze([
    {
      wrong: "The bridge built in 2010.",
      right: "The bridge was built in 2010.",
      why: "A finite passive clause needs the correct form of be before the past participle."
    },
    {
      wrong: "The emails were send yesterday.",
      right: "The emails were sent yesterday.",
      why: "Passive voice requires the past participle V3: send → sent."
    },
    {
      wrong: "The report has been wrote.",
      right: "The report has been written.",
      why: "Use the correct V3 form: write → wrote → written."
    },
    {
      wrong: "The meeting was happened at noon.",
      right: "The meeting happened at noon.",
      why: "Intransitive verbs such as happen do not normally form a passive because there is no object to become the passive subject."
    }
  ]),
  signalsLabel: "Contexts where the receiver, process, or result often matters more than the agent",
  signals: Object.freeze([
    "is made",
    "was built",
    "has been completed",
    "will be announced",
    "by",
    "according to the procedure",
    "the results",
    "the product",
    "the building",
    "the report"
  ]),
  signalsNote:
    "Do not choose passive voice from a keyword alone. Ask what the sentence should foreground and whether the original active verb has an object that can become the passive subject.",
  practiceChecks: Object.freeze([
    {
      prompt: "Change to passive: They built this school in 1998.",
      answer: "This school was built in 1998.",
      explanation: "The active object becomes the passive subject; Past Simple becomes was + V3."
    },
    {
      prompt: "Complete: The invitations ___ already ___ (send).",
      answer: "have already been sent",
      explanation: "Present Perfect passive uses have/has been + past participle."
    },
    {
      prompt: "Correct: The accident was happened yesterday.",
      answer: "The accident happened yesterday.",
      explanation: "Happen is intransitive, so it does not normally take a passive form."
    }
  ]),
  quickRules: Object.freeze([
    "Passive = the correct tense of be + past participle.",
    "Use it when the receiver, action, process, or result deserves the focus.",
    "Keep by + agent only when the performer adds useful information."
  ]),
  memoryHook:
    "Keep the tense on BE, put the action in V3, and move the camera from the doer to the receiver."
};
