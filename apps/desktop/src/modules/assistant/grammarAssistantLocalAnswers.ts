import {
  getGrammarTeachingContent,
  type GrammarTeachingContent
} from "../grammar/knowledge/grammarTeachingContent";
import { getA2GrammarTeachingContent } from "../grammar/knowledge/grammarTeachingContentA2";

export interface GrammarAssistantLocalAnswer {
  readonly answerText: string;
  readonly message: string;
}

const HOME_DEFAULT_LESSON_ID = "present-perfect";
const HOME_DEFAULT_LESSON_TITLE = "Present Perfect";


const TURKISH_LOGIC_BY_LESSON: Readonly<Record<string, string>> = Object.freeze({
  "present-simple":
    "Rutinleri, alışkanlıkları ve genel doğruları anlatır. He/she/it ile olumlu cümlede fiile genellikle -s/-es gelir.",
  "be-am-is-are":
    "Özneye göre am, is veya are seçilir. Be fiili soru ve olumsuzda do/does istemez; yardımcı fiil gibi kendisi öne geçer veya not alır.",
  "there-is-there-are":
    "Bir şeyin var olduğunu söylerken tekil isimlerle there is, çoğul isimlerle there are kullanılır.",
  "present-continuous":
    "Şu anda süren veya geçici durumları anlatır. Özneye uygun am/is/are + V-ing kalıbını kullan.",
  "can-could":
    "Can ve could modal fiillerdir; ardından yalın fiil gelir. Can daha doğrudan, could ise geçmiş yetenek veya daha nazik/olasılıklı anlam verebilir.",
  "wh-questions":
    "Bilgi sorularında soru kelimesinden sonra uygun yardımcı fiil ve özne gelir; ana fiil çoğu yapıda yalın kalır.",
  "past-simple":
    "Geçmişte başlayıp bitmiş olayları anlatır. Olumlu cümlede V2/-ed, did kullanılan soru ve olumsuzlarda yalın fiil kullanılır.",
  "used-to":
    "Geçmişte düzenli olan ama artık geçerli olmayan alışkanlık ve durumları anlatır: used to + yalın fiil.",
  "present-perfect":
    "Geçmişte olan bir şeyi şimdiyle bağlantısı üzerinden anlatır: have/has + V3. yesterday, last year gibi bitmiş bir zaman açıkça verilirse genellikle Past Simple seçilir.",
  "past-continuous":
    "Geçmişte belirli bir anda devam etmekte olan eylemi anlatır: was/were + V-ing.",
  "going-to":
    "Önceden oluşmuş plan ve niyetlerde veya eldeki kanıta dayanan tahminde am/is/are going to + yalın fiil kullanılır.",
  comparatives:
    "İki kişi veya şeyi karşılaştırır. Kısa sıfatlarda çoğunlukla -er, uzun sıfatlarda more kullanılır ve karşılaştırılan taraf than ile gelir.",
  "future-continuous":
    "Gelecekte belirli bir anda devam ediyor olacak eylemi anlatır: will be + V-ing.",
  "present-perfect-continuous":
    "Geçmişte başlayıp şimdiye kadar süren eylemde süreyi veya devamlılığı vurgular: have/has been + V-ing.",
  "modal-perfects":
    "Geçmiş hakkında çıkarım, pişmanlık veya eleştiri anlatırken modal + have + V3 kalıbı kullanılır.",
  "relative-clauses":
    "Bir isim hakkında ek bilgi vermek için who, which, that gibi bağlayıcılarla iki fikri tek cümlede birleştirir.",
  "passive-voice":
    "Yapan kişiden çok eylemden etkilenen kişi/şey önemliyse passive kullanılır: uygun zamanda be + V3.",
  "reported-speech":
    "Birinin sözlerini doğrudan alıntılamadan aktarır. Zamir, zaman ve zaman ifadeleri anlatım bağlamına göre değişebilir."
});

function prefersTurkish(prompt: string): boolean {
  const normalized = prompt.toLocaleLowerCase("tr-TR");
  return (
    /[çğıöşü]/u.test(normalized) ||
    /\b(türkçe|kural|açıkla|karşılaştır|örnek|cümle|neden|yanlış|hata|soru|quiz|mantık|fark)\b/u.test(
      normalized
    )
  );
}

function turkishLogic(lessonId: string, content: GrammarTeachingContent): string {
  return (
    TURKISH_LOGIC_BY_LESSON[lessonId] ??
    `Ana karar cümlenin anlamına göre verilir; temel kalıp: ${content.formula}.`
  );
}

function teachingContentForLesson(lessonId: string): GrammarTeachingContent | undefined {
  return getGrammarTeachingContent(lessonId) ?? getA2GrammarTeachingContent(lessonId);
}

