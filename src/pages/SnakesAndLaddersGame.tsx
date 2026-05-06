import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSNLStore } from '../games/snl/store';
import { SNL_PLAYER_COLORS } from '../games/snl/constants';
import SNLBoard from '../games/snl/components/SNLBoard';
import Dice3D from '../components/Dice3D';
import GameHeader from '../components/GameHeader';
import PlayerSetup from '../components/PlayerSetup';
import WinnerModal from '../components/WinnerModal';

const SnakesAndLaddersGame: React.FC = () => {
  const navigate = useNavigate();
  const {
    players,
    currentPlayerIndex,
    diceValue,
    gamePhase,
    winner,
    message,
    lastAction,
    rollDice,
    initGame,
    resetGame,
  } = useSNLStore();

  const currentPlayer = players[currentPlayerIndex];
  const currentColor = currentPlayer?.color || '#6366f1';

  if (gamePhase === 'setup') {
    return (
      <div className="flex flex-col h-full">
        <GameHeader title="Snake & Ladders" />
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <PlayerSetup
            maxPlayers={4}
            defaultColors={SNL_PLAYER_COLORS.map(c => ({ name: c.name, color: c.color }))}
            onStart={(count, names) => initGame(count, names)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <GameHeader title="Snake & Ladders" onNewGame={resetGame} />

      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-3 overflow-hidden">
        {/* Player Status Bar */}
        <div className="flex flex-wrap gap-2 justify-center w-full max-w-md">
          {players.map((player, index) => {
            const isActive = index === currentPlayerIndex && gamePhase !== 'finished';
            return (
              <motion.div
                key={player.id}
                className="glass rounded-xl px-3 py-2 flex-1 min-w-[120px]"
                animate={{
                  scale: isActive ? 1.02 : 1,
                }}
                style={{
                  border: `2px solid ${isActive ? player.color : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: isActive ? `0 0 15px ${player.color}40` : 'none',
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: player.color }} />
                  <span className="text-sm font-bold truncate">{player.name}</span>
                </div>
                <div className="text-xs opacity-60 mt-0.5">
                  Pos: {player.position || 'Start'}
                </div>
              </motion.div>
            );
          })}
        </div>

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
        <SNLBoard />

        {/* Dice */}
        <div className="flex items-center justify-center py-2">
          <Dice3D
            value={diceValue}
            onRoll={rollDice}
            disabled={gamePhase !== 'rolling'}
            playerColor={currentColor}
          />
        </div>

        {/* Last Action */}
        {lastAction && (
          <motion.div
            key={lastAction}
            className="text-xs opacity-50 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
          >
            {lastAction}
          </motion.div>
        )}
      </div>

      {/* Winner Modal */}
      <WinnerModal
        isOpen={gamePhase === 'finished' && winner !== null}
        winnerName={winner?.name || ''}
        winnerColor={winner?.color || '#fff'}
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

export default SnakesAndLaddersGame;
