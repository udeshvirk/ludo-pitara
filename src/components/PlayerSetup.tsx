import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface PlayerSetupProps {
  maxPlayers: number;
  defaultColors: { name: string; color: string }[];
  onStart: (playerCount: number, playerNames: string[]) => void;
}

const PlayerSetup: React.FC<PlayerSetupProps> = ({ maxPlayers, defaultColors, onStart }) => {
  const [playerCount, setPlayerCount] = useState(2);
  const [names, setNames] = useState<string[]>(
    defaultColors.map((_, i) => `Player ${i + 1}`)
  );

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...names];
    newNames[index] = name;
    setNames(newNames);
  };

  const handleStart = () => {
    const trimmedNames = names.slice(0, playerCount).map((n, i) =>
      n.trim() || `Player ${i + 1}`
    );
    onStart(playerCount, trimmedNames);
  };

  return (
    <motion.div
      className="glass-strong rounded-3xl p-6 w-full max-w-sm mx-auto"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      <h3 className="text-lg font-bold mb-4 text-center" style={{ fontFamily: 'Outfit' }}>
        Game Setup
      </h3>

      {/* Player Count */}
      <div className="mb-6">
        <label className="text-sm font-medium opacity-70 mb-3 block">Players</label>
        <div className="flex gap-3">
          {Array.from({ length: maxPlayers - 1 }, (_, i) => i + 2).map(count => (
            <motion.button
              key={count}
              onClick={() => setPlayerCount(count)}
              className="flex-1 py-3 rounded-xl font-bold text-base transition-all"
              style={{
                background: playerCount === count
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : 'rgba(255,255,255,0.05)',
                border: `1px solid ${playerCount === count ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
              }}
              whileTap={{ scale: 0.95 }}
            >
              {count}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Player Names */}
      <div className="mb-6 space-y-3">
        <label className="text-sm font-medium opacity-70 block">Names</label>
        {Array.from({ length: playerCount }, (_, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ background: defaultColors[i]?.color || '#888' }}
            />
            <input
              type="text"
              value={names[i] || ''}
              onChange={e => handleNameChange(i, e.target.value)}
              placeholder={`Player ${i + 1}`}
              className="w-full py-3 px-4 rounded-xl text-base font-medium bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-400/50 transition-colors"
              maxLength={12}
            />
          </motion.div>
        ))}
      </div>

      {/* Start Button */}
      <motion.button
        onClick={handleStart}
        className="btn-primary w-full text-lg py-4 mt-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        🎲 Start Game
      </motion.button>
    </motion.div>
  );
};

export default PlayerSetup;