function examplesAnswer(
  content: GrammarTeachingContent,
  lessonId: string,
  turkish: boolean
): string {
  if (turkish) {
    const examples = content.examples.slice(0, 3).map((example, index) => {
      const translation =
        example.translationTr === undefined ? "" : `\nTürkçesi: ${example.translationTr}`;
      return `${index + 1}. ${example.sentence}${translation}`;
    });

    return [
      "İşte dersteki üç doğal örnek:",
      ...examples,
      `Kısa mantık: ${turkishLogic(lessonId, content)}`
    ].join("\n\n");
  }

  const examples = content.examples.slice(0, 3).map((example, index) => {
    const translation = example.translationTr === undefined ? "" : `\nTR: ${example.translationTr}`;
    return `${index + 1}. ${example.sentence}${translation}\nWhy: ${example.note}`;
  });

  return [
    "Here are three lesson-grounded examples:",
    ...examples,
    `Memory hook: ${content.memoryHook}`
  ].join("\n\n");
}

function comparisonAnswer(
  content: GrammarTeachingContent,
  lessonId: string,
  turkish: boolean
): string {
  const { comparison } = content;

  if (turkish) {
    const leftTranslation =
      comparison.left.translationTr === undefined ? "" : `\nTürkçesi: ${comparison.left.translationTr}`;
    const rightTranslation =
      comparison.right.translationTr === undefined
        ? ""
        : `\nTürkçesi: ${comparison.right.translationTr}`;

    return [
      `Karşılaştırma: ${comparison.title}`,
      `${comparison.left.label}\nÖrnek: ${comparison.left.example}${leftTranslation}`,
      `${comparison.right.label}\nÖrnek: ${comparison.right.example}${rightTranslation}`,
      `Karar kuralı: ${turkishLogic(lessonId, content)}`
    ].join("\n\n");
  }

  return [
    comparison.title,
    `${comparison.left.label}: ${comparison.left.rule}`,
    `Example: ${comparison.left.example}`,
    `${comparison.right.label}: ${comparison.right.rule}`,
    `Example: ${comparison.right.example}`,
    `Decision rule: ${comparison.takeaway}`
  ].join("\n\n");
}

function mistakeAnswer(
  content: GrammarTeachingContent,
  lessonId: string,
  turkish: boolean
): string {
  const mistake = content.mistakes[0];
  if (mistake === undefined) {
    return turkish ? turkishLogic(lessonId, content) : content.formulaExplanation;
  }

  if (turkish) {
    return [
      `YANLIŞ: ${mistake.wrong}`,
      `DOĞRU: ${mistake.right}`,
      `Neden? Bu seçim dersin temel anlam ve kalıp kuralıyla uyuşmuyor.`,
      `Hatırla: ${turkishLogic(lessonId, content)}`
    ].join("\n\n");
  }

  return [
    `WRONG: ${mistake.wrong}`,
    `CORRECT: ${mistake.right}`,
    `WHY: ${mistake.why}`,
    `Remember: ${content.memoryHook}`
  ].join("\n\n");
}

function quizAnswer(content: GrammarTeachingContent, lessonId: string, turkish: boolean): string {
  const check = content.practiceChecks[0];
  if (check === undefined) {
    return turkish
      ? `Hızlı kural: ${turkishLogic(lessonId, content)}`
      : `Quick rule: ${content.quickRules[0] ?? content.memoryHook}`;
  }

  if (turkish) {
    return [
      "Hızlı quiz — cevaba bakmadan önce kendin karar ver:",
      check.prompt,
      "Cevabını aşağıdaki kutuya yaz; seçim mantığını birlikte kontrol edebiliriz.",
      `İpucu: ${turkishLogic(lessonId, content)}`
    ].join("\n\n");
  }

  return [
    "Quick quiz — answer before checking the lesson:",
    check.prompt,
    "Type your answer in the box and I can help you reason through it.",
    `Hint: ${content.memoryHook}`
  ].join("\n\n");
}

