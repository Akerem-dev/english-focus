import { useState } from "react";

interface PracticeQuestion {
  readonly context: string;
  readonly prompt: string;
  readonly hint: string;
  readonly options: readonly string[];
  readonly correctIndex: number;
  readonly explanation: string;
}

const PRACTICE_QUESTIONS: readonly PracticeQuestion[] = Object.freeze([
  {
    context: "RESULT NOW · ŞİMDİKİ SONUÇ",
    prompt: "I ______ my keys. Can you help me look for them?",
    hint: "Anahtarlar şu anda hâlâ kayıp. Geçmişteki olayın sonucu bugün devam ediyor.",
    options: ["lost", "have lost", "had lost", "am losing"],
    correctIndex: 1,
    explanation: "Doğru cevap “have lost”. Anahtarları kaybetme olayı geçmişte oldu ama asıl önemli bilgi şu an anahtarların bulunamaması. Bitmiş bir geçmiş zaman da söylemiyoruz; bu yüzden Present Perfect doğal seçimdir."
  },
  {
    context: "DURATION · GEÇMİŞTEN BUGÜNE",
    prompt: "She ______ in Ankara since 2021.",
    hint: "2021 başlangıç noktası. Cümle, durumun hâlâ devam ettiğini anlatıyor.",
    options: ["lived", "has lived", "is living", "was living"],
    correctIndex: 1,
    explanation: "“Since 2021” bize başlangıç noktasını verir ve yaşama durumu hâlâ devam ediyor. Bu nedenle “has lived” kullanılır. “Lived” deseydik bağlama göre artık Ankara’da yaşamıyor olduğu anlaşılabilirdi."
  },
  {
    context: "LIFE EXPERIENCE · HAYAT DENEYİMİ",
    prompt: "______ you ever ______ sushi?",
    hint: "Belirli bir yıl veya tarih sormuyoruz; bugüne kadarki deneyimi soruyoruz.",
    options: ["Did / try", "Have / tried", "Have / try", "Did / tried"],
    correctIndex: 1,
    explanation: "Doğru yapı “Have you ever tried…?” olur. “Ever” burada kişinin bugüne kadarki hayat deneyimini soruyor. Present Perfect’te yardımcı fiil have/has gelir ve ana fiil V3 biçimine geçer: try → tried."
  },
  {
    context: "UNFINISHED TIME · BİTMEMİŞ ZAMAN",
    prompt: "I ______ three meetings today.",
    hint: "Konuşma anında bugün henüz bitmemiş kabul ediliyor.",
    options: ["had", "have had", "have", "had had"],
    correctIndex: 1,
    explanation: "Doğru cevap “have had”. “Today” henüz bitmemiş bir zaman dilimiyse günün şu ana kadarki bölümünü özetliyoruz. Bu yüzden Present Perfect kullanabiliriz. Gün tamamen bittikten sonra geçmiş bir günü anlatırken Past Simple daha doğal olabilir."
  },
  {
    context: "FINISHED PAST · BİTMİŞ GEÇMİŞ",
    prompt: "We ______ him yesterday.",
    hint: "“Yesterday” tamamen bitmiş bir geçmiş zamanı gösteriyor.",
    options: ["have seen", "saw", "have saw", "seen"],
    correctIndex: 1,
    explanation: "Doğru cevap “saw”. “Yesterday” bitmiş ve belirli bir geçmiş zaman olduğu için burada Present Perfect kullanmayız. Past Simple seçilir: see → saw."
  }
]);

const FIRST_PRACTICE_QUESTION = PRACTICE_QUESTIONS[0];
if (FIRST_PRACTICE_QUESTION === undefined) {
  throw new Error("Present Perfect practice requires at least one question.");
}

