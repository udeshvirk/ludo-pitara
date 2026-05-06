import React from 'react';
import { motion } from 'framer-motion';
import { useLudoStore } from '../store';
import { PLAYER_COLORS } from '../constants';
import Avatar from '../../../components/ui/Avatar';
import Die from '../../../components/ui/Die';

interface PlayerHalfRowProps {
  slots: Array<number | null>; // index into the players[] array, or null for empty
  rotated: boolean;
  onRoll: () => void;
  isRolling: boolean;
  diceValue: number | null;
  activeIndex: number;
  gamePhase: string;
}

const PlayerHalfRow: React.FC<PlayerHalfRowProps> = ({ slots, rotated, onRoll, isRolling, diceValue, activeIndex, gamePhase }) => {
  const players = useLudoStore(s => s.players);

  return (
    <div
      style={{
        display: 'flex',
        gap: 14,
        width: '100%',
        justifyContent: 'space-around',
        transform: rotated ? 'rotate(180deg)' : 'none',
        flexShrink: 0,
      }}
    >
      {slots.map((idx, slot) => {
        if (idx === null || idx >= players.length) {
          return <div key={slot} style={{ flex: 1 }} />;
        }
        const player = players[idx];
        const colors = PLAYER_COLORS[player.color];
        const isActive = idx === activeIndex && gamePhase !== 'finished';
        const tokensHome = player.tokens.filter(t => t.state === 'home').length;

        return (
          <motion.div
            key={slot}
            animate={{ scale: isActive ? 1.02 : 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 16,
              background: isActive
                ? `linear-gradient(135deg, ${colors.bg}26, transparent 70%)`
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isActive ? colors.bg : 'rgba(255,255,255,0.10)'}`,
              boxShadow: isActive ? `0 0 18px ${colors.glow}` : 'none',
            }}
          >
            <Avatar color={colors.bg} label={player.name[0]} size={40} ring active={isActive} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 15,
                  lineHeight: 1.05,
                  color: isActive ? colors.bgLight : 'var(--ink)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {player.name}
              </div>
              <div style={{ marginTop: 2, fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--ink-dim)' }}>
                {tokensHome}/4 home {player.finishOrder > 0 ? `· #${player.finishOrder}` : ''}
              </div>
            </div>
            <Die
              value={isActive && diceValue ? diceValue : 1}
              size={44}
              active={isActive}
              rolling={isActive && isRolling}
              onClick={isActive && gamePhase === 'rolling' ? onRoll : undefined}
              disabled={!isActive || gamePhase !== 'rolling'}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

export default PlayerHalfRow;
