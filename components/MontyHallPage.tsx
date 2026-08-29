import React, { useCallback, useEffect, useState } from 'react';
import type { MontyDoor } from '../types';

type GameStage = 'initial' | 'playerChose' | 'hostOpened' | 'reveal';

interface GameStats {
  stayWins: number;
  stayTotal: number;
  switchWins: number;
  switchTotal: number;
}

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
    setDoors([0, 1, 2].map(id => ({ id, hasCar: id === car, isOpen: false, isPlayerChoice: false })));
    setPlayerChoice(null);
    setHostOpened(null);
    setStage('initial');
    setMessage('Pick a door.');
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  const pickDoor = (id: number) => {
    if (stage !== 'initial') return;
    setPlayerChoice(id);
    setStage('playerChose');
    setDoors(prev => prev.map(d => (d.id === id ? { ...d, isPlayerChoice: true } : d)));
    setMessage(`Door ${id + 1} picked. Host is opening a door...`);

    setTimeout(() => {
      setDoors(prevDoors => {
        const available = prevDoors.filter(d => d.id !== id && !d.hasCar);
        const hostDoor = available.length ? available[Math.floor(Math.random() * available.length)] : prevDoors.filter(d => d.id !== id)[0];
        const remaining = prevDoors.find(d => d.id !== id && d.id !== hostDoor.id)!;
        setHostOpened(hostDoor.id);
        setStage('hostOpened');
        setMessage(`Host opened Door ${hostDoor.id + 1}. Stick with Door ${id + 1} or switch to Door ${remaining.id + 1}?`);
        return prevDoors.map(d => (d.id === hostDoor.id ? { ...d, isOpen: true } : d));
      });
    }, 700);
  };

  const decide = (switched: boolean) => {
    if (playerChoice === null || hostOpened === null) return;
    const finalChoice = switched ? doors.find(d => d.id !== playerChoice && d.id !== hostOpened)!.id : playerChoice;
    const won = doors[finalChoice].hasCar;
    setStats(prev => ({
      stayWins: prev.stayWins + (!switched && won ? 1 : 0),
      stayTotal: prev.stayTotal + (!switched ? 1 : 0),
      switchWins: prev.switchWins + (switched && won ? 1 : 0),
      switchTotal: prev.switchTotal + (switched ? 1 : 0),
    }));
    setDoors(prev => prev.map(d => ({ ...d, isOpen: true })));
    setStage('reveal');
    setMessage(
      `You ${switched ? 'switched to' : 'stuck with'} Door ${finalChoice + 1}. Car was behind Door ${carLocation + 1}. You ${won ? 'WON!' : 'LOST.'}`
    );
  };

  const stayRate = stats.stayTotal ? ((stats.stayWins / stats.stayTotal) * 100).toFixed(1) : '0.0';
  const switchRate = stats.switchTotal ? ((stats.switchWins / stats.switchTotal) * 100).toFixed(1) : '0.0';

  return (
    <section>
      <div className="card-kicker">Applications</div>
      <h2>The Monty Hall Problem</h2>
      <p className="text-muted" style={{ maxWidth: 640 }}>
        Three doors, one car, two goats. Pick a door, the host reveals a goat behind another, then you choose to
        stay or switch.
      </p>

      <p style={{ textAlign: 'center', minHeight: '1.6em', margin: 'var(--space-5) 0 var(--space-4) 0' }}>{message}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--space-3)', maxWidth: 520, margin: '0 auto var(--space-5) auto' }}>
        {doors.map(door => {
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

      {stage === 'hostOpened' && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
          <button className="btn btn-secondary" onClick={() => decide(false)}>Stick</button>
          <button className="btn btn-primary" onClick={() => decide(true)}>Switch</button>
        </div>
      )}
      {stage === 'reveal' && (
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
          <button className="btn btn-primary" onClick={initGame}>Play Again</button>
        </div>
      )}

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
      <p style={{ maxWidth: 640 }}>
        Switching wins 2/3 of the time; staying wins only 1/3. Your original pick had P(car)=1/3, and that never
        changes. The host, constrained to reveal a goat that isn&rsquo;t your pick, concentrates the remaining 2/3
        probability entirely onto the one door they didn&rsquo;t open &mdash; a Bayesian update, since the
        host&rsquo;s action is shaped by what they know rather than random.
      </p>
    </section>
  );
};

export default MontyHallPage;
