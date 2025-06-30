
import React, { useState, useEffect, useCallback } from 'react';
import Card from './Card';
import ConceptExplainer from './ConceptExplainer';

interface MontyHallPageProps {
  onNavigateBack: () => void;
}

interface Door {
  id: number;
  hasCar: boolean;
  isOpen: boolean;
  isPlayerChoice: boolean;
}

type GameStage = 'initial' | 'playerChose' | 'hostOpened' | 'reveal';

interface GameStats {
  stayed: { wins: number; total: number };
  switched: { wins: number; total: number };
}

const MontyHallPage: React.FC<MontyHallPageProps> = ({ onNavigateBack }) => {
  const [doors, setDoors] = useState<Door[]>([]);
  const [carLocation, setCarLocation] = useState<number>(0);
  const [playerInitialChoice, setPlayerInitialChoice] = useState<number | null>(null);
  const [hostOpenedDoor, setHostOpenedDoor] = useState<number | null>(null);
  const [gameStage, setGameStage] = useState<GameStage>('initial');
  const [message, setMessage] = useState<string>('Pick a door.');
  const [playerSwitched, setPlayerSwitched] = useState<boolean | null>(null);
  const [stats, setStats] = useState<GameStats>({
    stayed: { wins: 0, total: 0 },
    switched: { wins: 0, total: 0 },
  });

  const initializeGame = useCallback(() => {
    const newCarLocation = Math.floor(Math.random() * 3);
    setCarLocation(newCarLocation);
    setDoors([
      { id: 0, hasCar: newCarLocation === 0, isOpen: false, isPlayerChoice: false },
      { id: 1, hasCar: newCarLocation === 1, isOpen: false, isPlayerChoice: false },
      { id: 2, hasCar: newCarLocation === 2, isOpen: false, isPlayerChoice: false },
    ]);
    setPlayerInitialChoice(null);
    setHostOpenedDoor(null);
    setGameStage('initial');
    setMessage('Pick a door.');
    setPlayerSwitched(null);
  }, []);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const handleDoorPick = (doorId: number) => {
    if (gameStage !== 'initial') return;

    setPlayerInitialChoice(doorId);
    setDoors(prevDoors => prevDoors.map(d => d.id === doorId ? { ...d, isPlayerChoice: true } : d));
    setGameStage('playerChose');
    setMessage(`You picked Door ${doorId + 1}. The host will open a door with a goat.`);

    // Host opens a door
    setTimeout(() => {
      const availableHostDoors = doors.filter(d => d.id !== doorId && !d.hasCar);
      let doorToOpenByHost: Door;

      if (availableHostDoors.length > 0) {
        doorToOpenByHost = availableHostDoors[Math.floor(Math.random() * availableHostDoors.length)];
      } else {
        // This case happens if player picked the car door, host can open any of the other two goat doors.
        const otherDoors = doors.filter(d => d.id !== doorId);
        doorToOpenByHost = otherDoors[Math.floor(Math.random() * otherDoors.length)];
      }
      
      setHostOpenedDoor(doorToOpenByHost.id);
      setDoors(prevDoors => prevDoors.map(d => d.id === doorToOpenByHost.id ? { ...d, isOpen: true } : d));
      setGameStage('hostOpened');
      const remainingDoor = doors.find(d => d.id !== doorId && d.id !== doorToOpenByHost.id);
      setMessage(`Host opened Door ${doorToOpenByHost.id + 1}. Stick with Door ${doorId + 1} or switch to Door ${remainingDoor!.id + 1}?`);
    }, 1000);
  };

  const handleDecision = (switchedChoice: boolean) => {
    if (gameStage !== 'hostOpened' || playerInitialChoice === null || hostOpenedDoor === null) return;

    setPlayerSwitched(switchedChoice);
    let finalChoice: number;

    if (switchedChoice) {
      const switchedDoor = doors.find(d => d.id !== playerInitialChoice && d.id !== hostOpenedDoor);
      finalChoice = switchedDoor!.id;
    } else {
      finalChoice = playerInitialChoice;
    }

    const playerWon = doors[finalChoice].hasCar;
    
    setStats(prevStats => {
      const newStats = { ...prevStats };
      if (switchedChoice) {
        newStats.switched.total++;
        if (playerWon) newStats.switched.wins++;
      } else {
        newStats.stayed.total++;
        if (playerWon) newStats.stayed.wins++;
      }
      return newStats;
    });

    setDoors(prevDoors => prevDoors.map(d => ({ ...d, isOpen: true })));
    setGameStage('reveal');
    setMessage(
      `You ${switchedChoice ? 'switched to' : 'stuck with'} Door ${finalChoice + 1}. ` +
      `The car was behind Door ${carLocation + 1}. You ${playerWon ? 'WON!' : 'LOST.'}`
    );
  };


  const getDoorContent = (door: Door) => {
    if (!door.isOpen) return `Door ${door.id + 1}`;
    return door.hasCar ? '🚗 Car!' : '🐐 Goat';
  };

  const getDoorAppearance = (door: Door) => {
    let baseClasses = "w-full h-32 sm:h-40 text-lg font-semibold rounded-lg shadow-md flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-105";
    if (door.isPlayerChoice && gameStage !== 'reveal' && gameStage !== 'initial' && !door.isOpen) {
      baseClasses += " border-4 border-sky-500 ring-2 ring-sky-300";
    } else if (door.isOpen) {
      baseClasses += door.hasCar ? " bg-green-400 text-white" : " bg-amber-400 text-slate-700";
      if (door.id === hostOpenedDoor) baseClasses += " opacity-70"; // Slightly fade host-opened door if it's not the final reveal
    } else {
      baseClasses += " bg-slate-300 hover:bg-slate-400 text-slate-700";
    }
    if (gameStage === 'initial' || (gameStage === 'hostOpened' && !door.isOpen && door.id !== playerInitialChoice)) {
       baseClasses += " cursor-pointer";
    } else {
       baseClasses += " cursor-not-allowed";
    }
    return baseClasses;
  };


  const setupExplanation = [
    "You're on a game show with three doors. Behind one door is a car (prize), behind the other two are goats.",
    "You pick a door (say Door 1).",
    "The host, who knows what's behind each door, opens one of the remaining doors that has a goat (say Door 3).",
    "The host then asks: \"Do you want to stick with Door 1 or switch to Door 2?\""
  ];

  const correctActionExplanation = [
    "You should always switch. Switching gives you a 2/3 probability of winning, while staying gives you only 1/3."
  ];

  const infoTheoryPerspectiveExplanation = [
    "From an information theory lens, this puzzle is about how information reduces uncertainty and updates probabilities:",
    <React.Fragment key="it-initial">
      <h4 className="font-semibold mt-3 mb-1 text-md text-slate-700">Initial State:</h4>
      <ul className="list-disc list-inside ml-2 space-y-0.5 text-sm sm:text-base">
        <li>Your door: P(car) = 1/3</li>
        <li>Other two doors combined: P(car) = 2/3</li>
        <li>Entropy is maximized across the three possibilities. This means there's maximum uncertainty about where the car is initially.</li>
      </ul>
    </React.Fragment>,
    <React.Fragment key="it-revelation">
      <h4 className="font-semibold mt-3 mb-1 text-md text-slate-700">Information Revelation:</h4>
      <p>When the host opens a door with a goat, they provide you with information. Crucially, this information is not randomly distributed – the host deliberately avoids the car. This asymmetric information revelation is key.</p>
      <p>The host's action is constrained by their knowledge and the rule that they must open a door with a goat and not your chosen door.</p>
    </React.Fragment>,
    <React.Fragment key="it-bayesian">
      <h4 className="font-semibold mt-3 mb-1 text-md text-slate-700">Bayesian Update:</h4>
      <p>The host's action doesn't change the probability that your original door has the car (still 1/3). The initial choice was made when you had 1/3 chance of being right.</p>
      <p>However, the host's action concentrates all the probability from the opened door onto the remaining unopened door (the one you didn't pick and the host didn't open). The 2/3 probability that was distributed across "the other two doors" now belongs entirely to that single remaining door.</p>
    </React.Fragment>,
     <React.Fragment key="it-content">
      <h4 className="font-semibold mt-3 mb-1 text-md text-slate-700">Information Content:</h4>
      <p>The host's revelation has different information content depending on the scenario:</p>
      <ul className="list-disc list-inside ml-2 space-y-0.5 text-sm sm:text-base">
        <li><strong>If the car is behind your chosen door:</strong> The host had two choices of doors with goats to open. The specific door they opened provides less "surprising" information about the car's location relative to your choice.</li>
        <li><strong>If the car is behind one of the other doors (not your initial pick):</strong> The host had only one choice of door to open (the one with a goat that isn't your pick and isn't the car). This action is more constrained and thus, in a way, provides more "information" pointing towards the remaining closed door.</li>
      </ul>
      <p className="mt-1">This asymmetry in the host's constraints creates the counterintuitive result. The host's action provides more specific information in scenarios where switching would win, effectively (though not intentionally from the host's perspective to help you) signaling when switching is beneficial.</p>
    </React.Fragment>
  ];

  const conclusionExplanation = [
    "The Monty Hall problem beautifully illustrates how conditional probability and information updates can produce results that violate our intuitive understanding of randomness.",
    "It highlights that new information, especially when provided under specific constraints, can drastically alter probabilities and the optimal strategy."
  ];


  return (
    <main className="max-w-4xl mx-auto space-y-6 lg:space-y-8">
      <Card>
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
          <h2 className="text-3xl font-bold text-sky-700">The Monty Hall Problem</h2>
          <button
            onClick={onNavigateBack}
            className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-colors duration-150"
            aria-label="Back to Main Concepts"
          >
            &larr; Back to Main Concepts
          </button>
        </div>
        
        <Card title="Interactive Game" className="bg-slate-50 mb-8">
          <div className="space-y-4">
            <p className="text-center text-slate-700 text-lg min-h-[2.5em]">{message}</p>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              {doors.map(door => (
                <button
                  key={door.id}
                  onClick={() => handleDoorPick(door.id)}
                  disabled={gameStage !== 'initial' || door.isOpen}
                  className={getDoorAppearance(door)}
                  aria-live="polite"
                  aria-label={`Door ${door.id + 1}${door.isPlayerChoice ? ", your choice" : ""}${door.isOpen ? (door.hasCar ? ", has car" : ", has goat") : ", closed"}`}
                >
                  <span className="text-2xl sm:text-3xl">{getDoorContent(door)}</span>
                </button>
              ))}
            </div>

            {gameStage === 'hostOpened' && (
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => handleDecision(false)}
                  className="px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg shadow hover:bg-sky-700 transition-colors"
                >
                  Stick with Door {playerInitialChoice !== null ? playerInitialChoice + 1 : ''}
                </button>
                <button
                  onClick={() => handleDecision(true)}
                  className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg shadow hover:bg-emerald-700 transition-colors"
                >
                  Switch Door
                </button>
              </div>
            )}

            {gameStage === 'reveal' && (
              <div className="text-center">
                <button
                  onClick={initializeGame}
                  className="mt-4 px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg shadow hover:bg-sky-700 transition-colors"
                >
                  Play Again
                </button>
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t border-slate-300">
              <h4 className="text-lg font-semibold text-slate-700 mb-2 text-center">Game Statistics:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-600">
                <div className="bg-white p-3 rounded-lg shadow">
                  <p className="font-medium">When Sticking:</p>
                  <p>Wins: {stats.stayed.wins} / Total: {stats.stayed.total}</p>
                  <p>Win Rate: {stats.stayed.total > 0 ? ((stats.stayed.wins / stats.stayed.total) * 100).toFixed(1) : '0.0'}%</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow">
                  <p className="font-medium">When Switching:</p>
                  <p>Wins: {stats.switched.wins} / Total: {stats.switched.total}</p>
                  <p>Win Rate: {stats.switched.total > 0 ? ((stats.switched.wins / stats.switched.total) * 100).toFixed(1) : '0.0'}%</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <ConceptExplainer
          title="The Setup"
          explanation={setupExplanation}
        />
        
        <ConceptExplainer
          title="The Correct Action"
          explanation={correctActionExplanation}
        />

        <ConceptExplainer
          title="An Information Theory Perspective"
          explanation={infoTheoryPerspectiveExplanation}
        />
        
        <ConceptExplainer
          title="Key Insight"
          explanation={conclusionExplanation}
        />
      </Card>
    </main>
  );
};

export default MontyHallPage;
