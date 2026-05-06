import React from 'react';
import { motion } from 'framer-motion';
import { useSNLStore } from '../store';
import Avatar from '../../../components/ui/Avatar';
import Die from '../../../components/ui/Die';

interface SNLPlayerHalfRowProps {
  slots: Array<number | null>; // index into players[] or null for an empty slot
  rotated: boolean;
  onRoll: () => void;
}

const SNLPlayerHalfRow: React.FC<SNLPlayerHalfRowProps> = ({ slots, rotated, onRoll }) => {
  const players = useSNLStore(s => s.players);
  const currentPlayerIndex = useSNLStore(s => s.currentPlayerIndex);
  const diceValue = useSNLStore(s => s.diceValue);
  const isRolling = useSNLStore(s => s.isRolling);
  const gamePhase = useSNLStore(s => s.gamePhase);

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
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
        const isActive = idx === currentPlayerIndex && gamePhase !== 'finished';
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
                ? `linear-gradient(135deg, ${player.color}26, transparent 70%)`
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isActive ? player.color : 'rgba(255,255,255,0.10)'}`,
              boxShadow: isActive ? `0 0 18px ${player.color}66` : 'none',
            }}
          >
            <Avatar color={player.color} label={player.name[0]} size={40} ring active={isActive} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 15,
                  lineHeight: 1.05,
                  color: 'var(--ink)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {player.name}
              </div>
              <div style={{ marginTop: 2, fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--ink-dim)' }}>
                {player.position === 0 ? 'Awaiting 1' : `Cell ${player.position}`}
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

export default SNLPlayerHalfRow;
