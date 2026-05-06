import React from 'react';
import { motion } from 'framer-motion';
import { useLudoStore } from '../store';
import { PLAYER_COLORS } from '../constants';
import Dice3D from '../../../components/Dice3D';

const PlayerPanel: React.FC = () => {
  const { players, currentPlayerIndex, gamePhase, diceValue, isRolling, rollDice } = useLudoStore();

  return (
    <div className="flex flex-wrap gap-2 justify-center w-full max-w-md mx-auto flex-shrink-0">
      {players.map((player, index) => {
        const isActive = index === currentPlayerIndex && gamePhase !== 'finished';
        const colors = PLAYER_COLORS[player.color];
        const tokensHome = player.tokens.filter(t => t.state === 'home').length;
        const tokensActive = player.tokens.filter(t => t.state === 'active').length;
        const tokensYard = player.tokens.filter(t => t.state === 'yard').length;

        return (
          <motion.div
            key={player.id}
            className="glass rounded-2xl p-4 flex-1 min-w-[150px] flex justify-between items-center"
            animate={{
              borderColor: isActive ? colors.bg : 'rgba(255,255,255,0.08)',
              scale: isActive ? 1.03 : 1,
            }}
            style={{
              border: `2px solid ${isActive ? colors.bg : 'rgba(255,255,255,0.08)'}`,
              boxShadow: isActive ? `0 0 20px ${colors.glow}` : 'none',
            }}
            transition={{ duration: 0.3 }}
          >
            {index % 2 === 1 && (
              <div className="flex items-center justify-center mr-3" style={{ transform: 'scale(0.75)', transformOrigin: 'left center' }}>
                <Dice3D
                  value={isActive ? diceValue : null}
                  onRoll={rollDice}
                  disabled={!isActive || gamePhase !== 'rolling'}
                  playerColor={colors.bg}
                  isRolling={isActive && isRolling}
                />
              </div>
            )}

            <div className={`flex flex-col flex-1 min-w-0 ${index % 2 === 1 ? 'items-end text-right' : 'items-start text-left'}`}>
              <div className={`flex items-center gap-2 mb-2 w-full ${index % 2 === 1 ? 'flex-row-reverse' : 'flex-row'}`}>
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5"
                  style={{ background: colors.bg, boxShadow: `0 0 10px ${colors.bg}` }}
                />
                <span className="text-base font-bold truncate leading-none" style={{ color: isActive ? colors.bgLight : '#e2e8f0' }}>
                  {player.name}
                </span>
                {player.finishOrder > 0 && (
                  <span className={`text-xs flex-shrink-0 ${index % 2 === 1 ? 'mr-auto' : 'ml-auto'}`}>🏆 #{player.finishOrder}</span>
                )}
              </div>
              <div className={`flex gap-3 text-sm font-medium opacity-80 mt-1 w-full ${index % 2 === 1 ? 'justify-end' : 'justify-start'}`}>
                <span className="flex items-center gap-1">🏠 {tokensHome}</span>
                <span className="flex items-center gap-1">🎯 {tokensActive}</span>
                <span className="flex items-center gap-1">⬜ {tokensYard}</span>
              </div>
            </div>

            {index % 2 === 0 && (
              <div className="flex items-center justify-center ml-3" style={{ transform: 'scale(0.75)', transformOrigin: 'right center' }}>
                <Dice3D
                  value={isActive ? diceValue : null}
                  onRoll={rollDice}
                  disabled={!isActive || gamePhase !== 'rolling'}
                  playerColor={colors.bg}
                  isRolling={isActive && isRolling}
                />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default PlayerPanel;
