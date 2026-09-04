import { useMemo, useState } from "react";

import type { GrammarTeachingContent } from "../knowledge/grammarTeachingContent";

import "../../../styles/word-valley-grammar-v16-practice.css";

type PracticeMode = "menu" | "guided" | "quiz" | "challenge";

interface GrammarPracticeExperienceProps {
  readonly content: GrammarTeachingContent;
  readonly mastery: number;
  readonly onMasteryChange: (mastery: number) => void;
}

interface ChoiceQuestion {
  readonly id: string;
  readonly prompt: string;
  readonly context?: string;
  readonly choices: readonly string[];
  readonly correctAnswer: string;
  readonly explanation: string;
}

function clampMastery(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(5, Math.round(value)));
}

function uniqueChoices(values: readonly string[]): readonly string[] {
  return Object.freeze(
    values.filter(
      (value, index, source) =>
        value.trim().length > 0 && source.findIndex((candidate) => candidate === value) === index
    )
  );
}

function rotateChoices(values: readonly string[], offset: number): readonly string[] {
  if (values.length <= 1) return values;
  const normalizedOffset = offset % values.length;
  return Object.freeze([...values.slice(normalizedOffset), ...values.slice(0, normalizedOffset)]);
}

function buildQuickQuiz(content: GrammarTeachingContent): readonly ChoiceQuestion[] {
  const mistakes = content.mistakes.slice(0, 3);
  const mistakeQuestions: readonly ChoiceQuestion[] = Object.freeze(
    mistakes.map((mistake, index): ChoiceQuestion => {
      const nextMistake = mistakes[(index + 1) % mistakes.length];
      const choices = rotateChoices(
        uniqueChoices([
          mistake.right,
          mistake.wrong,
          nextMistake?.wrong ?? content.comparison.right.example
        ]),
        index + 1
      );

      return Object.freeze({
        id: `mistake-${index}`,
        prompt: "Which sentence is correct?",
        choices,
        correctAnswer: mistake.right,
        explanation: mistake.why
      });
    })
  );

  const checkpointCount = Math.max(0, 3 - mistakeQuestions.length);
  const checkpointQuestions: readonly ChoiceQuestion[] = Object.freeze(
    content.practiceChecks.slice(0, checkpointCount).map((check, index): ChoiceQuestion => {
      const distractors = content.practiceChecks
        .filter((candidate) => candidate.prompt !== check.prompt)
        .map((candidate) => candidate.answer);
      const choices = rotateChoices(
        uniqueChoices([check.answer, ...distractors, content.comparison.right.example]),
        index + mistakeQuestions.length + 1
      );

      return Object.freeze({
        id: `checkpoint-${index}`,
        prompt: "Which answer correctly completes this checkpoint?",
        context: check.prompt,
        choices,
        correctAnswer: check.answer,
        explanation: check.explanation
      });
    })
  );

  const formulaChoices = rotateChoices(
    uniqueChoices([content.formula, content.comparison.left.rule, content.comparison.right.rule]),
    1
  );
  const comparisonChoices = rotateChoices(
    uniqueChoices([
      content.comparison.left.rule,
      content.comparison.right.rule,
      content.formulaExplanation
    ]),
    2
  );

  const questions: readonly ChoiceQuestion[] = Object.freeze([
    ...mistakeQuestions,
    ...checkpointQuestions,
    Object.freeze({
      id: "formula",
      prompt: "Which formula belongs to this grammar topic?",
      choices: formulaChoices,
      correctAnswer: content.formula,
      explanation: content.formulaExplanation
    }),
    Object.freeze({
      id: "comparison",
      prompt: `Which description best matches ${content.comparison.left.label}?`,
      choices: comparisonChoices,
      correctAnswer: content.comparison.left.rule,
      explanation: content.comparison.takeaway
    })
  ]);

  return Object.freeze(questions.slice(0, 5));
}

