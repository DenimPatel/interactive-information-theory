import React, { useCallback, useEffect, useState } from 'react';
import LecturePage from '../shell/LecturePage';
import Formula from '../ui/Formula';
import Quiz, { type QuizQuestion } from '../quiz/Quiz';
import type { MontyDoor } from '../../types';
import { FORMULAS } from '../../content/formulas';

type GameStage = 'initial' | 'playerChose' | 'hostOpened' | 'reveal';

interface GameStats {
  stayWins: number;
  stayTotal: number;
  switchWins: number;
  switchTotal: number;
}

const F = FORMULAS['monty-hall'];

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'switch-prob',
    kind: 'choice',
    prompt: 'After the host reveals a goat, what is the probability of winning if you switch?',
    options: [
      { label: '1/3' },
      { label: '1/2' },
      { label: '2/3', correct: true },
      { label: 'It depends on which goat the host reveals' },
    ],
    explanation: 'Your first pick was right with probability 1/3; the other unopened door therefore holds the car with probability 2/3.',
  },
  {
    id: 'stay-prob',
    kind: 'numeric',
    prompt: 'What is the probability of winning if you always stick, as a decimal? (3 decimal places.)',
    answer: 0.333,
    tolerance: 0.002,
    explanation: 'Sticking wins exactly when your initial 1-in-3 guess was right.',
  },
  {
    id: 'host-knowledge',
    kind: 'choice',
    prompt: 'Why does the host’s action change the odds?',
    options: [
      { label: 'The host opens a door at random' },
      { label: 'The host knows where the car is and always reveals a goat', correct: true },
      { label: 'Switching is lucky' },
      { label: 'Because there are only two doors left' },
    ],
    explanation: 'The host’s choice is constrained by knowledge of the car, so it carries information — a Bayesian update.',
  },
];

