import React from 'react';
import { motion } from 'framer-motion';
import { useSNLStore } from '../store';
import Avatar from '../../../components/ui/Avatar';
import Die from '../../../components/ui/Die';

interface SNLPlayerHalfRowProps {
  slots: Array<number | null>; // index into players[] or null for an empty slot
  rotated: boolean;
  onRoll: () => void;
  compact?: boolean;
}

const SNLPlayerHalfRow: React.FC<SNLPlayerHalfRowProps> = ({ slots, rotated, onRoll, compact = false }) => {
  const players = useSNLStore(s => s.players);
  const currentPlayerIndex = useSNLStore(s => s.currentPlayerIndex);
  const diceValue = useSNLStore(s => s.diceValue);
  const isRolling = useSNLStore(s => s.isRolling);
  const gamePhase = useSNLStore(s => s.gamePhase);

  const avatarSize = compact ? 30 : 40;
  const dieSize = compact ? 34 : 44;
  const gap = compact ? 8 : 10;
  const padding = compact ? '7px 9px' : '10px 12px';
  const radius = compact ? 12 : 16;
  const nameSize = compact ? 13 : 15;
  const subSize = compact ? 9 : 10;

  return (
    <div
      style={{
        display: 'flex',
        gap: compact ? 10 : 12,
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
              gap,
              padding,
              borderRadius: radius,
              background: isActive
                ? `linear-gradient(135deg, ${player.color}26, transparent 70%)`
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isActive ? player.color : 'rgba(255,255,255,0.10)'}`,
              boxShadow: isActive ? `0 0 18px ${player.color}66` : 'none',
            }}
          >
            <Avatar color={player.color} label={player.name[0]} size={avatarSize} ring active={isActive} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: nameSize,
                  lineHeight: 1.05,
                  color: 'var(--ink)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {player.name}
              </div>
              <div style={{ marginTop: 2, fontFamily: 'var(--font-ui)', fontSize: subSize, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--ink-dim)' }}>
                {player.position === 0 ? 'Awaiting 1' : `Cell ${player.position}`}
              </div>
            </div>
            <Die
              value={isActive && diceValue ? diceValue : 1}
              size={dieSize}
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