function buildChallenge(content: GrammarTeachingContent): readonly ChoiceQuestion[] {
  const mistakes = content.mistakes.slice(0, 3);
  const mistakeQuestions: readonly ChoiceQuestion[] = Object.freeze(
    mistakes.map((mistake, index): ChoiceQuestion => {
      const distractors = mistakes
        .filter((candidate) => candidate.wrong !== mistake.wrong)
        .map((candidate) => candidate.why);
      const choices = rotateChoices(
        uniqueChoices([
          mistake.why,
          ...distractors,
          content.comparison.takeaway,
          content.formulaExplanation
        ]),
        index + 1
      );

      return Object.freeze({
        id: `reason-${index}`,
        prompt: "Why is this sentence wrong?",
        context: mistake.wrong,
        choices,
        correctAnswer: mistake.why,
        explanation: `Correction: ${mistake.right}`
      });
    })
  );

  const fallbackQuestions: readonly ChoiceQuestion[] = Object.freeze([
    Object.freeze({
      id: "reason-comparison",
      prompt: "What is the key decision in this comparison?",
      context: content.comparison.title,
      choices: rotateChoices(
        uniqueChoices([
          content.comparison.takeaway,
          content.comparison.left.rule,
          content.comparison.right.rule
        ]),
        1
      ),
      correctAnswer: content.comparison.takeaway,
      explanation: content.comparison.takeaway
    }),
    Object.freeze({
      id: "reason-formula",
      prompt: "Which explanation best describes how this form works?",
      context: content.formula,
      choices: rotateChoices(
        uniqueChoices([
          content.formulaExplanation,
          content.comparison.left.rule,
          content.comparison.right.rule
        ]),
        2
      ),
      correctAnswer: content.formulaExplanation,
      explanation: content.formulaExplanation
    }),
    Object.freeze({
      id: "reason-summary",
      prompt: "Which reminder best summarizes this grammar topic?",
      choices: rotateChoices(
        uniqueChoices([content.memoryHook, content.signalsNote, content.comparison.takeaway]),
        1
      ),
      correctAnswer: content.memoryHook,
      explanation: content.memoryHook
    })
  ]);

  return Object.freeze([...mistakeQuestions, ...fallbackQuestions].slice(0, 3));
}

function MasteryMeter({ mastery }: { readonly mastery: number }) {
  const safeMastery = clampMastery(mastery);

  return (
    <div className="wvg-v16-mastery" aria-label={`Grammar mastery ${safeMastery} of 5`}>
      <div>
        <span>MASTERY</span>
        <strong>{safeMastery} / 5</strong>
      </div>
      <div aria-hidden="true" className="wvg-v16-mastery__dots">
        {Array.from({ length: 5 }, (_, index) => (
          <span data-filled={index < safeMastery || undefined} key={index} />
        ))}
      </div>
      <p>
        {safeMastery === 5
          ? "Mastered — review any mode whenever you want."
          : "Practice results update this score automatically."}
      </p>
    </div>
  );
}

function ModeMenu({
  mastery,
  onChoose
}: {
  readonly mastery: number;
  readonly onChoose: (mode: Exclude<PracticeMode, "menu">) => void;
}) {
  return (
    <div className="wvg-v16-mode-menu">
      <button onClick={() => onChoose("guided")} type="button">
        <span>01</span>
        <div>
          <small>LEARN WITH FEEDBACK</small>
          <strong>Guided Practice</strong>
          <p>
            Work through 3 checkpoints, try an answer, reveal it, then self-check your
            understanding.
          </p>
        </div>
        <em>{mastery >= 2 ? "Reviewed" : "Build to 2/5"}</em>
      </button>

      <button onClick={() => onChoose("quiz")} type="button">
        <span>02</span>
        <div>
          <small>SCORE YOUR KNOWLEDGE</small>
          <strong>Quick Quiz</strong>
          <p>Answer 5 objective questions. Your score can improve your best saved mastery.</p>
        </div>
        <em>{mastery > 0 ? `Best ${mastery}/5` : "5 questions"}</em>
      </button>

      <button onClick={() => onChoose("challenge")} type="button">
        <span>03</span>
        <div>
          <small>EXPLAIN THE REASON</small>
          <strong>Challenge</strong>
          <p>Diagnose why common errors are wrong. A perfect challenge proves 5/5 mastery.</p>
        </div>
        <em>{mastery === 5 ? "Mastered" : "3 reasoning checks"}</em>
      </button>
    </div>
  );
}

function SessionProgress({
  current,
  label,
  total
}: {
  readonly current: number;
  readonly label: string;
  readonly total: number;
}) {
  const safeTotal = Math.max(1, total);
  const safeCurrent = Math.max(1, Math.min(current, safeTotal));

  return (
    <div className="wvg-v22-session-progress">
      <div>
        <span>{label}</span>
        <strong>
          {safeCurrent} of {safeTotal}
        </strong>
      </div>
      <progress aria-label={`${label} progress`} max={safeTotal} value={safeCurrent} />
    </div>
  );
}

