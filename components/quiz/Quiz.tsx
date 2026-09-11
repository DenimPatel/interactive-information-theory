import React, { useEffect, useState } from 'react';
import { useProgress } from '../../hooks/useProgress';
import { answerQuestion, completionFor, registerQuiz } from '../../utils/progress';

export interface QuizChoiceQuestion {
  id: string;
  kind: 'choice';
  prompt: React.ReactNode;
  options: { label: React.ReactNode; correct?: boolean }[];
  explanation?: React.ReactNode;
}

export interface QuizNumericQuestion {
  id: string;
  kind: 'numeric';
  prompt: React.ReactNode;
  answer: number;
  /** Absolute tolerance; defaults to 1e-6 or the relative tolerance. */
  tolerance?: number;
  relativeTolerance?: number;
  unit?: string;
  explanation?: React.ReactNode;
}

export type QuizQuestion = QuizChoiceQuestion | QuizNumericQuestion;

interface QuizProps {
  slug: string;
  questions: QuizQuestion[];
  title?: string;
}

const toleranceFor = (question: QuizNumericQuestion): number => {
  if (question.tolerance !== undefined) return question.tolerance;
  if (question.relativeTolerance !== undefined) {
    return Math.abs(question.answer) * question.relativeTolerance;
  }
  return 1e-6;
};

const ChoiceQuestion: React.FC<{
  slug: string;
  question: QuizChoiceQuestion;
  initiallyAnswered: boolean;
}> = ({ slug, question, initiallyAnswered }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(initiallyAnswered);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);

  const correctIndex = question.options.findIndex((option) => option.correct);

  const submit = (): void => {
    if (selected === null) return;
    const correct = selected === correctIndex;
    setWasCorrect(correct);
    setSubmitted(true);
    answerQuestion(slug, question.id, correct);
  };

  return (
    <div className="it-quiz-question">
      <div className="it-quiz-prompt">{question.prompt}</div>
      <div className="it-quiz-options" role="group" aria-label="Answer options">
        {question.options.map((option, index) => {
          let state: 'correct' | 'wrong' | undefined;
          if (submitted && index === correctIndex) state = 'correct';
          if (submitted && selected === index && index !== correctIndex) state = 'wrong';
          return (
            <button
              key={index}
              type="button"
              className="it-quiz-option"
              data-state={state}
              disabled={submitted}
              onClick={() => setSelected(index)}
              aria-pressed={selected === index}
            >
              <span className="it-quiz-marker">{String.fromCharCode(65 + index)}.</span>
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
      {!submitted ? (
        <button type="button" className="btn btn-primary" onClick={submit} disabled={selected === null}>
          Check answer
        </button>
      ) : (
        <div className="it-quiz-feedback" data-state={wasCorrect === false ? 'wrong' : 'correct'}>
          {wasCorrect === false ? 'Not quite.' : 'Correct.'}
          {question.explanation ? (
            <div className="it-quiz-explanation text-muted">{question.explanation}</div>
          ) : null}
        </div>
      )}
    </div>
  );
};

const NumericQuestion: React.FC<{
  slug: string;
  question: QuizNumericQuestion;
  initiallyAnswered: boolean;
}> = ({ slug, question, initiallyAnswered }) => {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(initiallyAnswered);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);

  const submit = (): void => {
    const parsed = Number(text);
    if (!Number.isFinite(parsed)) return;
    const correct = Math.abs(parsed - question.answer) <= toleranceFor(question);
    setWasCorrect(correct);
    setSubmitted(true);
    answerQuestion(slug, question.id, correct);
  };

  return (
    <div className="it-quiz-question">
      <div className="it-quiz-prompt">{question.prompt}</div>
      <div className="it-quiz-input-row">
        <input
          className="input"
          type="text"
          inputMode="decimal"
          value={text}
          disabled={submitted}
          aria-label="Your answer"
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit();
          }}
        />
        {question.unit ? <span className="text-muted">{question.unit}</span> : null}
        {!submitted ? (
          <button type="button" className="btn btn-primary" onClick={submit} disabled={text.trim() === ''}>
            Check answer
          </button>
        ) : null}
      </div>
      {submitted ? (
        <div className="it-quiz-feedback" data-state={wasCorrect === false ? 'wrong' : 'correct'} style={{ marginTop: 10 }}>
          {wasCorrect === false ? `Not quite — the answer is ${question.answer}.` : 'Correct.'}
          {question.explanation ? (
            <div className="it-quiz-explanation text-muted">{question.explanation}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

/** A non-blocking self-check. Progress is stored under one versioned key. */
const Quiz: React.FC<QuizProps> = ({ slug, questions, title = 'Check your understanding' }) => {
  const progress = useProgress();
  const answers = progress[slug] ?? {};
  const completion = completionFor(progress, slug, questions.map((question) => question.id));

  useEffect(() => {
    registerQuiz(slug, questions.length);
  }, [slug, questions.length]);

  return (
    <section className="it-quiz" aria-label={title}>
      <div className="it-section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <span className="tag tag-neutral it-progress-tag">
          {completion.answered}/{completion.total} answered
        </span>
      </div>
      {questions.map((question) =>
        question.kind === 'choice' ? (
          <ChoiceQuestion
            key={question.id}
            slug={slug}
            question={question}
            initiallyAnswered={question.id in answers}
          />
        ) : (
          <NumericQuestion
            key={question.id}
            slug={slug}
            question={question}
            initiallyAnswered={question.id in answers}
          />
        ),
      )}
    </section>
  );
};

export default Quiz;
