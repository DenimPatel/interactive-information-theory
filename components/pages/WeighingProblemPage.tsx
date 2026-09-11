import React, { useMemo, useState } from 'react';
import LecturePage from '../shell/LecturePage';
import Quiz, { type QuizQuestion } from '../quiz/Quiz';
import Formula from '../ui/Formula';
import MetricRow from '../MetricRow';
import Callout from '../ui/Callout';

type Side = 'left' | 'right' | 'off';
type Outcome = 'left' | 'right' | 'balance';
type Kind = 'heavy' | 'light';

interface Hypothesis {
  ball: number;
  kind: Kind;
}

const HYPOTHESES: Hypothesis[] = (() => {
  const list: Hypothesis[] = [];
  for (let ball = 1; ball <= 12; ball++) {
    list.push({ ball, kind: 'heavy' });
    list.push({ ball, kind: 'light' });
  }
  return list;
})();

const LOG2_24 = Math.log2(24);
const LOG2_3 = Math.log2(3);

const sidesFromWeigh = (weigh: { left: number[]; right: number[] }): Side[] => {
  const sides: Side[] = Array(12).fill('off');
  for (const ball of weigh.left) sides[ball - 1] = 'left';
  for (const ball of weigh.right) sides[ball - 1] = 'right';
  return sides;
};

const outcomeFor = (hypothesis: Hypothesis, sides: Side[]): Outcome => {
  const side = sides[hypothesis.ball - 1];
  if (side === 'off') return 'balance';
  if (side === 'left') return hypothesis.kind === 'heavy' ? 'left' : 'right';
  return hypothesis.kind === 'heavy' ? 'right' : 'left';
};

const hypothesisLabel = (hypothesis: Hypothesis): string => `${hypothesis.ball}${hypothesis.kind === 'heavy' ? 'H' : 'L'}`;

const OUTCOMES: Outcome[] = ['left', 'right', 'balance'];
const OUTCOME_LABEL: Record<Outcome, string> = {
  left: 'Left pan down',
  right: 'Right pan down',
  balance: 'Balances',
};

interface StrategyNode {
  weigh: { left: number[]; right: number[] };
  branches: Record<Outcome, StrategyStep | null>;
}

interface StrategyLeaf {
  result: Hypothesis;
}

type StrategyStep = StrategyNode | StrategyLeaf;

const leaf = (ball: number, kind: Kind): StrategyLeaf => ({ result: { ball, kind } });

const node = (
  left: number[],
  right: number[],
  branches: Record<Outcome, StrategyStep | null>,
): StrategyNode => ({ weigh: { left, right }, branches });