function GuidedPractice({
  content,
  mastery,
  onBack,
  onMasteryChange
}: GrammarPracticeExperienceProps & { readonly onBack: () => void }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [attempt, setAttempt] = useState("");
  const [gotItCount, setGotItCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const check = content.practiceChecks[index];
  const earnedMastery = gotItCount >= 2 ? 2 : gotItCount >= 1 ? 1 : 0;
  const savedMastery = Math.max(mastery, earnedMastery);

  function recordResult(gotIt: boolean) {
    const nextGotItCount = gotIt ? gotItCount + 1 : gotItCount;
    setGotItCount(nextGotItCount);

    if (index >= content.practiceChecks.length - 1) {
      const nextEarnedMastery = nextGotItCount >= 2 ? 2 : nextGotItCount >= 1 ? 1 : 0;
      onMasteryChange(Math.max(mastery, nextEarnedMastery));
      setCompleted(true);
      return;
    }

    setIndex((current) => current + 1);
    setRevealed(false);
    setAttempt("");
  }

  function retry() {
    setIndex(0);
    setRevealed(false);
    setAttempt("");
    setGotItCount(0);
    setCompleted(false);
  }

  if (completed) {
    return (
      <div className="wvg-v16-result" aria-live="polite">
        <span>GUIDED PRACTICE COMPLETE</span>
        <strong>
          {gotItCount} / {content.practiceChecks.length} felt secure
        </strong>
        <p>
          Guided Practice can build familiarity up to 2/5 mastery. Use Quick Quiz and Challenge to
          prove higher mastery.
        </p>
        <div className="wvg-v22-result-summary">
          <article>
            <span>BEST MASTERY</span>
            <strong>{savedMastery} / 5</strong>
          </article>
          <article>
            <span>NEXT BEST STEP</span>
            <strong>{savedMastery >= 2 ? "Quick Quiz" : "Repeat Guided"}</strong>
          </article>
        </div>
        <div>
          <button onClick={retry} type="button">
            Practise again
          </button>
          <button onClick={onBack} type="button">
            Practice menu
          </button>
        </div>
      </div>
    );
  }

  if (check === undefined) return null;

  return (
    <div className="wvg-v16-session">
      <header>
        <button onClick={onBack} type="button">
          ← Practice menu
        </button>
        <span>
          GUIDED {index + 1} / {content.practiceChecks.length}
        </span>
      </header>

      <SessionProgress
        current={index + 1}
        label="Guided Practice"
        total={content.practiceChecks.length}
      />

      <article className="wvg-v16-prompt-card">
        <small>TRY IT BEFORE YOU REVEAL</small>
        <h3>{check.prompt}</h3>

        {revealed ? (
          <>
            {attempt.trim().length === 0 ? null : (
              <div className="wvg-v23-guided-attempt-summary">
                <span>YOUR ATTEMPT</span>
                <strong>{attempt.trim()}</strong>
              </div>
            )}
            <div className="wvg-v16-guided-answer" aria-live="polite">
              <span>ANSWER</span>
              <strong>{check.answer}</strong>
              <p>{check.explanation}</p>
            </div>
          </>
        ) : (
          <div className="wvg-v23-guided-attempt">
            <label>
              YOUR ANSWER · OPTIONAL, BUT TRY FIRST
              <input
                aria-label="Your guided practice answer"
                autoComplete="off"
                onChange={(event) => setAttempt(event.currentTarget.value)}
                placeholder="Type what you think the answer is..."
                type="text"
                value={attempt}
              />
            </label>
            <button
              className="wvg-v16-primary-action"
              onClick={() => setRevealed(true)}
              type="button"
            >
              Reveal answer
            </button>
          </div>
        )}
      </article>

      {revealed ? (
        <div className="wvg-v16-self-check">
          <span>How did that feel?</span>
          <button onClick={() => recordResult(true)} type="button">
            ✓ I got it
          </button>
          <button onClick={() => recordResult(false)} type="button">
            ↻ Review again later
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ChoiceSession({
  questions,
  modeLabel,
  mastery,
  onBack,
  onComplete
}: {
  readonly questions: readonly ChoiceQuestion[];
  readonly modeLabel: string;
  readonly mastery: number;
  readonly onBack: () => void;
  readonly onComplete: (score: number) => number;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | undefined>();
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finalScore, setFinalScore] = useState<number | undefined>();
  const [finalMastery, setFinalMastery] = useState<number | undefined>();
  const question = questions[index];

  function reset() {
    setIndex(0);
    setSelected(undefined);
    setAnswered(false);
    setCorrectCount(0);
    setFinalScore(undefined);
    setFinalMastery(undefined);
  }

  function checkAnswer() {
    if (selected === undefined || answered || question === undefined) return;
    setAnswered(true);
  }

  function continueSession() {
    if (!answered || question === undefined) return;
    const questionWasCorrect = selected === question.correctAnswer;
    const scoreAfterQuestion = correctCount + (questionWasCorrect ? 1 : 0);

    if (index >= questions.length - 1) {
      const savedResult = onComplete(scoreAfterQuestion);
      setFinalMastery(savedResult);
      setFinalScore(scoreAfterQuestion);
      return;
    }

    setCorrectCount(scoreAfterQuestion);
    setIndex((current) => current + 1);
    setSelected(undefined);
    setAnswered(false);
  }

  if (finalScore !== undefined) {
    const reviewCount = Math.max(0, questions.length - finalScore);
    const resultMastery = finalMastery ?? clampMastery(mastery);

    return (
      <div className="wvg-v16-result" aria-live="polite">
        <span>{modeLabel.toLocaleUpperCase("en")} COMPLETE</span>
        <strong>
          {finalScore} / {questions.length} correct
        </strong>
        <p>
          {finalScore === questions.length
            ? "Excellent. You handled every decision correctly."
            : "Review the explanations you missed, then retry when you are ready."}
        </p>
        <div className="wvg-v22-result-summary">
          <article>
            <span>BEST MASTERY</span>
            <strong>{resultMastery} / 5</strong>
          </article>
          <article>
            <span>DECISIONS TO REVIEW</span>
            <strong>{reviewCount === 0 ? "None" : reviewCount}</strong>
          </article>
        </div>
        <div>
          <button onClick={reset} type="button">
            Try again
          </button>
          <button onClick={onBack} type="button">
            Practice menu
          </button>
        </div>
      </div>
    );
  }

  if (question === undefined) return null;
  const isCorrect = selected === question.correctAnswer;

  return (
    <div className="wvg-v16-session">
      <header>
        <button onClick={onBack} type="button">
          ← Practice menu
        </button>
        <span>
          {modeLabel.toLocaleUpperCase("en")} {index + 1} / {questions.length}
        </span>
      </header>

      <SessionProgress current={index + 1} label={modeLabel} total={questions.length} />

      <article className="wvg-v16-prompt-card">
        <small>{question.prompt}</small>
        {question.context === undefined ? null : <h3>“{question.context}”</h3>}
        <div
          className="wvg-v16-choice-list"
          role="group"
          aria-label={`${modeLabel} answer choices`}
        >
          {question.choices.map((choice, choiceIndex) => (
            <button
              aria-pressed={selected === choice}
              data-correct={answered && choice === question.correctAnswer ? true : undefined}
              data-wrong={
                answered && selected === choice && choice !== question.correctAnswer
                  ? true
                  : undefined
              }
              disabled={answered}
              key={choice}
              onClick={() => setSelected(choice)}
              type="button"
            >
              <span>{String.fromCharCode(65 + choiceIndex)}</span>
              <strong>{choice}</strong>
            </button>
          ))}
        </div>

        {answered ? (
          <div
            className="wvg-v16-feedback"
            data-correct={isCorrect || undefined}
            aria-live="polite"
          >
            <strong>{isCorrect ? "✓ Correct" : "Not quite"}</strong>
            <p>{question.explanation}</p>
            {isCorrect ? null : (
              <span>
                Correct answer: <b>{question.correctAnswer}</b>
              </span>
            )}
          </div>
        ) : null}
      </article>

      <div className="wvg-v16-session__actions">
        {answered ? (
          <button className="wvg-v16-primary-action" onClick={continueSession} type="button">
            {index >= questions.length - 1 ? "See result" : "Next question →"}
          </button>
        ) : (
          <button
            className="wvg-v16-primary-action"
            disabled={selected === undefined}
            onClick={checkAnswer}
            type="button"
          >
            Check answer
          </button>
        )}
        <span>Current best mastery: {clampMastery(mastery)} / 5</span>
      </div>
    </div>
  );
}

export function GrammarPracticeExperience({
  content,
  mastery,
  onMasteryChange
}: GrammarPracticeExperienceProps) {
  const [mode, setMode] = useState<PracticeMode>("menu");
  const quickQuiz = useMemo(() => buildQuickQuiz(content), [content]);
  const challenge = useMemo(() => buildChallenge(content), [content]);
  const safeMastery = clampMastery(mastery);

  if (mode === "guided") {
    return (
      <GuidedPractice
        content={content}
        mastery={safeMastery}
        onBack={() => setMode("menu")}
        onMasteryChange={onMasteryChange}
      />
    );
  }

  if (mode === "quiz") {
    return (
      <ChoiceSession
        mastery={safeMastery}
        modeLabel="Quick Quiz"
        onBack={() => setMode("menu")}
        onComplete={(score) => {
          const nextMastery = Math.max(safeMastery, clampMastery(score));
          onMasteryChange(nextMastery);
          return nextMastery;
        }}
        questions={quickQuiz}
      />
    );
  }

  if (mode === "challenge") {
    return (
      <ChoiceSession
        mastery={safeMastery}
        modeLabel="Challenge"
        onBack={() => setMode("menu")}
        onComplete={(score) => {
          const earnedMastery = score >= 3 ? 5 : score === 2 ? 4 : score === 1 ? 3 : 0;
          const nextMastery = Math.max(safeMastery, earnedMastery);
          onMasteryChange(nextMastery);
          return nextMastery;
        }}
        questions={challenge}
      />
    );
  }

  return (
    <div className="wvg-v16-practice">
      <MasteryMeter mastery={safeMastery} />
      <ModeMenu mastery={safeMastery} onChoose={setMode} />
    </div>
  );
}