const MontyHallPage: React.FC = () => {
  const [doors, setDoors] = useState<MontyDoor[]>([]);
  const [carLocation, setCarLocation] = useState<number>(0);
  const [playerChoice, setPlayerChoice] = useState<number | null>(null);
  const [hostOpened, setHostOpened] = useState<number | null>(null);
  const [stage, setStage] = useState<GameStage>('initial');
  const [message, setMessage] = useState<string>('Pick a door.');
  const [stats, setStats] = useState<GameStats>({ stayWins: 0, stayTotal: 0, switchWins: 0, switchTotal: 0 });

  const initGame = useCallback(() => {
    const car = Math.floor(Math.random() * 3);
    setCarLocation(car);
    setDoors([0, 1, 2].map((id) => ({ id, hasCar: id === car, isOpen: false, isPlayerChoice: false })));
    setPlayerChoice(null);
    setHostOpened(null);
    setStage('initial');
    setMessage('Pick a door.');
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const pickDoor = (id: number) => {
    if (stage !== 'initial') return;
    setPlayerChoice(id);
    setStage('playerChose');
    setDoors((prev) => prev.map((door) => (door.id === id ? { ...door, isPlayerChoice: true } : door)));
    setMessage(`Door ${id + 1} picked. Host is opening a door...`);

    setTimeout(() => {
      setDoors((prevDoors) => {
        const available = prevDoors.filter((door) => door.id !== id && !door.hasCar);
        const hostDoor = available.length ? available[Math.floor(Math.random() * available.length)] : prevDoors.filter((door) => door.id !== id)[0];
        const remaining = prevDoors.find((door) => door.id !== id && door.id !== hostDoor.id)!;
        setHostOpened(hostDoor.id);
        setStage('hostOpened');
        setMessage(`Host opened Door ${hostDoor.id + 1}. Stick with Door ${id + 1} or switch to Door ${remaining.id + 1}?`);
        return prevDoors.map((door) => (door.id === hostDoor.id ? { ...door, isOpen: true } : door));
      });
    }, 700);
  };

  const decide = (switched: boolean) => {
    if (playerChoice === null || hostOpened === null) return;
    const finalChoice = switched ? doors.find((door) => door.id !== playerChoice && door.id !== hostOpened)!.id : playerChoice;
    const won = doors[finalChoice].hasCar;
    setStats((prev) => ({
      stayWins: prev.stayWins + (!switched && won ? 1 : 0),
      stayTotal: prev.stayTotal + (!switched ? 1 : 0),
      switchWins: prev.switchWins + (switched && won ? 1 : 0),
      switchTotal: prev.switchTotal + (switched ? 1 : 0),
    }));
    setDoors((prev) => prev.map((door) => ({ ...door, isOpen: true })));
    setStage('reveal');
    setMessage(
      `You ${switched ? 'switched to' : 'stuck with'} Door ${finalChoice + 1}. Car was behind Door ${carLocation + 1}. You ${won ? 'WON!' : 'LOST.'}`,
    );
  };

  const stayRate = stats.stayTotal ? ((stats.stayWins / stats.stayTotal) * 100).toFixed(1) : '0.0';
  const switchRate = stats.switchTotal ? ((stats.switchWins / stats.switchTotal) * 100).toFixed(1) : '0.0';

  return (
    <LecturePage slug="monty-hall" quiz={<Quiz slug="monty-hall" questions={QUESTIONS} />}>
      <p className="it-body-block">
        Three doors, one car, two goats. Pick a door, the host reveals a goat behind another, then you
        choose to stay or switch.
      </p>

      <p style={{ textAlign: 'center', minHeight: '1.6em', margin: 'var(--space-5) 0 var(--space-4) 0' }}>{message}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--space-3)', maxWidth: 520, margin: '0 auto var(--space-5) auto' }}>
        {doors.map((door) => {
          let content: string;
          let bg = 'var(--color-surface)';
          let borderColor = 'transparent';
          if (!door.isOpen) {
            content = `Door ${door.id + 1}`;
          } else {
            content = door.hasCar ? 'Car' : 'Goat';
            bg = door.hasCar ? 'var(--color-accent-100)' : 'var(--color-accent-2-100)';
          }
          if (door.isPlayerChoice && !door.isOpen) borderColor = 'var(--color-accent)';
          return (
            <button
              key={door.id}
              className="btn"
              onClick={() => pickDoor(door.id)}
              disabled={stage !== 'initial' || door.isOpen}
              style={{ height: 120, fontSize: 18, background: bg, border: `2px solid ${borderColor}`, borderRadius: 'var(--radius-lg)' }}
            >
              {content}
            </button>
          );
        })}
      </div>

      {stage === 'hostOpened' ? (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
          <button className="btn btn-secondary" onClick={() => decide(false)}>Stick</button>
          <button className="btn btn-primary" onClick={() => decide(true)}>Switch</button>
        </div>
      ) : null}
      {stage === 'reveal' ? (
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
          <button className="btn btn-primary" onClick={initGame}>Play Again</button>
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div className="card elev-sm" style={{ flex: 1, minWidth: 200 }}>
          <div className="card-kicker">Sticking</div>
          <div className="card-title">{stats.stayWins} / {stats.stayTotal}</div>
          <p className="card-body">Win rate {stayRate}%</p>
        </div>
        <div className="card elev-sm" style={{ flex: 1, minWidth: 200 }}>
          <div className="card-kicker">Switching</div>
          <div className="card-title">{stats.switchWins} / {stats.switchTotal}</div>
          <p className="card-body">Win rate {switchRate}%</p>
        </div>
      </div>

      <h4 style={{ marginTop: 'var(--space-6)' }}>Why You Should Always Switch</h4>
      <Formula tex={F.switch} note="switching" label="Probability of winning by switching is two thirds" />
      <Formula tex={F.stay} note="sticking" label="Probability of winning by staying is one third" />
      <p className="it-body-block">
        Your original pick had P(car) = 1/3, and that never changes. The host, constrained to reveal a
        goat that isn&rsquo;t your pick, concentrates the remaining 2/3 probability entirely onto the one
        door they didn&rsquo;t open — a Bayesian update, since the host&rsquo;s action is shaped by what
        they know rather than random.
      </p>
    </LecturePage>
  );
};

export default MontyHallPage;