const STRATEGY: StrategyNode = node([1, 2, 3, 4], [5, 6, 7, 8], {
  left: node([1, 2, 5], [3, 6, 9], {
    left: node([1], [2], { left: leaf(1, 'heavy'), right: leaf(2, 'heavy'), balance: leaf(6, 'light') }),
    right: node([3], [9], { left: leaf(3, 'heavy'), right: null, balance: leaf(5, 'light') }),
    balance: node([7], [8], { left: leaf(8, 'light'), right: leaf(7, 'light'), balance: leaf(4, 'heavy') }),
  }),
  right: node([1, 2, 5], [3, 6, 9], {
    left: node([3], [9], { left: null, right: leaf(3, 'light'), balance: leaf(5, 'heavy') }),
    right: node([1], [2], { left: leaf(2, 'light'), right: leaf(1, 'light'), balance: leaf(6, 'heavy') }),
    balance: node([7], [8], { left: leaf(7, 'heavy'), right: leaf(8, 'heavy'), balance: leaf(4, 'light') }),
  }),
  balance: node([9, 10], [11, 1], {
    left: node([9], [10], { left: leaf(9, 'heavy'), right: leaf(10, 'heavy'), balance: leaf(11, 'light') }),
    right: node([9], [10], { left: leaf(10, 'light'), right: leaf(9, 'light'), balance: leaf(11, 'heavy') }),
    balance: node([12], [1], { left: leaf(12, 'heavy'), right: leaf(12, 'light'), balance: null }),
  }),
});

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'hypotheses',
    kind: 'numeric',
    prompt: 'With 12 balls and one odd ball that may be heavier or lighter, how many distinct possibilities must be distinguished?',
    answer: 24,
    tolerance: 1e-6,
    unit: 'possibilities',
    explanation: 'Twelve choices of ball times two choices of heavier/lighter: 12 × 2 = 24.',
  },
  {
    id: 'min-weighings',
    kind: 'numeric',
    prompt: 'What is the minimum number of balance weighings needed for the 12-ball puzzle?',
    answer: 3,
    tolerance: 1e-6,
    unit: 'weighings',
    explanation: 'Two weighings give at most 3² = 9 outcome sequences, fewer than 24, so three are required.',
  },
  {
    id: 'outcomes',
    kind: 'choice',
    prompt: 'How many outcomes can a single balance weighing produce?',
    options: [
      { label: 'Two: left or right' },
      { label: 'Three: left, right, or balance', correct: true },
      { label: 'Twelve, one per ball' },
      { label: 'Twenty-four' },
    ],
    explanation: 'A balance scale has three distinguishable states, so each weighing carries at most log₂3 bits.',
  },
  {
    id: 'log2three',
    kind: 'numeric',
    prompt: 'How many bits does one weighing carry at most? Give log₂3 to three decimal places.',
    answer: 1.585,
    tolerance: 0.002,
    unit: 'bits',
    explanation: 'log₂3 ≈ 1.585 bits is the information content of an equiprobable three-way outcome.',
  },
];

