import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLudoStore } from '../games/ludo/store';
import { PLAYER_COLORS } from '../games/ludo/constants';
import LudoBoard from '../games/ludo/components/LudoBoard';
import PlayerPanel from '../games/ludo/components/PlayerPanel';
import Dice3D from '../components/Dice3D';
import GameHeader from '../components/GameHeader';
import PlayerSetup from '../components/PlayerSetup';
import WinnerModal from '../components/WinnerModal';

const LUDO_COLORS = [
  { name: 'Red', color: PLAYER_COLORS.red.bg },
  { name: 'Green', color: PLAYER_COLORS.green.bg },
  { name: 'Yellow', color: PLAYER_COLORS.yellow.bg },
  { name: 'Blue', color: PLAYER_COLORS.blue.bg },
];

const LudoGame: React.FC = () => {
  const navigate = useNavigate();
  const {
    players,
    currentPlayerIndex,
    diceValue,
    gamePhase,
    winner,
    message,
    rollDice,
    initGame,
    resetGame,
  } = useLudoStore();

  const currentPlayer = players[currentPlayerIndex];
  const currentColor = currentPlayer ? PLAYER_COLORS[currentPlayer.color].bg : '#6366f1';

  const handleNewGame = () => {
    resetGame();
  };

  if (gamePhase === 'setup') {
    return (
      <div className="flex flex-col h-full">
        <GameHeader title="Ludo" onNewGame={undefined} />
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <PlayerSetup
            maxPlayers={4}
            defaultColors={LUDO_COLORS}
            onStart={(count, names) => initGame(count, names)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <GameHeader title="Ludo" onNewGame={handleNewGame} />

      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-3 overflow-hidden">
        {/* Player Panel */}
        <PlayerPanel />

        {/* Status Message Container */}
        <div className="h-20 w-full flex justify-center items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={message}
              className="glass rounded-full px-6 py-3 min-h-[3rem] flex items-center justify-center text-center text-base font-bold shadow-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              {message}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Board */}
        <LudoBoard />


      </div>

      {/* Winner Modal */}
      <WinnerModal
        isOpen={gamePhase === 'finished' && winner !== null}
        winnerName={winner?.name || ''}
        winnerColor={winner ? PLAYER_COLORS[winner.color].bg : '#fff'}
        onPlayAgain={() => {
          resetGame();
          initGame(players.length);
        }}
        onGoHome={() => {
          resetGame();
          navigate('/');
        }}
      />
    </div>
  );
};

export default LudoGame;