export function PresentPerfectPractice() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const question = PRACTICE_QUESTIONS[questionIndex] ?? FIRST_PRACTICE_QUESTION;
  const answered = selectedIndex !== null;
  const answerIsCorrect = answered && selectedIndex === question.correctIndex;
  const progress = ((questionIndex + (answered ? 1 : 0)) / PRACTICE_QUESTIONS.length) * 100;

  function chooseAnswer(index: number) {
    if (answered) return;
    setSelectedIndex(index);
    if (index === question.correctIndex) {
      setScore((current) => current + 1);
    }
  }

  function nextQuestion() {
    if (!answered) return;
    if (questionIndex === PRACTICE_QUESTIONS.length - 1) {
      setCompleted(true);
      return;
    }
    setQuestionIndex((current) => current + 1);
    setSelectedIndex(null);
  }

  function restart() {
    setQuestionIndex(0);
    setSelectedIndex(null);
    setScore(0);
    setCompleted(false);
  }

  if (completed) {
    const message = score === 5
      ? "Mükemmel. Present Perfect ile Past Simple arasındaki temel ayrımı doğru kuruyorsun."
      : score >= 3
        ? "Temel mantık oturmuş. Yanlış yaptığın sorularda önce zamanın bitip bitmediğine ve bugünle bağlantıya tekrar bak."
        : "Rule ve Compare bölümlerini bir kez daha okuyup yeniden denemen iyi olur. Formülden önce anlamı seçmeye odaklan.";

    return (
      <section className="wvg-practice-view" aria-labelledby="present-perfect-practice-title">
        <div className="wvg-practice-complete">
          <p>PRACTICE COMPLETE · ALIŞTIRMA TAMAMLANDI</p>
          <h2 id="present-perfect-practice-title">Sonucun</h2>
          <div className="wvg-practice-complete__score">{score}<span> / 5</span></div>
          <span>{message}</span>
          <button className="wvg-practice-restart" onClick={restart} type="button">Try again</button>
        </div>
      </section>
    );
  }

  return (
    <section className="wvg-practice-view" aria-labelledby="present-perfect-practice-title">
      <header className="wvg-practice-header">
        <div className="wvg-practice-header__copy">
          <p>PRACTICE · ALIŞTIRMA</p>
          <h2 id="present-perfect-practice-title">Önce anlamı seç, sonra zamanı.</h2>
          <span>Her soruda formüle atlamadan önce “bitmiş geçmiş mi, bugünle bağlantı mı?” diye düşün. Cevabı seçince neden doğru veya yanlış olduğunu hemen göreceksin.</span>
        </div>
        <div className="wvg-practice-progress" aria-label={`Question ${questionIndex + 1} of ${PRACTICE_QUESTIONS.length}`}>
          <strong>{questionIndex + 1} / {PRACTICE_QUESTIONS.length}</strong>
          <span>{score} correct so far</span>
          <div className="wvg-practice-progress__track" aria-hidden="true"><i style={{ width: `${progress}%` }} /></div>
        </div>
      </header>

      <div className="wvg-practice-question">
        <p className="wvg-practice-question__context">{question.context}</p>
        <h3>{question.prompt}</h3>
        <p className="wvg-practice-question__hint">İpucu: {question.hint}</p>
      </div>

      <div className="wvg-practice-options" role="group" aria-label="Answer choices">
        {question.options.map((option, index) => {
          let state = "idle";
          if (answered && index === question.correctIndex) state = "correct";
          else if (answered && index === selectedIndex) state = "wrong";
          else if (!answered && index === selectedIndex) state = "selected";

          return (
            <button
              aria-pressed={selectedIndex === index}
              className="wvg-practice-option"
              data-state={state}
              disabled={answered}
              key={option}
              onClick={() => chooseAnswer(index)}
              type="button"
            >
              <span className="wvg-practice-option__letter">{String.fromCharCode(65 + index)}</span>
              <span className="wvg-practice-option__text">{option}</span>
              <span aria-hidden="true" className="wvg-practice-option__mark">
                {answered && index === question.correctIndex ? "✓" : answered && index === selectedIndex ? "×" : ""}
              </span>
            </button>
          );
        })}
      </div>

      {answered ? (
        <div aria-live="polite" className="wvg-practice-feedback" data-correct={answerIsCorrect ? "true" : "false"}>
          <div>
            <span>{answerIsCorrect ? "DOĞRU" : "BİR DAHA DÜŞÜN"}</span>
            <strong>{answerIsCorrect ? "Mantığı doğru kurdun." : `Doğru cevap: ${question.options[question.correctIndex]}`}</strong>
            <p>{question.explanation}</p>
          </div>
          <button className="wvg-practice-next" onClick={nextQuestion} type="button">
            {questionIndex === PRACTICE_QUESTIONS.length - 1 ? "See result" : "Next question"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