const BallButton: React.FC<{ ball: number; side: Side; onClick: () => void }> = ({ ball, side, onClick }) => {
  const palette =
    side === 'left'
      ? { background: 'var(--color-accent-200)', color: 'var(--color-accent-700)' }
      : side === 'right'
        ? { background: 'var(--color-accent-2-200)', color: 'var(--color-accent-2-700)' }
        : { background: 'var(--color-surface)', color: 'var(--color-text)' };
  const place = side === 'off' ? 'off the scale' : side === 'left' ? 'on the left pan' : 'on the right pan';
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Ball ${ball} — ${place}`}
      style={{
        width: 40,
        height: 40,
        margin: 3,
        borderRadius: '50%',
        fontFamily: 'monospace',
        fontSize: 14,
        cursor: 'pointer',
        border: '2px solid var(--color-divider)',
        ...palette,
      }}
    >
      {ball}
    </button>
  );
};

const HypothesisChips: React.FC<{ items: Hypothesis[] }> = ({ items }) =>
  items.length === 0 ? (
    <span className="text-muted">none</span>
  ) : (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 4 }}>
      {items.map((hypothesis) => (
        <span
          key={hypothesisLabel(hypothesis)}
          className={hypothesis.kind === 'heavy' ? 'tag tag-accent' : 'tag tag-accent-2'}
        >
          {hypothesisLabel(hypothesis)}
        </span>
      ))}
    </span>
  );

const WeighingProblemPage: React.FC = () => {
  const [sides, setSides] = useState<Side[]>(() => Array(12).fill('off'));
  const [strategyPath, setStrategyPath] = useState<Outcome[]>([]);

  const cycleBall = (index: number): void => {
    setSides((prev) =>
      prev.map((side, i) => (i === index ? (side === 'off' ? 'left' : side === 'left' ? 'right' : 'off') : side)),
    );
  };

  const groups = useMemo(() => {
    const result: Record<Outcome, Hypothesis[]> = { left: [], right: [], balance: [] };
    for (const hypothesis of HYPOTHESES) result[outcomeFor(hypothesis, sides)].push(hypothesis);
    return result;
  }, [sides]);

  const leftCount = sides.filter((side) => side === 'left').length;
  const rightCount = sides.filter((side) => side === 'right').length;
  const balanced = leftCount === rightCount && leftCount > 0;
  const maxCount = Math.max(groups.left.length, groups.right.length, groups.balance.length);
  const bitsRemaining = Math.log2(Math.max(1, maxCount));

  const strategy = useMemo(() => {
    let step: StrategyStep | null = STRATEGY;
    let candidates: Hypothesis[] = HYPOTHESES;
    for (const outcome of strategyPath) {
      if (step === null || !('weigh' in step)) break;
      const weighSides = sidesFromWeigh(step.weigh);
      candidates = candidates.filter((hypothesis) => outcomeFor(hypothesis, weighSides) === outcome);
      step = step.branches[outcome];
    }
    return { step, candidates };
  }, [strategyPath]);

  const strategyDone = strategy.step === null || !('weigh' in strategy.step);
  const strategyNode = strategy.step !== null && 'weigh' in strategy.step ? strategy.step : null;
  const strategyLeaf = strategy.step !== null && !('weigh' in strategy.step) ? strategy.step : null;

  return (
    <LecturePage slug="weighing-problem" quiz={<Quiz slug="weighing-problem" questions={QUESTIONS} />}>
      <p className="it-body-block" style={{ maxWidth: 680 }}>
        Twelve balls look identical; one has a different weight, and you must find it and say whether
        it is heavy or light using only three balance weighings. The puzzle is really about
        information: how much a weighing can tell you, and how many possibilities you must separate.
      </p>

      <Formula
        tex="N = 12 \times 2 = 24"
        note="twelve candidate balls, each either heavier or lighter"
        label="Number of possibilities"
      />
      <Formula
        tex="\log_2 N = \log_2 24 \approx 4.585\ \text{bits}"
        note="the uncertainty that three weighings must resolve"
        label="Uncertainty of the puzzle"
      />
      <Formula
        tex="I_{\text{weigh}} \le \log_2 3 \approx 1.585\ \text{bits}"
        note="a balance has only three outcomes: left, right, balance"
        label="Information per weighing"
      />
      <Formula
        tex="3^2 = 9 < 24 \quad\Rightarrow\quad k \ge \left\lceil \frac{\log_2 24}{\log_2 3} \right\rceil = 3"
        note="two weighings cannot generate enough outcome sequences; three can (3³ = 27 ≥ 24)"
        label="The information-theoretic lower bound"
      />

      <div style={{ maxWidth: 420, margin: 'var(--space-4) 0 var(--space-6) 0' }}>
        <MetricRow label="Possibilities to distinguish" value="24" />
        <MetricRow label="Bits per weighing (at most)" value={`${LOG2_3.toFixed(3)}`} valueColor="var(--color-accent-700)" />
        <MetricRow label="Outcome sequences in 2 weighings" value="9" valueColor="var(--color-accent-2-700)" />
        <MetricRow label="Outcome sequences in 3 weighings" value="27" valueColor="var(--color-accent-2-700)" />
      </div>

      <h4>Build a weighing</h4>
      <p className="text-muted" style={{ maxWidth: 640 }}>
        Click a ball to move it: off the scale → left pan → right pan → off. Both pans must hold the
        same number of balls for a balance comparison to be meaningful.
      </p>
      <div style={{ maxWidth: 640, marginBottom: 'var(--space-3)' }}>
        {sides.map((side, index) => (
          <BallButton key={index} ball={index + 1} side={side} onClick={() => cycleBall(index)} />
        ))}
      </div>
      {!balanced ? (
        <Callout title="Unbalanced pans" tone="warn">
          Currently {leftCount} ball{leftCount === 1 ? '' : 's'} on the left and {rightCount} on the right. Add
          or remove balls until both pans match; otherwise a “balance” outcome carries no information.
        </Callout>
      ) : null}

      <div style={{ maxWidth: 640, margin: 'var(--space-4) 0' }}>
        <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>
          Worst-case uncertainty after this weighing: {maxCount} candidate{maxCount === 1 ? '' : 's'} ={' '}
          {bitsRemaining.toFixed(3)} bits
        </div>
        <div style={{ height: 16, background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(100, (bitsRemaining / LOG2_24) * 100)}%`,
              height: '100%',
              background: bitsRemaining <= LOG2_3 ? 'var(--color-accent-2-700)' : 'var(--color-accent-700)',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }} className="text-muted">
          <span style={{ fontSize: 11 }}>0 bits</span>
          <span style={{ fontSize: 11 }}>{LOG2_24.toFixed(3)} bits (start)</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-5)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
        {OUTCOMES.map((outcome) => (
          <div key={outcome} style={{ minWidth: 190, flex: 1 }}>
            <div style={{ marginBottom: 4 }}>
              <b>{OUTCOME_LABEL[outcome]}</b>{' '}
              <span className="text-muted">
                ({groups[outcome].length} left, {Math.log2(Math.max(1, groups[outcome].length)).toFixed(2)} bits)
              </span>
            </div>
            <HypothesisChips items={groups[outcome]} />
          </div>
        ))}
      </div>

      <h4>Step through an optimal strategy</h4>
      <p className="text-muted" style={{ maxWidth: 640 }}>
        This decision tree solves the puzzle in exactly three weighings. Follow an outcome at each
        step; the candidate set shrinks until one hypothesis remains.
      </p>

      <div className="card" style={{ maxWidth: 640, marginBottom: 'var(--space-4)' }}>
        <div className="card-kicker">Weighing {Math.min(strategyPath.length + 1, 3)} of 3</div>
        {strategyNode ? (
          <>
            <div className="card-body" style={{ marginBottom: 'var(--space-3)' }}>
              <div>
                <b>Left pan:</b> {strategyNode.weigh.left.join(', ')}
              </div>
              <div>
                <b>Right pan:</b> {strategyNode.weigh.right.join(', ')}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {OUTCOMES.map((outcome) => {
                const branch = strategyNode.branches[outcome];
                const weighSides = sidesFromWeigh(strategyNode.weigh);
                const count = strategy.candidates.filter((hypothesis) => outcomeFor(hypothesis, weighSides) === outcome).length;
                return (
                  <button
                    key={outcome}
                    type="button"
                    className="btn btn-secondary"
                    disabled={branch === null}
                    onClick={() => setStrategyPath((prev) => [...prev, outcome])}
                  >
                    {OUTCOME_LABEL[outcome]} ({count})
                  </button>
                );
              })}
            </div>
          </>
        ) : strategyLeaf ? (
          <div className="card-body">
            The odd ball is <b style={{ color: 'var(--color-accent-700)' }}>{hypothesisLabel(strategyLeaf.result)}</b> — ball{' '}
            {strategyLeaf.result.ball} is {strategyLeaf.result.kind}.
          </div>
        ) : null}
        <div className="card-body">
          <span className="text-muted">Candidates remaining: </span>
          <HypothesisChips items={strategy.candidates} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setStrategyPath((prev) => prev.slice(0, -1))}
          disabled={strategyPath.length === 0}
        >
          Back
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setStrategyPath([])} disabled={strategyPath.length === 0}>
          Restart strategy
        </button>
      </div>
      {strategyDone ? (
        <Callout title="Solved in three weighings">Each weighing cut the candidate set by nearly a factor of three, matching the log₂3 information bound.</Callout>
      ) : null}

      <Callout title="Why two weighings cannot work" tone="warn">
        Two weighings produce only 3² = 9 left/right/balance sequences, but there are 24 possibilities.
        Since 9 &lt; 24, some possibilities would share an outcome sequence and could never be told
        apart. Three weighings give 27 sequences, just enough.
      </Callout>
    </LecturePage>
  );
};

export default WeighingProblemPage;