function templateAnswer(
  content: GrammarTeachingContent,
  lessonId: string,
  turkish: boolean
): string {
  if (turkish) {
    const uses = content.uses
      .slice(0, 3)
      .map((use) => `• ${use.title}: ${use.example}${use.translationTr === undefined ? "" : ` — ${use.translationTr}`}`)
      .join("\n");
    const examples = content.examples
      .slice(0, 3)
      .map((example) => `• ${example.sentence}${example.translationTr === undefined ? "" : ` — ${example.translationTr}`}`)
      .join("\n");
    const mistakes = content.mistakes
      .slice(0, 3)
      .map((mistake) => `• ${mistake.wrong} → ${mistake.right}`)
      .join("\n");

    return [
      `1) Anlam\n${turkishLogic(lessonId, content)}`,
      `2) Temel formül\n${content.formula}`,
      `3) Ne zaman kullanılır?\n${uses}`,
      `4) Örnekler\n${examples}`,
      `5) Karşılaştırma\n${content.comparison.left.label} ↔ ${content.comparison.right.label}\nKarar verirken önce anlam ve zaman bağlamına bak.`,
      `6) Sık hatalar\n${mistakes}`,
      `7) İpuçları\n${content.signals.slice(0, 8).join(", ")}\nSignal word tek başına tense seçmez; cümlenin anlamını kontrol et.`,
      `8) Hızlı kural\n${turkishLogic(lessonId, content)}`
    ].join("\n\n");
  }

  const uses = content.uses
    .slice(0, 3)
    .map((use) => `• ${use.title}: ${use.explanation}`)
    .join("\n");
  const examples = content.examples
    .slice(0, 3)
    .map((example) => `• ${example.sentence} — ${example.note}`)
    .join("\n");
  const mistakes = content.mistakes
    .slice(0, 3)
    .map((mistake) => `• ${mistake.wrong} → ${mistake.right} — ${mistake.why}`)
    .join("\n");

  return [
    `1) Meaning first\n${content.intro}`,
    `2) Core formula\n${content.formula}\n${content.formulaExplanation}`,
    `3) When to use\n${uses}`,
    `4) Examples\n${examples}`,
    `5) Compare & contrast\n${content.comparison.left.label}: ${content.comparison.left.rule}\n${content.comparison.right.label}: ${content.comparison.right.rule}\nDecision: ${content.comparison.takeaway}`,
    `6) Common mistakes\n${mistakes}`,
    `7) Clues\n${content.signals.slice(0, 8).join(", ")}\n${content.signalsNote}`,
    `8) Quick rule\n${content.quickRules.map((rule) => `• ${rule}`).join("\n")}\nMemory hook: ${content.memoryHook}`
  ].join("\n\n");
}

function explainAnswer(
  content: GrammarTeachingContent,
  lessonId: string,
  turkish: boolean
): string {
  if (turkish) {
    return [
      `Kısa mantık: ${turkishLogic(lessonId, content)}`,
      `Formül: ${content.formula}`,
      "Ezberlemek yerine önce cümlenin vermek istediği anlamı ve zaman bağlamını belirle."
    ].join("\n\n");
  }

  return [
    content.intro,
    `Formula: ${content.formula}`,
    `Why it works: ${content.formulaExplanation}`,
    `Memory hook: ${content.memoryHook}`
  ].join("\n\n");
}

export function buildGrammarAssistantLocalAnswer(
  prompt: string,
  lessonId: string | undefined,
  lessonTitle: string | undefined
): GrammarAssistantLocalAnswer | undefined {
  const targetLessonId = lessonId ?? HOME_DEFAULT_LESSON_ID;
  const targetLessonTitle = lessonTitle ?? HOME_DEFAULT_LESSON_TITLE;
  const content = teachingContentForLesson(targetLessonId);
  if (content === undefined) return undefined;

  const normalized = prompt.toLocaleLowerCase("tr-TR");
  const turkish = prefersTurkish(prompt);
  let answerText: string | undefined;

  if (/şablon|template|8 bölüm|lesson note/u.test(normalized)) {
    answerText = templateAnswer(content, targetLessonId, turkish);
  } else if (/karşılaştır|compare|fark|difference/u.test(normalized)) {
    answerText = comparisonAnswer(content, targetLessonId, turkish);
  } else if (/örnek|example|cümle|sentence/u.test(normalized)) {
    answerText = examplesAnswer(content, targetLessonId, turkish);
  } else if (/quiz|test|soru sor/u.test(normalized)) {
    answerText = quizAnswer(content, targetLessonId, turkish);
  } else if (/yanlış|wrong|hata|mistake|error/u.test(normalized)) {
    answerText = mistakeAnswer(content, targetLessonId, turkish);
  } else if (/açıkla|explain|kural|rule|formula|mantık/u.test(normalized)) {
    answerText = explainAnswer(content, targetLessonId, turkish);
  }

  if (answerText === undefined) return undefined;

  return Object.freeze({
    answerText,
    message: turkish
      ? lessonId === undefined
        ? `Grammar Home örneği — ${targetLessonTitle}. Konuya özel cevap için bir ders seçebilirsin.`
        : `${targetLessonTitle} dersi üzerinden cevaplıyorum.`
      : lessonId === undefined
        ? `Grammar Home example — ${targetLessonTitle}. Pick a lesson to make Wordie topic-specific.`
        : `Here’s a lesson-grounded answer for ${targetLessonTitle}.`
  });
}
