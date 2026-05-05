import React from 'react';
import { motion } from 'framer-motion';
import { useLudoStore } from '../store';
import { PLAYER_COLORS } from '../constants';

const PlayerPanel: React.FC = () => {
  const { players, currentPlayerIndex, gamePhase } = useLudoStore();

  return (
    <div className="flex flex-wrap gap-2 justify-center w-full max-w-md mx-auto">
      {players.map((player, index) => {
        const isActive = index === currentPlayerIndex && gamePhase !== 'finished';
        const colors = PLAYER_COLORS[player.color];
        const tokensHome = player.tokens.filter(t => t.state === 'home').length;
        const tokensActive = player.tokens.filter(t => t.state === 'active').length;
        const tokensYard = player.tokens.filter(t => t.state === 'yard').length;

        return (
          <motion.div
            key={player.id}
            className="glass rounded-xl px-3 py-2 flex-1 min-w-[140px]"
            animate={{
              borderColor: isActive ? colors.bg : 'rgba(255,255,255,0.08)',
              scale: isActive ? 1.02 : 1,
            }}
            style={{
              border: `2px solid ${isActive ? colors.bg : 'rgba(255,255,255,0.08)'}`,
              boxShadow: isActive ? `0 0 20px ${colors.glow}` : 'none',
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: colors.bg }}
              />
              <span className="text-sm font-bold truncate" style={{ color: isActive ? colors.bgLight : '#e2e8f0' }}>
                {player.name}
              </span>
              {player.finishOrder > 0 && (
                <span className="text-xs">🏆 #{player.finishOrder}</span>
              )}
            </div>
            <div className="flex gap-3 text-xs opacity-70">
              <span>🏠 {tokensHome}</span>
              <span>🎯 {tokensActive}</span>
              <span>⬜ {tokensYard}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default PlayerPanel;
